<template>
	<view class="page-container">
		<view class="my-page">
			<!-- 登录卡片区域 -->
			<view class="login-card">
				<!-- 未登录状态 -->
				<view v-if="true" class="unlogged">
					<view class="avatar-placeholder">
						<image src="/static/svg/avatar.svg" class="avatar" mode="aspectFit"></image>
					</view>
					<text class="login-tip">登录后查看更多功能</text>
					<button class="login-btn" @click="handleWxLogin">微信登录</button>
				</view>
				<view v-else>
					<text class="login-tip">已登录</text>
				</view>
			</view>

			<!-- 功能列表区域 -->
			<view class="func-list">
				<view class="func-items">
					<!-- 历史记录 -->
					<view class="func-item" @click="handleToHistory">
						<image src="/static/svg/history.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">历史记录</text>
						<view class="item-badge">24</view>
						<image src="/static/svg/arrow4.svg" class="arrow-icon" mode="aspectFit"></image>
					</view>

					<!-- 我的收藏 -->
					<view class="func-item" @click="handleToCollection">
						<image src="/static/svg/collection.svg" class="item-icon" mode="aspectFit"></image>
						<text class="item-text">我的收藏</text>
						<view class="item-badge">8</view>
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
				<view class="version">Version {{app.globalData.version}}</view>
			</view>
		</view>

		<!-- 自定义TabBar -->
		<tabbar :current="3"></tabbar>
	</view>
</template>

<script setup>
const app = getApp();
// 微信登录（后续补全登录逻辑）
const handleWxLogin = () => {
	console.log('触发微信登录')
	// 示例：uni.login() + 后端接口校验
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