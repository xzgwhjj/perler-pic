<template>
	<view class="page-container">
		<view class="my-page">
			<!-- 登录卡片区域 -->
			<view class="login-card">
				<!-- 未登录状态 -->
				<view v-if="!isLoggedIn" class="unlogged">
					<view class="avatar-placeholder">
						<image src="/static/svg/avatar.svg" class="avatar" mode="aspectFit"></image>
					</view>
					<text class="login-tip">登录后查看更多功能</text>
					<button class="login-btn" @click="openLoginPopup">微信登录</button>
				</view>
				<!-- 已登录状态 -->
				<view v-else class="logged">
					<view class="user-info">
						<image v-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" class="user-avatar"
							mode="aspectFill"></image>
						<view v-else class="avatar-placeholder">
							<text class="avatar-text">{{ userInfo.nickName ? userInfo.nickName[0] : '我' }}</text>
						</view>
						<view class="user-details">
							<text class="user-name">{{ userInfo.nickName || '微信用户' }}</text>
							<text class="user-id">ID: {{ userInfo.userId || '----' }}</text>
						</view>
					</view>
					<button class="logout-btn" @click="handleLogout">退出登录</button>
				</view>
			</view>

			<!-- 功能列表区域 -->
			<view class="func-list">
				<view class="func-items">
					<!-- 历史记录 -->
					<view class="func-item" @click="handleToHistory">
						<image src="/static/svg/history.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">历史记录</text>
						<view v-if="historyCount > 0" class="item-badge">{{ historyCount }}</view>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>

					<!-- 我的收藏 -->
					<view class="func-item" @click="handleToCollection">
						<image src="/static/svg/collection.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">我的收藏</text>
						<view v-if="collectionCount > 0" class="item-badge">{{ collectionCount }}</view>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>

					<!-- 使用教程 -->
					<view class="func-item" @click="handleToTutorial">
						<image src="/static/svg/tutorial.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">使用教程</text>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>

					<!-- 意见反馈 -->
					<view class="func-item" @click="handleToFeedback">
						<image src="/static/svg/feedback.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">意见反馈</text>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>
				</view>


				<!-- 偏好设置 -->
				<!-- 设置列表 -->
				<view class="func-items">
					<!-- 偏好设置（子项，可按需修改） -->
					<view class="func-item" @click="handleToPrefDetail">
						<image src="/static/svg/pref.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">偏好设置</text>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>

					<!-- 清理缓存 -->
					<view class="func-item" @click="handleClearCache">
						<image src="/static/svg/trash.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">清理缓存</text>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>
					<!-- 关于 -->
					<view class="func-item" @click="handleToAbout">
						<image src="/static/svg/info.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">关于</text>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>
				</view>

				<!-- 版本号（底部居中） -->
				<view class="version">Version {{ app.globalData.version }}</view>
			</view>
		</view>

		<!-- 自定义TabBar -->
		<tabbar :current="3"></tabbar>

		<!-- 登录弹框 -->
		<login-popup ref="loginPopupRef" typeProps="weixin"></login-popup>
	</view>
</template>

<script setup>
import {
	onShow
} from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'

const app = getApp()

// 组件引用
const loginPopupRef = ref(null)

// 用户信息
const isLoggedIn = ref(false)
const isLoading = ref(false)  // 登录加载状态
const userInfo = ref({
	avatarUrl: '',
	nickName: '',
	userId: '',
	openId: '',
	unionId: ''
})

// 统计数据
const historyCount = ref(0)
const collectionCount = ref(0)

// uni-id-co 云对象
const uniIdCo = uniCloud.importObject('uni-id-co')

// 打开登录弹框
const openLoginPopup = () => {
	loginPopupRef.value?.open()
}

// 监听登录开始事件（由登录弹框触发）
uni.$on('login:start', async () => {
	await performWxLogin()
})

// 页面显示时检查登录状态
onMounted(() => {
	checkLoginStatus()
})

onShow(() => {
	// 每次进入页面时检查登录状态
	checkLoginStatus()
})

