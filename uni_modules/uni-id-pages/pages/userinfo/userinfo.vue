<!-- 用户资料页 -->
<template>
	<view class="page-container">
		<!-- 头像区域 -->
		<view class="avatar-section">
			<view class="avatar-wrapper">
				<uni-id-pages-avatar width="150rpx" height="150rpx"></uni-id-pages-avatar>
			</view>
		</view>

		<!-- 用户信息列表 -->
		<view class="settings-section">
			<view class="settings-content">
				<view class="info-item" @click="setNickname('')">
					<text class="info-label">昵称</text>
					<view class="info-right">
						<text class="info-value">{{ userInfo.nickname || '未设置' }}</text>
					</view>
				</view>
				<view class="info-item" @click="bindMobile">
					<text class="info-label">手机号</text>
					<view class="info-right">
						<text class="info-value">{{ userInfo.mobile || '未绑定' }}</text>
					</view>
				</view>
				<view class="info-item" v-if="userInfo.email">
					<view class="info-left">
						<text class="info-label">电子邮箱</text>
					</view>
					<view class="info-right">
						<text class="info-value">{{ userInfo.email }}</text>
					</view>
				</view>
				<!-- #ifdef APP -->
				<view class="info-item" @click="realNameVerify">
					<view class="info-left">
						<text class="info-label">实名认证</text>
					</view>
					<view class="info-right">
						<text class="info-value">{{ realNameStatus !== 2 ? '未认证' : '已认证' }}</text>
					</view>
				</view>
				<!-- #endif -->
				<view class="info-item" v-if="hasPwd" @click="changePassword">
					<view class="info-left">
						<text class="info-label">修改密码</text>
					</view>
					<view class="info-right">
					</view>
				</view>
			</view>
		</view>

		<!-- 账号注销 -->
		<!-- #ifndef MP -->
		<view class="settings-section danger-section">
			<view class="settings-content">
				<view class="info-item" @click="deactivate">
					<view class="info-left">
						<text class="info-label danger-label">注销账号</text>
					</view>
					<view class="info-right">
					</view>
				</view>
			</view>
		</view>
		<!-- #endif -->

		<!-- 登录/退出按钮 -->
		<template v-if="showLoginManage">
			<view class="login-section" v-if="userInfo._id">
				<button class="logout-btn" @click="logout">退出登录</button>
			</view>
			<view class="login-section" v-else>
				<button class="login-btn" @click="login">去登录</button>
			</view>
		</template>

		<uni-popup ref="dialog" type="dialog">
			<uni-popup-dialog mode="input" :value="userInfo.nickname" @confirm="setNickname"
				:inputType="setNicknameIng ? 'nickname' : 'text'" title="设置昵称" placeholder="请输入要设置的昵称">
			</uni-popup-dialog>
		</uni-popup>
		<uni-id-pages-bind-mobile ref="bind-mobile-by-sms" @success="bindMobileSuccess"></uni-id-pages-bind-mobile>
	</view>
