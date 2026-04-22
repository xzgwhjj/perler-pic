/**
 * 分享码云函数
 * 基于自增序号 + 混淆加密生成唯一分享码
 */

'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const shareCodesCollection = db.collection('share-codes')
const uniID = require('uni-id-common')

// 字符集（去除易混淆字符：0/O, 1/I/L, 9/Q, 8/B）
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 29个字符
const BASE = 29

// 固定洗牌偏移量（用于混淆序号）
const SHUFFLE_OFFSET = 13

/**
 * 根据序号生成混淆分享码
 * 原理：将序号转为29进制，然后通过固定偏移打乱
 * @param {number} seq - 自增序号
 * @returns {string} 6位混淆后的分享码
 */
function encodeSequence(seq) {
	// 1. 将序号转为29进制（最多6位）
	let code = ''
	let n = seq
	for (let i = 0; i < 6; i++) {
		code = CHARS[n % BASE] + code
		n = Math.floor(n / BASE)
		if (n === 0 && i >= 5) break
	}
	// 确保6位
	while (code.length < 6) {
		code = CHARS[0] + code
	}

	// 2. 固定偏移洗牌混淆
	code = code.split('').map(c => {
		const idx = CHARS.indexOf(c)
		return CHARS[(idx + SHUFFLE_OFFSET) % BASE]
	}).join('')

	return code
}

/**
 * 解码分享码为序号（用于验证）
 * @param {string} code - 混淆后的分享码
 * @returns {number|null} 原始序号，失败返回null
 */
function decodeSequence(code) {
	if (!code || code.length !== 6) return null

	// 1. 逆向洗牌（减偏移）
	let reversed = code.split('').map(c => {
		const idx = CHARS.indexOf(c)
		return CHARS[(idx - SHUFFLE_OFFSET + BASE) % BASE]
	}).join('')

	// 2. 29进制转回10进制
	let seq = 0
	for (let i = 0; i < reversed.length; i++) {
		const idx = CHARS.indexOf(reversed[i])
		if (idx === -1) return null
		seq = seq * BASE + idx
	}

	return seq
}

// 验证分享码格式
function validateShareCode(code) {
	if (!code || typeof code !== 'string') {
		return { valid: false, error: '分享码不能为空' }
	}
	if (code.length !== 6) {
		return { valid: false, error: '分享码长度应为6位' }
	}
	if (!/^[A-Z0-9]+$/.test(code)) {
		return { valid: false, error: '分享码格式不正确' }
	}
	return { valid: true }
}

// 获取下一个序号
async function getNextSequence() {
	const res = await shareCodesCollection.orderBy('sequence', 'desc').limit(1).get()
	if (res.data && res.data.length > 0) {
		return (res.data[0].sequence || 0) + 1
	}
	return 1
}

// 生成分享码（支持创建和更新）
async function createShareCode(data, authUid) {
	const {
		canvas_data,
		settings,
		metadata,
		original_image,
		preview_image,
		is_public = true,
		status = 1,
		expire_date,
		_id  // 传入则有值，不传则为空
	} = data

	// 如果有 _id，说明是更新
	if (_id) {
		const record = await shareCodesCollection.where({
			_id: _id
		}).get()

		if (!record.data || record.data.length === 0) {
			return { code: 10014, message: '分享码不存在' }
		}
		if (record.data[0].creator_uid !== authUid) {
			return { code: 10011, message: '无权限操作' }
		}
		await shareCodesCollection.where({
			_id: _id
		}).update({
			canvas_data,
			settings,
			metadata,
			original_image: original_image || '',
			preview_image: preview_image || '',
			is_public,
			status,
			update_date: new Date(),
			expire_date
		})
		return {
			code: 0,
			message: '分享码更新成功',
			data: { _id }
		}
	}

	// 没有 _id，正常创建新分享码
	// 1. 获取并递增序号
	const sequence = await getNextSequence()

	// 2. 根据序号生成混淆分享码
	const shareCode = encodeSequence(sequence)

	// 3. 验证生成的分享码是否已存在（理论上不会，但保险起见）
	let maxAttempts = 10
	while (maxAttempts-- > 0) {
		const exist = await shareCodesCollection.where({ share_code: shareCode }).count()
		if (exist.total === 0) break
		// 如果冲突，序号+1 重新生成
		sequence++
		shareCode = encodeSequence(sequence)
	}
	if (maxAttempts <= 0) {
		return { code: 10001, message: '生成分享码失败，请重试' }
	}

	// 4. 创建临时分享码记录
	const addRes = await shareCodesCollection.add({
		share_code: shareCode,
		sequence: sequence,
		creator_uid: authUid || '', // 当前登录用户ID，未登录则为空
		canvas_data,
		settings,
		metadata,
		original_image: original_image || '',
		preview_image: preview_image || '',
		is_public: is_public,
		status: -2, // -2=临时状态，等待确认
		create_date: new Date(),
		update_date: new Date(),
		expire_date: null
	})

	return {
		code: 0,
		message: '分享码生成成功',
		data: {
			share_code: shareCode,
			sequence: sequence,
			_id: addRes.id
		}
	}
}