// 检查登录状态（从全局获取）
const checkLoginStatus = () => {
	const app = getApp()
	if (app.globalData.isLoggedIn && app.globalData.userInfo) {
		userInfo.value = app.globalData.userInfo
		isLoggedIn.value = true
		loadStats()
	} else {
		isLoggedIn.value = false
		userInfo.value = {
			avatarUrl: '',
			nickName: '',
			userId: '',
			openId: '',
			unionId: ''
		}
	}
}

// 加载统计数据
const loadStats = () => {
	try {
		const storedHistory = uni.getStorageSync('historyList')
		const storedCollection = uni.getStorageSync('collectionList')
		historyCount.value = storedHistory ? storedHistory.length : 0
		collectionCount.value = storedCollection ? storedCollection.length : 0
	} catch (e) {
		console.error('加载统计数据失败:', e)
	}
}

// 执行微信登录（由登录弹框触发）
const performWxLogin = async () => {
	// 防止重复点击
	if (isLoading.value) return

	isLoading.value = true

	try {
		uni.showLoading({ title: '登录中...' })

		// 1. 调用微信登录获取 code
		const loginRes = await wxLogin()

		if (!loginRes.code) {
			throw new Error('LOGIN_FAILED')
		}

		console.log('微信登录成功, code:', loginRes.code)

		// 2. 调用 uni-id-co 进行登录
		const res = await uniIdCo.loginByWeixin({ code: loginRes.code })

		console.log('登录结果:', res)

		if (res.errMsg) {
			// 微信登录失败
			throw new Error('LOGIN_FAILED')
		}

		// 3. 构建用户信息
		const newUserInfo = {
			userId: res.uid || res.userInfo?._id,
			token: res.token,
			tokenExpired: res.tokenExpired,
			openId: res.openid || res.userInfo?.openid,
			unionId: res.unionid || res.userInfo?.unionid,
			nickName: res.nickname || res.userInfo?.nickname || '',
			avatarUrl: res.avatar || res.userInfo?.avatar || '',
			shareCount: 0,
			loginTime: Date.now()
		}

		// 4. 保存用户信息到本地
		uni.setStorageSync('userInfo', newUserInfo)
		uni.setStorageSync('token', newUserInfo.token)

		userInfo.value = newUserInfo
		isLoggedIn.value = true

		// 5. 更新全局登录状态
		const app = getApp()
		if (app) {
			app.updateUserInfo(newUserInfo)
		}

		uni.hideLoading()

		// 显示欢迎信息
		const welcomeMsg = res.isNewUser ? '注册成功' : '登录成功'
		uni.showToast({
			title: welcomeMsg,
			icon: 'success'
		})

		// 加载统计数据
		loadStats()

	} catch (error) {
		uni.hideLoading()
		console.error('微信登录失败:', error)

		handleLoginError(error)
	} finally {
		isLoading.value = false
	}
}

// 微信登录 - 获取 code
const wxLogin = () => {
	return new Promise((resolve, reject) => {
		uni.login({
			provider: 'weixin',
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				reject(err)
			}
		})
	})
}

// 微信获取用户信息
const wxGetUserProfile = () => {
	return new Promise((resolve) => {
		// 新版本微信小程序需要使用 button 组件触发
		// 这里使用 getUserProfile 但允许用户拒绝
		uni.getUserProfile({
			desc: '用于完善用户资料，提供更好的服务体验',
			success: (res) => {
				resolve(res)
			},
			fail: (err) => {
				console.log('用户拒绝授权个人信息:', err)
				resolve(null)
			}
		})
	})
}

// 调用云函数进行登录
const cloudLogin = async (code, userProfile) => {
	try {
		const res = await uniCloud.callFunction({
			name: 'user-login',
			data: {
				code: code,
				nickname: userProfile?.userInfo?.nickName || '',
				avatarUrl: userProfile?.userInfo?.avatarUrl || ''
			}
		})

		console.log('云函数返回:', res)

		if (res.result.success) {
			return res.result.data
		} else {
			throw new Error(res.result.message || '云函数调用失败')
		}
	} catch (error) {
		console.error('云函数调用失败:', error)

		// 如果云函数未部署，使用本地登录作为降级方案
		if (error.errCode === 'FUNCTION_NOT_FOUND' || error.message?.includes('not found')) {
			console.log('云函数未部署，使用本地登录降级方案')
			return fallbackLocalLogin(code, userProfile)
		}

		throw error
	}
}