</template>
<script>
const uniIdCo = uniCloud.importObject("uni-id-co")
import {
	mutations,
	store
} from '@/uni_modules/uni-id-pages/common/store.js';
export default {
	computed: {
		userInfo() {
			return store.userInfo
		},
		realNameStatus() {
			if (!this.userInfo.realNameAuth) {
				return 0
			}

			return this.userInfo.realNameAuth.authStatus
		}
	},
	data() {
		return {
			univerifyStyle: {
				authButton: {
					"title": "本机号码一键绑定", // 授权按钮文案
				},
				otherLoginButton: {
					"title": "其他号码绑定",
				}
			},
			// userInfo: {
			// 	mobile:'',
			// 	nickname:''
			// },
			hasPwd: false,
			showLoginManage: false,//通过页面传参隐藏登录&退出登录按钮
			setNicknameIng: false
		}
	},
	async onShow() {
		this.univerifyStyle.authButton.title = "本机号码一键绑定"
		this.univerifyStyle.otherLoginButton.title = "其他号码绑定"
	},
	async onLoad(e) {
		if (e.showLoginManage) {
			this.showLoginManage = true //通过页面传参隐藏登录&退出登录按钮
		}
		//判断当前用户是否有密码，否则就不显示密码修改功能
		let res = await uniIdCo.getAccountInfo()
		this.hasPwd = res.isPasswordSet
	},
	methods: {
		login() {
			uni.navigateTo({
				url: '/uni_modules/uni-id-pages/pages/login/login-withoutpwd',
				complete: (e) => {
					// console.log(e);
				}
			})
		},
		logout() {
			mutations.logout()
		},
		bindMobileSuccess() {
			mutations.updateUserInfo()
		},
		changePassword() {
			uni.navigateTo({
				url: '/uni_modules/uni-id-pages/pages/userinfo/change_pwd/change_pwd',
				complete: (e) => {
					// console.log(e);
				}
			})
		},
		bindMobile() {
			// #ifdef APP-PLUS
			uni.preLogin({
				provider: 'univerify',
				success: this.univerify(), //预登录成功
				fail: (res) => { // 预登录失败
					// 不显示一键登录选项（或置灰）
					console.log(res)
					this.bindMobileBySmsCode()
				}
			})
			// #endif

			// #ifdef MP-WEIXIN
			this.$refs['bind-mobile-by-sms'].open()
			// #endif

			// #ifdef H5
			//...去用验证码绑定
			this.bindMobileBySmsCode()
			// #endif
		},
		univerify() {
			uni.login({
				"provider": 'univerify',
				"univerifyStyle": this.univerifyStyle,
				success: async e => {
					uniIdCo.bindMobileByUniverify(e.authResult).then(res => {
						mutations.updateUserInfo()
					}).catch(e => {
						console.log(e);
					}).finally(e => {
						// console.log(e);
						uni.closeAuthView()
					})
				},
				fail: (err) => {
					console.log(err);
					if (err.code == '30002' || err.code == '30001') {
						this.bindMobileBySmsCode()
					}
				}
			})
		},
		bindMobileBySmsCode() {
			uni.navigateTo({
				url: './bind-mobile/bind-mobile'
			})
		},
		setNickname(nickname) {
			if (nickname) {
				mutations.updateUserInfo({
					nickname
				})
				this.setNicknameIng = false
				this.$refs.dialog.close()
			} else {
				this.$refs.dialog.open()
			}
		},
		deactivate() {
			uni.navigateTo({
				url: "/uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate"
			})
		},
		async bindThirdAccount(provider) {
			const uniIdCo = uniCloud.importObject("uni-id-co")
			const bindField = {
				weixin: 'wx_openid',
				alipay: 'ali_openid',
				apple: 'apple_openid',
				qq: 'qq_openid'
			}[provider.toLowerCase()]

			if (this.userInfo[bindField]) {
				await uniIdCo['unbind' + provider]()
				await mutations.updateUserInfo()
			} else {
				uni.login({
					provider: provider.toLowerCase(),
					onlyAuthorize: true,
					success: async e => {
						const res = await uniIdCo['bind' + provider]({
							code: e.code
						})
						if (res.errCode) {
							uni.showToast({
								title: res.errMsg || '绑定失败',
								duration: 3000
							})
						}
						await mutations.updateUserInfo()
					},
					fail: async (err) => {
						console.log(err);
						uni.hideLoading()
					}
				})
			}
		},
		realNameVerify() {
			uni.navigateTo({
				url: "/uni_modules/uni-id-pages/pages/userinfo/realname-verify/realname-verify"
			})
		}
	}
}
</script>
<style lang="scss" scoped>
@import "@/styles/theme-modern.scss";

/* 页面容器 */
.page-container {
	width: 100%;
	min-height: 100vh;
	background: var(--bg-primary);
	box-sizing: border-box;
	padding: 0 var(--space-lg) calc(env(safe-area-inset-bottom) + 60rpx);
}

/* 头像区域 */
.avatar-section {
	align-items: center;
	justify-content: center;
	margin: 48rpx 0;

	.avatar-wrapper {
		width: 162rpx;
		height: 162rpx;
		border-radius: 50%;
		border: 6rpx solid var(--accent-light-2);
		box-shadow: 0 8rpx 24rpx #93c4fd30;
		overflow: hidden;
		background: #fff;
	}

	:deep(.uni-id-pages-avatar) {
		width: 200rpx !important;
		height: 200rpx !important;
		border-radius: 50% !important;
		border: none !important;
		box-shadow: none !important;
	}
}

/* 设置区域 - 与 generate.vue 一致 */
.settings-section {
	background: #ffffff;
	border-radius: 24rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	border: 2rpx solid var(--border-medium);

	.settings-content {
		padding: 8rpx 32rpx;
		box-sizing: border-box;
	}

	.info-item {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx 0;
		box-sizing: border-box;
		&:not(:last-child) {
			border-bottom: 2rpx solid var(--border-medium);
		}
	}

	.info-left {
		display: flex;
		align-items: center;
	}

	.info-label {
		font-size: 26rpx;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.danger-label {
		color: var(--color-error);
	}

	.info-right {
		display: flex;
		align-items: center;
	}

	.info-value {
		font-size: 26rpx;
		color: #999;
	}

	.info-arrow {
		font-size: 36rpx;
		color: #ccc;
	}
}

/* 危险操作区域 */
.danger-section {
	border-color: rgba(239, 68, 68, 0.2);
}

/* 登录/退出按钮 */
.login-section {
	margin-top: 48rpx;

	.logout-btn,
	.login-btn {
		width: 100%;
		height: 96rpx;
		border: none;
		border-radius: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		font-weight: 500;

		&::after {
			border: none;
		}
	}

	.logout-btn {
		background: #ffffff;
		color: var(--color-error);
		border: 2rpx solid var(--color-error);

		&:active {
			background: rgba(239, 68, 68, 0.05);
		}
	}

	.login-btn {
		background: var(--text-primary);
		color: #ffffff;

		&:active {
			background: #2a2a3e;
		}
	}
}

/* #ifndef APP-NVUE */
view {
	display: flex;
	box-sizing: border-box;
	flex-direction: column;
}

/* #endif */
</style>
