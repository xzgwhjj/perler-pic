/**
 * 发现社区云函数
 * 用于发布作品到发现社区、管理浏览/导入统计
 */

'use strict';

const db = uniCloud.database()
const dbCmd = db.command
const discoveryCollection = db.collection('discovery-works')

/**
 * 发布作品到发现社区
 * @param {object} data - 作品数据
 * @param {string} authUid - 当前用户ID
 * @returns {object} 发布结果
 */
async function publishWork(data, authUid) {
	const {
		canvas_data,
		settings,
		metadata,
		preview_image,
		share_code_id = null, // 可选：关联的分享码ID
		is_public = true
	} = data

	// 验证必要字段
	if (!canvas_data || !metadata) {
		return { code: 10001, message: '缺少必要字段' }
	}

	// 创建发现作品记录
	const addRes = await discoveryCollection.add({
		share_code_id, // 关联分享码
		creator_uid: authUid || '',
		canvas_data,
		settings,
		metadata,
		preview_image: preview_image || '',
		stats: {
			view_count: 0,
			import_count: 0
		},
		is_public,
		status: 1,
		create_date: new Date(),
		update_date: new Date()
	})

	return {
		code: 0,
		message: '发布成功',
		data: {
			_id: addRes.id,
			share_code_id
		}
	}
}

/**
 * 获取发现社区作品列表
 * @param {object} params - 查询参数
 * @param {number} params.limit - 每页数量
 * @param {number} params.offset - 偏移量
 * @param {string} params.sortBy - 排序字段：create_date / view_count / import_count
 * @param {string} params.order - 排序方向：desc / asc
 * @param {array} params.tags - 标签筛选（可选）
 * @returns {object} 作品列表
 */
async function getDiscoveryList(params = {}, authUid) {
	const {
		limit = 20,
		offset = 0,
		sortBy = 'create_date',
		order = 'desc',
		tags = []
	} = params

	// 构建查询条件
	let query = discoveryCollection.where({
		is_public: true,
		status: 1
	})

	// 标签筛选
	if (tags && tags.length > 0) {
		query = query.where({
			'metadata.tags': dbCmd.in(tags)
		})
	}

	// 排序
	const orderMap = {
		'create_date': 'create_date',
		'view_count': 'stats.view_count',
		'import_count': 'stats.import_count'
	}

	const res = await query
		.orderBy(orderMap[sortBy] || 'create_date', order)
		.skip(offset)
		.limit(limit)
		.get()

	// 返回列表（不包含完整的canvas_data，减少传输量）
	const list = res.data.map(item => ({
		_id: item._id,
		share_code_id: item.share_code_id,
		creator_uid: item.creator_uid,
		metadata: item.metadata,
		preview_image: item.preview_image,
		stats: item.stats,
		create_date: item.create_date
	}))

	return {
		code: 0,
		message: '获取成功',
		data: {
			list,
			total: res.affectedDocs + offset // 粗略估算
		}
	}
}

/**
 * 获取发现作品详情
 * @param {string} workId - 作品ID
 * @returns {object} 作品详情
 */
async function getWorkDetail(workId, authUid) {
	const res = await discoveryCollection.doc(workId).get()

	if (!res.data || res.data.length === 0) {
		return { code: 10002, message: '作品不存在' }
	}

	const work = res.data[0]

	// 检查是否公开
	if (!work.is_public && work.creator_uid !== authUid) {
		return { code: 10003, message: '无权访问' }
	}

	// 增加浏览次数
	await discoveryCollection.doc(workId).update({
		'stats.view_count': dbCmd.inc(1),
		update_date: new Date()
	})

	return {
		code: 0,
		message: '获取成功',
		data: work
	}
}

/**
 * 获取作品详情（仅数据，不增加浏览次数）
 * @param {string} workId - 作品ID
 * @returns {object} 作品数据
 */
async function getWorkData(workId) {
	const res = await discoveryCollection.doc(workId).get()

	if (!res.data || res.data.length === 0) {
		return { code: 10002, message: '作品不存在' }
	}

	const work = res.data[0]

	return {
		code: 0,
		message: '获取成功',
		data: work
	}
}

/**
 * 删除发现作品
 * @param {string} workId - 作品ID
 * @param {string} authUid - 当前用户ID
 * @returns {object} 删除结果
 */
async function deleteWork(workId, authUid) {
	const res = await discoveryCollection.doc(workId).get()

	if (!res.data || res.data.length === 0) {
		return { code: 10002, message: '作品不存在' }
	}

	// 权限检查
	if (res.data[0].creator_uid !== authUid) {
		return { code: 10004, message: '无权限删除' }
	}

	await discoveryCollection.doc(workId).update({
		status: 0,
		update_date: new Date()
	})

	return {
		code: 0,
		message: '删除成功'
	}
}

/**
 * 记录导入次数
 * @param {string} workId - 作品ID
 * @returns {object} 更新结果
 */
async function recordImport(workId) {
	try {
		await discoveryCollection.doc(workId).update({
			'stats.import_count': dbCmd.inc(1),
			update_date: new Date()
		})
		return { code: 0, message: '记录成功' }
	} catch (e) {
		return { code: 10005, message: '记录失败' }
	}
}

/**
 * 获取我的发布列表
 * @param {string} authUid - 当前用户ID
 * @param {number} limit - 每页数量
 * @param {number} offset - 偏移量
 * @returns {object} 我的发布列表
 */
async function getMyWorks(authUid, limit = 20, offset = 0) {
	const res = await discoveryCollection
		.where({
			creator_uid: authUid,
			status: dbCmd.in([0, 1]) // 正常和已删除
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

/**
 * 更新作品信息
 * @param {string} workId - 作品ID
 * @param {object} updateData - 更新数据
 * @param {string} authUid - 当前用户ID
 * @returns {object} 更新结果
 */
async function updateWork(workId, updateData, authUid) {
	const res = await discoveryCollection.doc(workId).get()

	if (!res.data || res.data.length === 0) {
		return { code: 10002, message: '作品不存在' }
	}

	// 权限检查
	if (res.data[0].creator_uid !== authUid) {
		return { code: 10004, message: '无权限修改' }
	}

	// 只允许修改部分字段
	const allowedFields = ['metadata', 'is_public', 'preview_image']
	const updateObj = { update_date: new Date() }

	for (const key of allowedFields) {
		if (updateData[key] !== undefined) {
			updateObj[key] = updateData[key]
		}
	}

	await discoveryCollection.doc(workId).update(updateObj)

	return {
		code: 0,
		message: '更新成功'
	}
}

// 主入口
exports.main = async (event, context) => {
	const { action, data } = event
	const authUid = context.authUid

	let result
	switch (action) {
		case 'publish':
			result = await publishWork(data, authUid)
			break
		case 'list':
			result = await getDiscoveryList(data, authUid)
			break
		case 'detail':
			result = await getWorkDetail(data.workId, authUid)
			break
		case 'getData':
			result = await getWorkData(data.workId)
			break
		case 'delete':
			result = await deleteWork(data.workId, authUid)
			break
		case 'recordImport':
			result = await recordImport(data.workId)
			break
		case 'myList':
			result = await getMyWorks(authUid, data.limit, data.offset)
			break
		case 'update':
			result = await updateWork(data.workId, data.updateData, authUid)
			break
		default:
			result = { code: 99999, message: '未知操作' }
	}

	return result
}