// 本地登录降级方案（云函数未部署时使用）
const fallbackLocalLogin = async (code, userProfile) => {
	// 生成临时用户ID
	const tempUserId = 'local_' + Date.now()

	return {
		userId: tempUserId,
		token: 'local_token_' + tempUserId,
		tokenExpired: Date.now() + 7 * 24 * 60 * 60 * 1000,
		isNewUser: true,
		userInfo: {
			openId: code, // 临时使用 code 作为标识
			unionId: '',
			nickName: userProfile?.userInfo?.nickName || '',
			avatarUrl: userProfile?.userInfo?.avatarUrl || '',
			shareCount: 0
		}
	}
}

// 处理登录错误
const handleLoginError = (error) => {
	let errorMsg = '登录失败'

	if (error.errMsg) {
		// 用户取消
		if (error.errMsg.includes('cancel')) {
			errorMsg = '取消登录'
		}
		// 用户拒绝
		else if (error.errMsg.includes('deny') || error.errMsg.includes('auth deny')) {
			errorMsg = '拒绝授权'
		}
		// 网络错误
		else if (error.errMsg.includes('network') || error.type === 'networkError') {
			errorMsg = '网络异常'
		}
		// 服务错误
		else if (error.message === 'LOGIN_FAILED') {
			errorMsg = '微信登录失败'
		}
	}

	// 如果是云函数错误
	if (error.message && error.message.includes('云函数')) {
		errorMsg = '服务器错误，请稍后重试'
	}

	uni.showToast({
		title: errorMsg,
		icon: 'none',
		duration: 2000
	})
}

// 退出登录
const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: (res) => {
			if (res.confirm) {
				// 清除本地用户信息
				uni.removeStorageSync('userInfo')
				userInfo.value = {
					avatarUrl: '',
					nickName: '',
					userId: '',
					openId: '',
					unionId: ''
				}
				isLoggedIn.value = false
				historyCount.value = 0
				collectionCount.value = 0

				// 更新全局登录状态
				const app = getApp()
				if (app) {
					app.updateUserInfo(null)
				}

				uni.showToast({
					title: '已退出登录',
					icon: 'success'
				})
			}
		}
	})
}

// 跳转到历史记录
const handleToHistory = () => {
	uni.navigateTo({
		url: '/pages/history/index'
	})
}

// 跳转到我的收藏
const handleToCollection = () => {
	uni.navigateTo({
		url: '/pages/collection/index'
	})
}

// 跳转到使用教程
const handleToTutorial = () => {
	uni.navigateTo({
		url: '/pages/tutorial/index'
	})
}

// 跳转到意见反馈
const handleToFeedback = () => {
	uni.navigateTo({
		url: '/pages/feedback/index'
	})
}

// 跳转到偏好设置页（第二张图）
const handleToSetting = () => {
	uni.navigateTo({
		url: '/pages/setting/index'
	})
}
// 跳转到偏好设置详情
const handleToPrefDetail = () => {
	console.log('跳转到偏好设置详情页')
}

// 清理缓存（uniapp官方API实现）
const handleClearCache = () => {
	uni.showModal({
		title: '提示',
		content: '确定要清理缓存吗？',
		success: (res) => {
			if (res.confirm) {
				uni.clearStorage() // 清空本地缓存
				uni.showToast({
					title: '缓存清理完成',
					icon: 'success'
				})
			}
		}
	})
}

