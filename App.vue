<template>
	<view id="app">
		<router-view />
	</view>
</template>

<script>
export default {
	onLaunch() {
		console.log('拼豆工坊启动')
		this.checkLogin()
	},
	onShow() {
		console.log('App Show')
	},
	methods: {
		checkLogin() {
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo) {
				console.log('用户已登录:', userInfo.nickName)
			}
		}
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