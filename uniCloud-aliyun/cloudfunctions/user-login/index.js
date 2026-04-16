// 云函数: user-login
// 功能: 通过微信 code 换取 openid，并创建/获取用户信息
'use strict';

exports.main = async (event, context) => {
	const {
		code,        // 微信登录 code
		nickname,    // 用户昵称（可选）
		avatarUrl    // 用户头像（可选）
	} = event

	// 返回结果
	let result = {
		success: false,
		message: '',
		data: null
	}

	// 参数验证
	if (!code) {
		result.message = '缺少登录凭证'
		return result
	}

	try {
		// 调用微信接口获取 openid 和 session_key
		const wxLoginUrl = 'https://api.weixin.qq.com/sns/jscode2session'
		const appId = context.APPID // 小程序 AppID
		const appSecret = context.APPSECRET // 小程序 AppSecret（需要在云函数环境变量中配置）

		// 如果没有配置 AppSecret，使用云端调用的方式
		let wxResult
		try {
			// 云函数环境下的微信接口调用
			const httpRes = await uniCloud.httpclient.request(wxLoginUrl, {
				method: 'GET',
				data: {
					appid: appId,
					secret: appSecret,
					js_code: code,
					grant_type: 'authorization_code'
				},
				dataType: 'json'
			})
			wxResult = httpRes.data
		} catch (httpError) {
			// 如果云端调用失败，尝试使用 uniCloud 的微信登录统一服务
			const uniId = require('uni-id')
			// 使用 uni-id 的微信登录
			const loginRes = await uniId.loginByWeixin({
				code: code,
				nickname: nickname,
				avatar: avatarUrl
			})

			if (loginRes.code === 0) {
				// 登录成功
				const db = uniCloud.database()
				const userCol = db.collection('uni-id-users')

				// 查询用户信息
				const userInfo = await userCol.doc(loginRes.uid).field({
					nickname: true,
					avatar: true,
					openid: true,
					unionid: true,
					username: true,
					register_date: true
				}).get()

				result.success = true
				result.message = '登录成功'
				result.data = {
					userId: loginRes.uid,
					token: loginRes.token,
					tokenExpired: loginRes.tokenExpired,
					userInfo: userInfo.data[0] || {}
				}
				return result
			} else {
				result.message = loginRes.message || '微信登录失败'
				return result
			}
		}

		// 检查微信接口返回
		if (wxResult.errcode) {
			console.error('微信接口返回错误:', wxResult)
			result.message = getWxErrorMessage(wxResult.errcode)
			return result
		}

		const openid = wxResult.openid
		const session_key = wxResult.session_key
		const unionid = wxResult.unionid || ''

		if (!openid) {
			result.message = '获取用户标识失败'
			return result
		}

		// 操作数据库
		const db = uniCloud.database()
		const userCol = db.collection('users') // 用户表

		// 查询是否已存在该用户
		let userDoc = await userCol.where({
			openid_mp: openid
		}).limit(1).get()

		let userId
		let isNewUser = false

		if (userDoc.data && userDoc.data.length > 0) {
			// 用户已存在，更新信息
			userId = userDoc.data[0]._id
			await userCol.doc(userId).update({
				last_login_time: Date.now(),
				login_count: db.command.inc(1)
			})
		} else {
			// 新用户，创建记录
			isNewUser = true
			const addRes = await userCol.add({
				openid_mp: openid,
				unionid: unionid,
				nickname: nickname || '',
				avatar: avatarUrl || '',
				register_time: Date.now(),
				last_login_time: Date.now(),
				login_count: 1,
				status: 1, // 1: 正常
				share_count: 0,
				public_share_count: 0,
				private_share_count: 0
			})
			userId = addRes.id
		}

		// 获取完整用户信息
		const finalUserInfo = await userCol.doc(userId).get()
		const userData = finalUserInfo.data[0] || {}

		// 生成自定义 token（也可以使用 jwt）
		const token = generateToken(openid, userId)

		result.success = true
		result.message = isNewUser ? '注册成功' : '登录成功'
		result.data = {
			userId: userId,
			token: token,
			tokenExpired: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
			isNewUser: isNewUser,
			userInfo: {
				nickName: userData.nickname,
				avatarUrl: userData.avatar,
				openId: openid,
				unionId: unionid,
				registerTime: userData.register_time,
				shareCount: userData.share_count || 0
			}
		}

		return result

	} catch (error) {
		console.error('云函数执行错误:', error)
		result.message = '服务器错误: ' + (error.message || '未知错误')
		return result
	}
}

// 生成简单的 token
function generateToken(openid, userId) {
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2)
	return `${timestamp}_${random}_${userId}`
}

// 微信错误码转换
function getWxErrorMessage(errcode) {
	const errorMap = {
		40029: 'code 无效',
		45011: '频率限制，每分钟 60 次',
		40226: '高安全性等级，用户未绑定手机号或无法获取',
		-1: '系统繁忙',
		40013: 'AppID 无效'
	}
	return errorMap[errcode] || `微信错误码: ${errcode}`
}