// 跳转到关于页
const handleToAbout = () => {
	uni.navigateTo({
		url: '/pages/about/index'
	})
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme-modern.scss';

.page-container {
	width: 100%;
	min-height: 100vh;
	background: var(--bg-primary);
	display: flex;
	flex-direction: column;
}

.my-page {
	width: 100%;
	min-height: 100vh;
	padding: var(--space-xl);
	box-sizing: border-box;
	margin-bottom: calc(env(safe-area-inset-bottom) + 150rpx);
}

/* 头部标题 */
.header {
	margin-bottom: 30rpx;

	.title {
		display: block;
		font-size: 48rpx;
		font-weight: 700;
		color: #333;
		margin-bottom: 10rpx;
	}

	.sub-title {
		font-size: 28rpx;
		color: #666;
	}
}

/* 登录卡片 */
.login-card {
	border-radius: var(--radius-lg);
	padding: var(--space-xl);
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: var(--space-xl);
	box-sizing: border-box;
	background-color: #bedbff1a;
	border: 2rpx solid #bedbff33;

	.unlogged {
		padding-block: var(--space-lg);
		text-align: center;
	}

	.avatar-placeholder {
		width: 128rpx;
		height: 128rpx;
		border-radius: 50%;
		background-color: var(--text-lighter);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-lg);
		margin-inline: auto;

		.avatar {
			width: 64rpx;
			height: 64rpx;
		}
	}

	.login-tip {
		font-size: var(--text-base);
		color: var(--text-secondary);
		margin-bottom: var(--space-lg);
	}

	.login-btn {
		height: 88rpx;
		line-height: 88rpx;
		background-color: var(--text-primary);
		color: #fff;
		border-radius: 28rpx;
		font-size: var(--text-base);
		border: none;
		padding-inline: var(--space-xl);
		box-sizing: border-box;
		font-weight: 500;


		&::after {
			// 清除uniapp button默认边框
			border: none;
		}
	}

	// 已登录状态
	.logged {
		padding-block: var(--space-md);

		.user-info {
			display: flex;
			align-items: center;
			margin-bottom: var(--space-lg);

			.user-avatar {
				width: 128rpx;
				height: 128rpx;
				border-radius: 50%;
				margin-right: var(--space-lg);
			}

			.avatar-placeholder {
				width: 128rpx;
				height: 128rpx;
				border-radius: 50%;
				background-color: var(--accent-light-2);
				display: flex;
				align-items: center;
				justify-content: center;
				margin-right: var(--space-lg);

				.avatar-text {
					font-size: 48rpx;
					font-weight: 600;
					color: var(--text-primary);
				}
			}

			.user-details {
				flex: 1;

				.user-name {
					font-size: var(--text-lg);
					font-weight: 600;
					color: var(--text-primary);
					display: block;
					margin-bottom: 4rpx;
				}

				.user-id {
					font-size: var(--text-sm);
					color: var(--text-muted);
					display: block;
				}
			}
		}

		.logout-btn {
			height: 72rpx;
			line-height: 72rpx;
			background-color: var(--bg-secondary);
			color: var(--text-secondary);
			border-radius: 20rpx;
			font-size: var(--text-sm);
			border: none;

			&::after {
				border: none;
			}
		}
	}
}

/* 功能列表 */
.func-list {
	.func-items {
		margin-block-end: var(--space-xl);
	}

	.func-item {
		display: flex;
		align-items: center;
		width: 100%;
		// justify-content: space-between;
		height: 112rpx;
		padding-inline: var(--space-lg);
		box-sizing: border-box;
		border-radius: 28rpx;
		gap: 32rpx;

		.item-icon {
			width: 40rpx;
			height: 40rpx;
		}

		.arrow-icon {
			width: 32rpx;
			height: 32rpx;
		}

		.item-text {
			font-size: 30rpx;
			color: var(--text-tertiary-2);
			flex: 1;
			text-align: left;
		}

		.item-badge {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 42rpx;
			background-color: var(--accent-light-2);
			color: var(--text-primary);
			font-size: 24rpx;
			font-weight: 500;
			padding: 4rpx 16rpx;
			box-sizing: border-box;
			border-radius: var(--radius-sm);
		}
	}
}

.setting-page {
	min-height: 100vh;
	background-color: #f7f8fa;
	padding: 20rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

/* 版本号 */
.version {
	margin-top: auto; // 自动推到页面底部
	text-align: center;
	font-size: 24rpx;
	color: var(--text-muted);
}
</style>