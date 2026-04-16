// 云函数: get-user-info
// 功能: 获取用户详细信息
'use strict';

exports.main = async (event, context) => {
	const {
		userId,
		token
	} = event

	let result = {
		success: false,
		message: '',
		data: null
	}

	// 参数验证
	if (!userId) {
		result.message = '缺少用户ID'
		return result
	}

	try {
		const db = uniCloud.database()
		const userCol = db.collection('users')

		// 查询用户信息
		const userInfo = await userCol.doc(userId).get()

		if (!userInfo.data || userInfo.data.length === 0) {
			result.message = '用户不存在'
			return result
		}

		const user = userInfo.data[0]

		// 获取分享统计
		const patternCol = db.collection('bead-patterns')
		const shareCount = await patternCol.where({
			authorId: userId
		}).count()

		const publicShareCount = await patternCol.where({
			authorId: userId,
			isPublic: true
		}).count()

		result.success = true
		result.message = '获取成功'
		result.data = {
			userId: user._id,
			nickName: user.nickname,
			avatarUrl: user.avatar,
			openId: user.openid_mp,
			unionId: user.unionid,
			registerTime: user.register_time,
			lastLoginTime: user.last_login_time,
			shareCount: shareCount.total,
			publicShareCount: publicShareCount.total
		}

		return result

	} catch (error) {
		console.error('获取用户信息错误:', error)
		result.message = '服务器错误'
		return result
	}
}