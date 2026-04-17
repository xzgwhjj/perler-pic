<script>
	import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js';
	import {
		mutations,
		store
	} from '@/uni_modules/uni-id-pages/common/store.js';
	export default {
		globalData: {
			version: '1.0.0',
			userInfo: null, // 全局用户信息
			isLoggedIn: false,
			uniIdToken: '',
		},

		onLaunch() {
			console.log('拼豆工坊启动')
			this.getVersion()
			this.initLogin()

			// 同步云端用户信息（防止多设备登录数据不同步）
			if (store.hasLogin) {
				mutations.updateUserInfo()
			}
		},

		onShow() {
			// 每次进入小程序时检查登录状态
			this.checkLoginStatus()
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