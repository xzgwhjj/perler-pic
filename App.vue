<script>
import {
	mutations,
	store
} from '@/uni_modules/uni-id-pages/common/store.js';
import { forceUploadStats } from '@/utils/statsManager.js';
export default {
	globalData: {
		version: '1.0.0',
		userInfo: null, // 全局用户信息
		isLoggedIn: false,
		uniIdToken: '',
	},

	onLaunch() {
		console.log('拼豆工坊启动', store.hasLogin)
		this.getVersion()
		// 同步云端用户信息（包含统计数据，防止多设备登录数据不同步）
		if (store.hasLogin) {
			console.log('同步云端用户信息')
			mutations.updateUserInfo().then(() => {
				console.log('云端用户信息同步完成')
				this.initLogin()
				// 从 store.userInfo 读取统计字段并同步到本地
				const userInfo = store.userInfo || {}
				const localStats = uni.getStorageSync('user_stats') ? JSON.parse(uni.getStorageSync('user_stats')) : { conversion_count: 0, creation_count: 0, last_sync_time: 0, pending_sync: false }

				// 取云端和本地较大的值
				const cloudConversion = userInfo.conversion_count || 0
				const cloudCreation = userInfo.creation_count || 0
				const localConversion = localStats.conversion_count || 0
				const localCreation = localStats.creation_count || 0

				console.log('云端统计数据:', { cloudConversion, cloudCreation })
				console.log('本地统计数据:', { localConversion, localCreation })
				const isDifferent = cloudConversion !== localConversion || cloudCreation !== localCreation
				console.log('统计数据是否不同:', isDifferent)

				const mergedStats = {
					conversion_count: Math.max(cloudConversion, localConversion),
					creation_count: Math.max(cloudCreation, localCreation),
					last_sync_time: Date.now(),
					pending_sync: isDifferent
				}
				uni.setStorageSync('user_stats', JSON.stringify(mergedStats))
				console.log('同步统计数据成功:', mergedStats)
			})
		}
	},

	onShow() {
		// 每次进入小程序时检查登录状态
		this.checkLoginStatus()
	},

	onHide() {
		// 退出时强制上传统计数据
		if (store.hasLogin) {
			forceUploadStats()
		}
	},

	methods: {
		/**
		 * 初始化登录状态
		 */
		initLogin() {
			const loginStatus = this.getLoginStatus()
			this.globalData.isLoggedIn = loginStatus.isLoggedIn
			this.globalData.userInfo = loginStatus.userInfo
			this.globalData.uniIdToken = loginStatus.token

			if (loginStatus.isLoggedIn) {
				console.log('用户已登录:', loginStatus.userInfo?.nickName || '微信用户')
			} else {
				console.log('用户未登录')
			}
		},

		/**
		 * 获取登录状态（基于 uni-id-pages 存储）
		 * @returns {Object} { isLoggedIn, userInfo, token }
		 */
		getLoginStatus() {
			// 从 uni-id-pages 获取 token 和用户信息
			const token = uni.getStorageSync('uni_id_token') || ''
			const tokenExpired = uni.getStorageSync('uni_id_token_expired') || 0
			const uniIdUserInfo = uni.getStorageSync('uni-id-pages-userInfo') || null

			// 检查 token 是否存在且未过期
			const isTokenValid = token && tokenExpired && tokenExpired > Date.now()

			if (isTokenValid && uniIdUserInfo) {
				// 格式化用户信息
				const userInfo = {
					_id: uniIdUserInfo._id, // 用户唯一真实 ID
					nickName: uniIdUserInfo.nickname || uniIdUserInfo.username || '微信用户',
					avatarUrl: uniIdUserInfo.avatar_file?.url || uniIdUserInfo.avatar || '',
					openId: uniIdUserInfo.openid || '',
					unionId: uniIdUserInfo.unionid || '',
					mobile: uniIdUserInfo.mobile || '',
					email: uniIdUserInfo.email || '',
					username: uniIdUserInfo.username || '',
					createdAt: uniIdUserInfo.created_at || '',
					userId: this.formatToPbFixedId(uniIdUserInfo._id) // 将 _id 转换为 PB 固定长度 ID
				}
				return {
					isLoggedIn: true,
					userInfo,
					token
				}
			}

			return {
				isLoggedIn: false,
				userInfo: null,
				token: ''
			}
		},
		/**
		 * 加密用户id
		 */
		formatToPbFixedId(originalId) {
			const encoder = new TextEncoder()
			const data = encoder.encode(originalId)
			const hashArray = Array.from(data).map(b => b.toString(16).padStart(2, '0'))
			const hash = hashArray.join('').toUpperCase()
			return `PB${hash.slice(4, 10)}`
		},
		/**
		 * 检查登录状态（每次进入小程序时调用）
		 */
		checkLoginStatus() {
			const loginStatus = this.getLoginStatus()
			this.globalData.isLoggedIn = loginStatus.isLoggedIn
			this.globalData.userInfo = loginStatus.userInfo
			this.globalData.uniIdToken = loginStatus.token
		},

		/**
		 * 更新全局用户信息
		 */
		updateUserInfo(userInfo) {
			this.globalData.userInfo = userInfo
			this.globalData.isLoggedIn = !!userInfo
		},

		/**
		 * 获取版本号
		 */
		getVersion() {
			// #ifdef MP-WEIXIN
			const accountInfo = uni.getAccountInfoSync()
			if (accountInfo.miniProgram.version) {
				this.globalData.version = accountInfo.miniProgram.version
			} else {
				this.globalData.version = '1.0.0'
			}
			// #endif
		},
	}
}
</script>

<style lang="scss">
@import '@/styles/theme-modern.scss';

/* 通用点击高亮移除 */
page,
view,
text,
button,
input,
textarea,
image,
navigator,
swiper,
swiper-item {
	-webkit-tap-highlight-color: transparent;
	tap-highlight-color: transparent;
}

/* 按钮点击效果优化 */
button {
	-webkit-tap-highlight-color: transparent;
	tap-highlight-color: transparent;
	outline: none;
}

/* 输入框点击效果优化 */
input,
textarea {
	-webkit-tap-highlight-color: transparent;
	tap-highlight-color: transparent;
	outline: none;
}

page {
	background-color: var(--bg-primary);
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 全局样式重置 */
:root {
	box-sizing: border-box;
	-webkit-tap-highlight-color: transparent;
	tap-highlight-color: transparent;
}

/* 滚动条样式 */
::-webkit-scrollbar {
	width: 0;
	height: 0;
	background: transparent;
}

/* 隐藏uni-app默认的滚动条 */
scroll-view ::-webkit-scrollbar {
	display: none;
	width: 0;
	height: 0;
	background: transparent;
}

/* 全局按钮样式重置 */
button {
	border: none;
	outline: none;
	padding: 0;
	margin: 0;
	background: transparent;
	line-height: 1;

	&::after {
		border: none;
	}
}

/* 全局输入框样式重置 */
input {
	outline: none;
	border: none;
	background: transparent;
}

/* 全局图片样式 */
image {
	display: block;
}

/* 全局文本样式 */
text {
	display: block;
}

/* 动画过渡 */
page {
	transition: background-color 0.3s ease;
}

.action-btn {
	-webkit-tap-highlight-color: transparent;
	tap-highlight-color: transparent;
}
</style>