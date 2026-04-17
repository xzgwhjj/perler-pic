<template>
	<view class="page-container">
		<view class="my-page">
			<!-- 登录卡片区域 -->
			<view class="login-card" v-if="!isLoggedIn">
				<!-- 未登录状态 -->
				<view class="unlogged">
					<view class="avatar-placeholder">
						<image src="/static/svg/avatar.svg" class="avatar" mode="aspectFit"></image>
					</view>
					<text class="login-tip">登录后查看更多功能</text>
					<button class="login-btn" @click="openLoginPopup">微信登录</button>
				</view>
			</view>
			<template v-else>
				<!-- 用户信息卡片 -->
				<view class="user-card">
					<view class="user-header" @tap="updateUser">
						<!-- 头像 -->
						<image v-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" class="user-avatar"
							mode="aspectFill"></image>
						<view v-else class="avatar-placeholder">
							<text class="avatar-text">{{ userInfo.nickName ? userInfo.nickName[0] : '我' }}</text>
						</view>

						<!-- 用户信息 -->
						<view class="user-info">
							<text class="username">{{ userInfo.nickName || '拼豆达人' }}</text>
							<text class="user-id">ID: {{ userInfo.userId || '----' }}</text>
						</view>

						<!-- 箭头 -->
						<view class="arrow-right">
							<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
						</view>
					</view>

					<!-- 等级与进度条 -->
					<view class="level-section">
						<view class="star-tag">
							<image src="/static/svg/star.svg" class="star-icon" mode="aspectFit"></image>
						</view>
						<view class="level-content">
							<view class="level-info">
								<text class="level-text">Lv.5 高级创作者</text>
								<text class="exp-text">380/500 EXP</text>
							</view>
							<view class="progress-bar">
								<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
							</view>
						</view>

					</view>
				</view>

				<!-- 统计数据行 -->
				<view class="stats-row">
					<view class="stat-item">
						<text class="stat-number">24</text>
						<text class="stat-label">转换次数</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">8</text>
						<text class="stat-label">创作次数</text>
					</view>
					<view class="stat-item">
						<text class="stat-number">15</text>
						<text class="stat-label">历史作品</text>
					</view>
				</view>
			</template>
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
import { computed, onMounted, ref } from 'vue'

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

// 监听是否登录成功,并更新用户信息
uni.$on('uni-id-pages-login-success', () => {
	console.log('登录成功，更新用户信息')
	checkLoginStatus()
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
	const loginStatus = app.getLoginStatus()

	if (loginStatus.isLoggedIn && loginStatus.userInfo) {
		userInfo.value = loginStatus.userInfo
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

// 修改个人信息（示例：重新获取用户信息）
const updateUser = async () => {
	uni.navigateTo({
		url: '/uni_modules/uni-id-pages/pages/userinfo/userinfo'
	})
}

// 经验数据（可改为接口获取的响应式变量）
const currentExp = 380
const maxExp = 500

// 计算进度条百分比
const progressPercent = computed(() => {
	return (currentExp / maxExp) * 100
})

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

.arrow-icon {
	width: 32rpx;
	height: 32rpx;
}

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

	.page-container {
		padding: 20rpx;
		background-color: #f5f7fa;
		min-height: 100vh;
	}
}

/* 用户卡片 */
.user-card {
	background-color: var(--bg-card-2);
	border-radius: var(--radius-lg);
	padding: var(--space-xl);
	margin-bottom: var(--space-xl);
	border: 2rpx solid var(--border-dark);

	.user-header {
		display: flex;
		align-items: center;
		margin-bottom: var(--space-lg);
		gap: var(--space-lg);

		.user-avatar {
			width: 128rpx;
			height: 128rpx;
			border-radius: 50%;
			flex-shrink: 0;
			box-shadow: var(--shadow-lg);
		}

		.avatar-placeholder {
			width: 128rpx;
			height: 128rpx;
			border-radius: 50%;
			background-color: var(--accent-light-2);
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			box-shadow: var(--shadow-lg);

			.avatar-text {
				font-size: 48rpx;
				font-weight: 600;
				color: var(--text-primary);
			}
		}

		.avatar {
			width: 120rpx;
			height: 120rpx;
			border-radius: 50%;
			background: linear-gradient(135deg, #a8d0ff, #6fa8e8);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 20rpx;

			.avatar-text {
				font-size: 40rpx;
				color: #ffffff;
				font-weight: bold;
			}
		}

		.user-info {
			flex: 1;
			display: flex;
			flex-direction: column;

			.username {
				font-size: 34rpx;
				font-weight: 600;
				color: var(--text-primary);
				margin-bottom: 8rpx;
			}

			.user-id {
				font-size: 26rpx;
				color: var(--text-secondary);
			}
		}

		.arrow-right {
			width: 72rpx;
			height: 72rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}

	}

	/* 等级进度条区域 */
	.level-section {
		border-radius: 20rpx;
		padding-block: var(--space-sm);
		padding-inline: var(--space-md);
		box-sizing: border-box;
		position: relative;
		background-image: linear-gradient(to right, var(--bg-card-2), transparent);
		border: 2rpx solid var(--border-dark);
		gap: 16rpx;
		display: flex;
		align-items: center;

		.star-tag {
			width: 48rpx;
			height: 48rpx;
			background-image: linear-gradient(to bottom right, #fbbf24, #f59e0b);
			border-radius: 8rpx;
			display: flex;
			align-items: center;
			justify-content: center;

			.star-icon {
				width: 28rpx;
				height: 28rpx;
			}
		}

		.level-content {
			flex: 1;

			.level-info {
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin-bottom: 8rpx;
				font-size: 22rpx;

				.level-text {
					color: var(--text-tertiary-2);
					font-weight: 500;
				}

				.exp-text {
					color: var(--text-secondary);
				}
			}

		}

		.progress-bar {
			width: 100%;
			height: 12rpx;
			background-color: var(--accent-light);
			border-radius: var(--radius-xl);
			overflow: hidden;

			.progress-fill {
				height: 100%;
				background-image: linear-gradient(to right, #bedbff, #93b5d1);
				transition: width 0.3s ease;
			}
		}
	}
}

/* 统计数据行 */
.stats-row {
	gap: 24rpx;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	display: grid;
	margin-bottom: var(--space-xl);

	.stat-item {
		background-color: var(--text-lighter-2);
		border-radius: 28rpx;
		padding: var(--space-lg);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
		text-align: center;
		border: 2rpx solid var(--text-lighter);

		.stat-number {
			font-size: 44rpx;
			font-weight: 600;
			color: var(--text-primary);
			margin-bottom: 8rpx;
		}

		.stat-label {
			font-size: 24rpx;
			color: var(--text-secondary);
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