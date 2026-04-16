<template>
	<uni-popup ref="popupRef" type="bottom" :mask-click="true" @change="onPopupChange">
		<view class="login-popup">
			<!-- 关闭按钮 -->
			<view class="close-btn" @click="closePopup">
				<text class="close-icon">✕</text>
			</view>

			

			<!-- 标题 -->
			<view class="popup-header">
				<text class="popup-title">登录体验更多功能</text>
				<text class="popup-subtitle">登录后可以公开分享你的作品</text>
			</view>
			
			<withoutpwd></withoutpwd>

			<!-- 微信登录按钮 -->
		<!-- 	<button class="wechat-btn" :disabled="isLoading" @click="handleWechatLogin">
				<image src="/static/logo.png" class="wechat-icon" mode="aspectFit"></image>
				<text v-if="!isLoading">微信一键登录</text>
				<text v-else>登录中...</text>
			</button> -->
<!-- 
			<template v-if="['apple','weixin', 'weixinMobile', 'huawei', 'huaweiMobile'].includes(type)">
				<view class="quickLogin">
					<view class="wechat-btn">
						<text v-if="type !== 'weixinMobile' && type !== 'huaweiMobile'" @click="quickLogin">微信一键登录</text>
					</view>
					<uni-id-pages-agreements scope="register" ref="agreements"></uni-id-pages-agreements>
				</view>
			</template> -->

			<!-- 隐私协议勾选 -->
	<!-- 		<view class="agreement-row">
				<checkbox-group @change="onAgreementChange">
					<label class="agreement-label">
						<checkbox value="agree" :checked="isAgreed" color="#07C160" style="transform: scale(0.8)" />
						<text class="agreement-text">
							我已阅读并同意
							<text class="link" @click.stop="openPrivacy">《隐私政策》</text>
							和
							<text class="link" @click.stop="openTerms">《用户协议》</text>
						</text>
					</label>
				</checkbox-group>
			</view> -->

			<!-- 温馨提示 -->
			<!-- <view class="tips">
				<text class="tips-text">登录即表示你同意我们的服务条款</text>
			</view> -->
			<!-- 固定定位的快捷登录按钮 -->
			<!-- <uni-id-pages-fab-login ref="uniFabLogin"></uni-id-pages-fab-login> -->
		</view>
	</uni-popup>
</template>

<script setup>
	import {
		computed,
		onMounted,
		ref
	} from 'vue'
	import {
		onLoad
	} from '@dcloudio/uni-app'
	import withoutpwd from '@/uni_modules/uni-id-pages/pages/login/login-withoutpwdnew.vue'
	import config from '@/uni_modules/uni-id-pages/config.js'

	const props = defineProps({
		typeProps: {
			type: String,
			default: ''
		}
	})

	const popupRef = ref(null)
	const isAgreed = ref(false)
	const isLoading = ref(false)
	let type = ref('')
	const uniFabLogin = ref(null)
	const agreements = ref(null)

	const loginTypes = computed(() => {
		return config.loginTypes
	})

	onMounted(() => {
		//获取通过url传递的参数type设置当前登录方式，如果没传递直接默认以配置的登录
		type.value = props.typeProps || config.loginTypes[0]

		console.log("type.value: -----------", type.value);
	})
	
	// const showAgreementModal = () => {
	// 	agreements.value.popup()
	// }

	// 弹窗状态变化
	const onPopupChange = (e) => {
		if (e.show) {
			// 弹框打开，隐藏 tabbar
			uni.$emit('hide-tabbar')
		} else {
			// 弹框关闭，显示 tabbar
			uni.$emit('show-tabbar')
			isLoading.value = false
		}
	}

	// 打开弹窗
	const open = () => {
		popupRef.value?.open()
	}

	// 关闭弹窗
	const closePopup = () => {
		popupRef.value?.close()
	}
	
	// 监听是否登录成功
	uni.$on('uni-id-pages-login-success', () => {
		console.log('登录成功，关闭登录弹窗')
		closePopup()
	})

	// 协议勾选变化
	const onAgreementChange = (e) => {
		isAgreed.value = e.detail.value.includes('agree')
	}

	// 打开隐私政策
	const openPrivacy = () => {
		uni.navigateTo({
			url: '/pages/privacy/index'
		})
	}

	// 打开用户协议
	const openTerms = () => {
		uni.navigateTo({
			url: '/pages/terms/index'
		})
	}

	const quickLogin = (e) => {
		let options = {}
		console.log(e)
		if (e.detail?.code) {
			options.phoneNumberCode = e.detail.code
		}

		if ((type.value === 'weixinMobile' || type.value === 'huaweiMobile') && !e.detail?.code) {
			uni.showToast({
				title: String(e.detail.errMsg),
				icon: 'none'
			});
			return
		}
		
		console.log("uniFabLogin.value: -----------", uniFabLogin.value);

		uniFabLogin.value.login_before(type.value, true, options)
	}

	// 微信登录
	const handleWechatLogin = async () => {
		if (!isAgreed.value) {
			uni.showToast({
				title: '请先阅读并同意隐私协议',
				icon: 'none'
			})
			return
		}

		isLoading.value = true

		try {
			uni.$emit('login:start')
			closePopup()
		} catch (error) {
			console.error('登录失败:', error)
			uni.showToast({
				title: '登录失败，请重试',
				icon: 'none'
			})
		} finally {
			isLoading.value = false
		}
	}

	// 暴露方法给父组件
	defineExpose({
		open,
		close: closePopup
	})
</script>

<style lang="scss" scoped>
	.login-popup {
		// 确保弹框层级高于tabbar
		z-index: 1001;
		position: relative;
		background: #fff;
		border-radius: 32rpx 32rpx 0 0;
		padding: 32rpx 40rpx;
		padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
		position: relative;
	}

	.close-btn {
		position: absolute;
		top: 24rpx;
		right: 24rpx;
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		border-radius: 50%;

		.close-icon {
			font-size: 28rpx;
			color: #999;
		}
	}

	.popup-header {
		text-align: center;
		margin-bottom: 32rpx;
		padding-top: 48rpx;

		.popup-title {
			display: block;
			font-size: 40rpx;
			font-weight: 600;
			color: #1a1a1a;
			margin-bottom: 12rpx;
		}

		.popup-subtitle {
			font-size: 28rpx;
			color: #999;
		}
	}

	.wechat-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 96rpx;
		background: #07C160;
		border-radius: 48rpx;
		font-size: 32rpx;
		font-weight: 500;
		color: #fff;
		border: none;
		margin-bottom: 32rpx;

		&::after {
			border: none;
		}

		&:active {
			opacity: 0.9;
		}

		&[disabled] {
			background: #9be1a8;
		}

		.wechat-icon {
			width: 48rpx;
			height: 48rpx;
			margin-right: 16rpx;
		}
	}

	.agreement-row {
		margin-bottom: 24rpx;

		.agreement-label {
			display: flex;
			align-items: flex-start;
			justify-content: center;
		}

		.agreement-text {
			font-size: 24rpx;
			color: #666;
			line-height: 1.6;
		}

		.link {
			color: #07C160;
		}
	}

	.tips {
		text-align: center;

		.tips-text {
			font-size: 22rpx;
			color: #ccc;
		}
	}
</style>