// 验证分享码有效性
async function verifyShareCode(shareCode) {
	const validation = validateShareCode(shareCode)
	if (!validation.valid) {
		return { code: 10002, message: validation.error }
	}

	const res = await shareCodesCollection.where({
		share_code: shareCode.toUpperCase()
	}).get()

	if (!res.data || res.data.length === 0) {
		return { code: 10003, message: '分享码不存在' }
	}

	const record = res.data[0]

	// 检查状态
	if (record.status === -2) {
		return { code: 10004, message: '分享码待确认' }
	}
	if (record.status === 0) {
		return { code: 10005, message: '分享码已失效' }
	}
	if (record.status === -1) {
		return { code: 10006, message: '分享码已被举报' }
	}

	return {
		code: 0,
		message: '分享码有效',
		data: record
	}
}

// 确认分享码（临时状态改为正常）
async function confirmShareCode(shareCode, authUid) {
	// 先验证分享码是否存在且属于当前用户
	const record = await shareCodesCollection.where({
		share_code: shareCode.toUpperCase()
	}).get()

	if (!record.data || record.data.length === 0) {
		return { code: 10007, message: '分享码不存在' }
	}

	// 权限检查：只有创建者才能确认
	if (record.data[0].creator_uid !== authUid) {
		return { code: 10008, message: '无权限操作' }
	}

	const res = await shareCodesCollection.where({
		share_code: shareCode.toUpperCase()
	}).update({
		status: 1,
		update_date: new Date()
	})

	if (res.updated === 0) {
		return { code: 10009, message: '确认失败' }
	}

	return { code: 0, message: '分享码确认成功' }
}

// 删除分享码（取消分享）
async function deleteShareCode(shareCode, authUid) {
	// 先验证权限
	const record = await shareCodesCollection.where({
		share_code: shareCode.toUpperCase()
	}).get()

	if (!record.data || record.data.length === 0) {
		return { code: 10010, message: '分享码不存在' }
	}

	// 权限检查：只有创建者才能删除
	if (record.data[0].creator_uid !== authUid) {
		return { code: 10011, message: '无权限操作' }
	}

	const res = await shareCodesCollection.where({
		share_code: shareCode.toUpperCase()
	}).update({
		status: 0,
		update_date: new Date()
	})

	if (res.updated === 0) {
		return { code: 10008, message: '删除失败，分享码不存在' }
	}

	return { code: 0, message: '分享码已删除' }
}

// 获取分享码
async function getShareCodeById(id) {
	if (!id) return { code: 10012, message: 'ID不能为空' }
	const res = await shareCodesCollection.where({
		_id: id
	}).get()

	if (!res.data || res.data.length === 0) {
		return { code: 10003, message: '分享码不存在' }
	}

	const record = res.data[0]

	// 检查状态
	if (record.status === -2) {
		return { code: 10004, message: '分享码待确认' }
	}
	if (record.status === 0) {
		return { code: 10005, message: '分享码已失效' }
	}
	if (record.status === -1) {
		return { code: 10006, message: '分享码已被举报' }
	}

	return {
		code: 0,
		message: '分享码有效',
		data: record
	}
}

// 获取分享码详情
async function getShareCodeDetail(shareCode) {
	const result = await verifyShareCode(shareCode)
	if (result.code !== 0) {
		return result
	}

	// 统计浏览次数由 discovery_works 表处理

	return {
		code: 0,
		message: '获取成功',
		data: result.data
	}
}

// 获取用户的分享码列表
async function getMyShareCodes(limit = 10, offset = 0, authUid) {
	const res = await shareCodesCollection.where({
		creator_uid: authUid,
		status: dbCmd.in([-2, 0, 1]) // 临时、删除、正常状态
	})
		.orderBy('create_date', 'desc')
		.skip(offset)
		.limit(limit)
		.get()

	return {
		code: 0,
		message: '获取成功',
		data: res.data
	}
}

// 清理过期临时分享码（定时任务调用）
async function cleanupExpiredShareCodes() {
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
	const res = await shareCodesCollection.where({
		status: -2,
		create_date: dbCmd.lt(oneDayAgo)
	}).remove()

	return {
		code: 0,
		message: '清理完成',
		data: { deleted: res.deleted }
	}
}

// 主入口
exports.main = async (event, context) => {
	const { action, data } = event
	// 从上下文获取当前登录用户ID
	let authUid = context.authUid
	if (context.uniIdToken) {
		const uniIDIns = uniID.createInstance({ // 创建uni-id实例
			context: context,
			// config: {} // 完整uni-id配置信息，使用config.json进行配置时无需传此参数
		})
		const payload = await uniIDIns.checkToken(context.uniIdToken) // 后续使用uniIDIns调用相关接口
		console.log('payload', payload)
		if (payload.errCode === 0) {
			authUid = payload.uid
			// 如果有新的token，更新到context中，供后续接口使用
		}
	}



	console.log(`context: ${JSON.stringify(context)}, Auth UID: ${authUid}`)

	let result
	switch (action) {
		case 'create':
			result = await createShareCode(data, authUid)
			break
		case 'verify':
			result = await verifyShareCode(data.shareCode)
			break
		case 'confirm':
			result = await confirmShareCode(data.shareCode, authUid)
			break
		case 'delete':
			result = await deleteShareCode(data.shareCode, authUid)
			break
		case 'shareCodeById':
			result = await getShareCodeById(data.id)
		case 'detail':
			result = await getShareCodeDetail(data.shareCode)
			break
		case 'list':
			result = await getMyShareCodes(data.limit, data.offset, authUid)
			break
		case 'cleanup':
			result = await cleanupExpiredShareCodes()
			break
		default:
			result = { code: 99999, message: '未知操作' }
	}

	return result
}
