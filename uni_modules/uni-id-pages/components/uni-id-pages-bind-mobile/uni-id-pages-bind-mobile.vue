<template>
	<uni-popup ref="popup" type="bottom">
		<view class="box">
			<text class="headBox">绑定资料</text>
			<text class="tip">将一键获取你的手机号码绑定你的个人资料</text>
			<view class="btnBox">
				<text @click="closeMe" class="close">关闭</text>
				<button class="agree uni-btn" type="primary" open-type="getPhoneNumber"
					@getphonenumber="bindMobileByMpWeixin">获取</button>
			</view>
		</view>
	</uni-popup>
</template>

<script>
	const db = uniCloud.database();
	const usersTable = db.collection('uni-id-users')
	const uniIdCo = uniCloud.importObject("uni-id-co")
	export default {
		emits: ['success'],
		computed: {},
		data() {
			return {}
		},
		methods: {
			async beforeGetphonenumber() {
				return await new Promise((resolve, reject) => {
					uni.showLoading({
						mask: true
					})
					wx.checkSession({
						success() {
							// console.log('session_key 未过期');
							resolve()
							uni.hideLoading()
						},
						fail() {
							// console.log('session_key 已经失效，正在执行更新');
							wx.login({
								success({
									code
								}) {
									uniCloud.importObject("uni-id-co", {
										customUI: true
									}).loginByWeixin({
										code
									}).then(e => {
										resolve()
									}).catch(e => {
										console.log(e);
										reject()
									}).finally(e => {
										uni.hideLoading()
									})
								},
								fail: (err) => {
									console.error(err);
									reject()
								}
							})
						}
					})
				})
			},
			async bindMobileByMpWeixin(e) {
				if (e.detail.errMsg == "getPhoneNumber:ok") {
					//检查登录信息是否过期，否则通过重新登录刷新session_key
					await this.beforeGetphonenumber()
					uniIdCo.bindMobileByMpWeixin(e.detail).then(e => {
						this.$emit('success')
					}).finally(e => {
						this.closeMe()
					})
				} else {
					this.closeMe()
				}
			},
			async open() {
				this.$refs.popup.open()
			},
			closeMe(e) {
				this.$refs.popup.close()
			}
		}
	}
</script>

<style lang="scss" scoped>
	@import "@/uni_modules/uni-id-pages/common/login-page.scss";
	@import "@/styles/theme-modern.scss";

	view {
		display: flex;
	}

	.box {
		background-color: #FFFFFF;
		height: 200px;
		width: 750rpx;
		flex-direction: column;
		border-top-left-radius: 15px;
		border-top-right-radius: 15px;
	}

	.headBox {
		padding: var(--space-lg);
		height: 80rpx;
		line-height: 80rpx;
		text-align: left;
		font-size: var(--text-lg);
		color: var(--text-primary);
		margin-left: 15rpx;
	}

	.tip {
		color: var(--text-secondary);
		text-align: left;
		justify-content: center;
		margin: var(--space-sm) var(--space-lg);
		font-size: var(--text-base);
	}

	.btnBox {
		margin-top: 45rpx;
		justify-content: center;
		flex-direction: row;
	}

	.close,
	.agree {
		text-align: center;
		width: 200rpx;
		height: 80upx;
		line-height: 80upx;
		border-radius: 20rpx;
		margin: 0 20rpx;
		font-size: 26rpx;
	}

	.close {
		font-weight: 500;
		border: 2rpx solid var(--border-medium);
		color: var(--text-tertiary);
	}

	// .close:active {
	// 	color: #989898;
	// 	background-color: #E2E2E2;
	// }

	.agree {
		color: #FFFFFF;
		background: var(--text-primary);
		border-color: var(--text-primary);
	}

	/* #ifdef MP */
	.agree::after {
		border: none;
	}

	/* #endif */

	.agree:active {
		background-color: #F5F5F6;
	}
</style>