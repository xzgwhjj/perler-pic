/**
 * 用户统计管理器
 * 管理转换次数和创作次数的本地存储和云端同步
 */
import {
	mutations
} from '@/uni_modules/uni-id-pages/common/store.js';
const STORAGE_KEY = 'user_stats'
const SYNC_THRESHOLD = 5 // 每累计5次同步一次

// 获取本地统计数据
export const getLocalStats = () => {
	try {
		const stats = uni.getStorageSync(STORAGE_KEY)
		return stats ? JSON.parse(stats) : {
			conversion_count: 0,
			creation_count: 0,
			last_sync_time: 0,
			pending_sync: false
		}
	} catch (e) {
		console.error('读取本地统计数据失败:', e)
		return {
			conversion_count: 0,
			creation_count: 0,
			last_sync_time: 0,
			pending_sync: false
		}
	}
}

// 保存本地统计数据
const saveLocalStats = (stats) => {
	try {
		uni.setStorageSync(STORAGE_KEY, JSON.stringify(stats))
	} catch (e) {
		console.error('保存本地统计数据失败:', e)
	}
}

// 增加转换次数
export const incrementConversionCount = () => {
	const stats = getLocalStats()
	stats.conversion_count++
	stats.pending_sync = true
	saveLocalStats(stats)

	// 每5次自动同步
	if (stats.conversion_count % SYNC_THRESHOLD === 0) {
		syncStatsToCloud()
	}

	return stats.conversion_count
}

// 增加创作次数
export const incrementCreationCount = () => {
	const stats = getLocalStats()
	stats.creation_count++
	stats.pending_sync = true
	saveLocalStats(stats)

	// 每5次自动同步
	if (stats.creation_count % SYNC_THRESHOLD === 0) {
		syncStatsToCloud()
	}

	return stats.creation_count
}

// 从云端同步数据到本地
export const syncStatsFromCloud = async () => {
	try {
		const db = uniCloud.database()
		const usersTable = db.collection('uni-id-users')

		// 获取当前用户ID
		const userInfo = await uniCloud.getCurrentUserInfo()
		const uid = userInfo.uid

		if (!uid) {
			console.log('用户未登录，跳过同步')
			return null
		}

		const res = await usersTable.doc(uid).field({
			conversion_count: true,
			creation_count: true
		}).get()
		console.log('云端统计数据:', res)
		if (res.result && res.result.data && res.result.data.length > 0) {
			const cloudStats = res.result.data[0]
			const localStats = getLocalStats()

			// 取云端和本地较大的值
			const mergedStats = {
				conversion_count: Math.max(
					cloudStats.conversion_count || 0,
					localStats.conversion_count || 0
				),
				creation_count: Math.max(
					cloudStats.creation_count || 0,
					localStats.creation_count || 0
				),
				last_sync_time: Date.now(),
				pending_sync: false
			}

			saveLocalStats(mergedStats)
			console.log('从云端同步统计数据成功:', mergedStats)
			return mergedStats
		}
	} catch (e) {
		console.error('从云端同步统计数据失败:', e)
		return null
	}
}

// 上传本地数据到云端
export const syncStatsToCloud = async () => {
	try {
		const stats = getLocalStats()

		// 检查是否有待同步的数据
		if (!stats.pending_sync && stats.last_sync_time > 0) {
			console.log('没有待同步的数据')
			return true
		}

		const db = uniCloud.database()
		const usersTable = db.collection('uni-id-users')

		// 获取当前用户ID
		const userInfo = await uniCloud.getCurrentUserInfo()
		const uid = userInfo.uid

		if (!uid) {
			console.log('用户未登录，跳过上传')
			return false
		}

		const updateRes = await mutations.updateUserInfo({
			conversion_count: stats.conversion_count,
			creation_count: stats.creation_count  // 修正拼写
		}, false)
		// 上传成功后重置本地计数（保留增量）
		const newStats = {
			...stats,
			conversion_count: 0,
			creation_count: 0,
			last_sync_time: Date.now(),
			pending_sync: false
		}
		saveLocalStats(newStats)
		console.log('上传统计数据到云端成功')
		return true
	} catch (e) {
		console.error('上传统计数据到云端失败:', e)
		return false
	}
}

// 退出时强制上传
export const forceUploadStats = async () => {
	const stats = getLocalStats()
	if (stats.conversion_count > 0 || stats.creation_count > 0) {
		return await syncStatsToCloud()
	}
	return true
}

// 获取显示用的统计数据（云端+本地）
export const getDisplayStats = () => {
	const localStats = getLocalStats()
	return {
		conversion_count: localStats.conversion_count,
		creation_count: localStats.creation_count
	}
}
