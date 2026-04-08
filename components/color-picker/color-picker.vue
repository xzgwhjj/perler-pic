<template>
	<view class="color-picker-component">
		<!-- 输入展示框 -->
		<view class="picker-main" @click="togglePicker">
			<view class="color-preview" :style="{ backgroundColor: currentValue }"></view>
			<text class="picker-text">{{ currentValue || '#000000' }}</text>
			<text class="picker-arrow">›</text>
		</view>

		<!-- 弹窗色盘 -->
		<view v-if="showPicker" class="picker-modal" @click.self="showPicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择颜色</text>
					<text class="picker-close" @click="showPicker = false">✕</text>
				</view>

				<!-- 1. 饱和度/亮度面板（核心色盘，修复渐变！） -->
				<view class="color-panel">
					<view class="saturation-brightness" @touchstart="onSaturationStart" @touchmove="onSaturationMove"
						@touchend="onSaturationEnd">
						<!-- 色相底色（正确层级） -->
						<view class="base-color" :style="{ background: `hsl(${hueValue}, 100%, 50%)` }"></view>
						<!-- 白色渐变（饱和度） -->
						<view class="white-gradient"></view>
						<!-- 黑色渐变（亮度） -->
						<view class="black-gradient"></view>
						<!-- 游标 -->
						<view class="cursor" :style="saturationCursorStyle"></view>
					</view>
				</view>

				<!-- 2. 色相滑块（彩虹条） -->
				<view class="slider-row">
					<text class="label">色相</text>
					<view class="hue-slider" @touchstart="onHueStart" @touchmove="onHueMove" @touchend="onHueEnd">
						<view class="cursor" :style="hueCursorStyle"></view>
					</view>
				</view>

				<!-- 3. 透明度滑块（新增！系统色盘标配） -->
				<view class="slider-row">
					<text class="label">透明度</text>
					<view class="alpha-slider" @touchstart="onAlphaStart" @touchmove="onAlphaMove"
						@touchend="onAlphaEnd">
						<view class="alpha-fill"
							:style="{ background: `linear-gradient(to right, transparent, ${currentValue})` }"></view>
						<view class="cursor" :style="alphaCursorStyle"></view>
					</view>
				</view>

				<!-- 颜色预览 + 输入 -->
				<view class="preview-row">
					<view class="preview-box" :style="{ background: currentValue }"></view>
					<view class="input-box">
						<text>#</text>
						<input :value="hexInput" @input="onHexInput" maxlength="8" class="hex-input" />
					</view>
				</view>

				<!-- 预设颜色 -->
				<view class="preset-colors">
					<view v-for="color in presetColors" :key="color" class="preset" :style="{ background: color }"
						@click="selectPresetColor(color)"></view>
				</view>

				<button class="confirm-btn" @click="confirmColor">确定</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue'
const instance = getCurrentInstance()

// 双向绑定
const props = defineProps({
	modelValue: { type: String, default: '#FF0000FF' }
})
const emit = defineEmits(['update:modelValue', 'confirm'])

// 状态
const showPicker = ref(false)
const currentValue = ref(props.modelValue)
const hexInput = ref('')

// 颜色参数（HSVA）
const hueValue = ref(0)        // 色相 0-360
const huePercent = ref(0)      // 色相滑块位置 0-100
const saturation = ref(100)    // 饱和度 0-100
const brightness = ref(100)     // 亮度 0-100
const alpha = ref(100)          // 透明度 0-100（新增）
const alphaPercent = ref(100)   // 透明度滑块位置

// 预设颜色
const presetColors = [
	'#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
	'#FF8800', '#8800FF', '#0088FF', '#FF0088', '#88FF00', '#00FF88'
]

// 计算属性：滑块样式
const hueCursorStyle = computed(() => ({ left: `${huePercent.value}%` }))
const alphaCursorStyle = computed(() => ({ left: `${alphaPercent.value}%` }))
const saturationCursorStyle = computed(() => ({
	left: `${saturation.value}%`,
	top: `${100 - brightness.value}%`
}))

// 监听外部值
watch(() => props.modelValue, (val) => {
	if (!val) return
	currentValue.value = val
	hexInput.value = val.replace('#', '')
	const hsva = hexToHsva(val)
	hueValue.value = hsva.h
	huePercent.value = hsva.h / 360 * 100
	saturation.value = hsva.s
	brightness.value = hsva.v
	alpha.value = hsva.a
	alphaPercent.value = hsva.a
}, { immediate: true })

// ===================== 颜色转换工具 =====================
function hsvaToRgba(h, s, v, a) {
	h /= 360; s /= 100; v /= 100; a /= 100
	let r, g, b, i = Math.floor(h * 6), f = h * 6 - i,
		p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s)
	switch (i % 6) {
		case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break;
		case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break;
		case 4: r = t; g = p; b = v; break; default: r = v; g = p; b = q; break;
	}
	return { r: r * 255, g: g * 255, b: b * 255, a }
}
function rgbaToHex(r, g, b, a) {
	const toHex = (x) => Math.round(x).toString(16).padStart(2, '0').toUpperCase()
	const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase()
	return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`
}
function hexToHsva(hex) {
	hex = hex.replace('#', '')
	const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16)
	const a = hex.length >= 8 ? parseInt(hex.substr(6, 2), 16) / 255 * 100 : 100
	const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
	let h = 0
	const s = max === 0 ? 0 : d / max * 100, v = max / 255 * 100
	if (d !== 0) {
		switch (max) {
			case r: h = 60 * (((g - b) / d) % 6); break; case g: h = 60 * ((b - r) / d + 2); break;
			case b: h = 60 * ((r - g) / d + 4); break;
		}
		if (h < 0) h += 360
	}
	return { h, s, v, a }
}

// 更新颜色
function updateColor() {
	const rgba = hsvaToRgba(hueValue.value, saturation.value, brightness.value, alpha.value)
	currentValue.value = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a)
	hexInput.value = currentValue.value.replace('#', '')
}

// ===================== 滑动事件 =====================
// 色相
function onHueStart(e) { e.preventDefault(); onHueMove(e) }
function onHueMove(e) {
	e.preventDefault()
	const x = e.touches[0].clientX
	uni.createSelectorQuery().in(instance).select('.hue-slider').boundingClientRect(rect => {
		if (!rect) return
		const percent = Math.max(0, Math.min((x - rect.left) / rect.width, 1)) * 100
		huePercent.value = percent
		hueValue.value = percent * 3.6
		updateColor()
	}).exec()
}
function onHueEnd() { }

// 饱和度/亮度
function onSaturationStart(e) { e.preventDefault(); onSaturationMove(e) }
function onSaturationMove(e) {
	e.preventDefault()
	const x = e.touches[0].clientX, y = e.touches[0].clientY
	uni.createSelectorQuery().in(instance).select('.saturation-brightness').boundingClientRect(rect => {
		if (!rect) return
		saturation.value = Math.max(0, Math.min((x - rect.left) / rect.width, 1)) * 100
		brightness.value = Math.max(0, Math.min(1 - (y - rect.top) / rect.height, 1)) * 100
		updateColor()
	}).exec()
}
function onSaturationEnd() { }

// 透明度（新增）
function onAlphaStart(e) { e.preventDefault(); onAlphaMove(e) }
function onAlphaMove(e) {
	e.preventDefault()
	const x = e.touches[0].clientX
	uni.createSelectorQuery().in(instance).select('.alpha-slider').boundingClientRect(rect => {
		if (!rect) return
		alphaPercent.value = Math.max(0, Math.min((x - rect.left) / rect.width, 1)) * 100
		alpha.value = alphaPercent.value
		updateColor()
	}).exec()
}
function onAlphaEnd() { }

// 输入/预设
function onHexInput(e) {
	const val = e.detail.value.toUpperCase()
	hexInput.value = val
	if (/^[0-9A-F]{6,8}$/.test(val)) {
		currentValue.value = '#' + val
		const hsva = hexToHsva('#' + val)
		hueValue.value = hsva.h
		huePercent.value = hsva.h / 360 * 100
		saturation.value = hsva.s
		brightness.value = hsva.v
		alpha.value = hsva.a
		alphaPercent.value = hsva.a
	}
}
function selectPresetColor(color) {
	currentValue.value = color
	hexInput.value = color.replace('#', '')
	const hsva = hexToHsva(color)
	hueValue.value = hsva.h
	huePercent.value = hsva.h / 360 * 100
	saturation.value = hsva.s
	brightness.value = hsva.v
	alpha.value = hsva.a
	alphaPercent.value = hsva.a
}

// 控制
function togglePicker() { showPicker.value = !showPicker.value }
function confirmColor() {
	emit('update:modelValue', currentValue.value)
	emit('confirm', currentValue.value)
	showPicker.value = false
}
</script>

<style lang="scss" scoped>
// 基础样式
.color-picker-component {
	width: 100%;

	.picker-main {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 16rpx;
		background: #f5f5f5;
		border-radius: 12rpx;

		.color-preview {
			width: 40rpx;
			height: 40rpx;
			border-radius: 8rpx;
			border: 2rpx solid #eee;
		}

		.picker-text {
			flex: 1;
			font-size: 28rpx;
			color: #333;
		}

		.picker-arrow {
			font-size: 32rpx;
			color: #999;
		}
	}
}

// 弹窗
.picker-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.picker-content {
	width: 90%;
	max-width: 600rpx;
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.picker-header {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.picker-title {
		font-size: 32rpx;
		font-weight: bold;
	}

	.picker-close {
		font-size: 40rpx;
		color: #666;
	}
}

// 核心色盘（修复渐变！三层叠加正确显示）
.color-panel {
	width: 100%;
	height: 300rpx;
	border-radius: 12rpx;
	overflow: hidden;

	.saturation-brightness {
		position: relative;
		width: 100%;
		height: 100%;

		.base-color {
			position: absolute;
			inset: 0;
		}

		.white-gradient {
			position: absolute;
			inset: 0;
			background: linear-gradient(to right, #fff, transparent);
		}

		.black-gradient {
			position: absolute;
			inset: 0;
			background: linear-gradient(to top, #000, transparent);
		}

		.cursor {
			position: absolute;
			width: 28rpx;
			height: 28rpx;
			border-radius: 50%;
			border: 3rpx solid #fff;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
			transform: translate(-50%, -50%);
			pointer-events: none;
		}
	}
}

// 滑块行
.slider-row {
	display: flex;
	align-items: center;
	gap: 16rpx;

	.label {
		width: 80rpx;
		font-size: 24rpx;
		color: #666;
	}
}

// 色相滑块
.hue-slider {
	flex: 1;
	height: 32rpx;
	border-radius: 16rpx;
	background: linear-gradient(to right, red, #ff0, #0f0, #0ff, #00f, #f0f, red);
	position: relative;

	.cursor {
		position: absolute;
		top: 50%;
		left: 0;
		width: 32rpx;
		height: 32rpx;
		border: 3rpx solid #fff;
		border-radius: 50%;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
}

// 透明度滑块（新增）
.alpha-slider {
	flex: 1;
	height: 32rpx;
	border-radius: 16rpx;
	background: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee),
		linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee);
	background-size: 16rpx 16rpx;
	position: relative;

	.alpha-fill {
		position: absolute;
		inset: 0;
		border-radius: 16rpx;
	}

	.cursor {
		position: absolute;
		top: 50%;
		left: 0;
		width: 32rpx;
		height: 32rpx;
		border: 3rpx solid #fff;
		border-radius: 50%;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
}

// 预览行
.preview-row {
	display: flex;
	align-items: center;
	gap: 16rpx;

	.preview-box {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
		border: 2rpx solid #eee;
	}

	.input-box {
		flex: 1;
		padding: 12rpx 16rpx;
		background: #f5f5f5;
		border-radius: 8rpx;
		display: flex;
		align-items: center;
		gap: 8rpx;

		.hex-input {
			flex: 1;
			font-size: 28rpx;
			border: none;
			background: transparent;
		}
	}
}

// 预设
.preset-colors {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;

	.preset {
		width: 48rpx;
		height: 48rpx;
		border-radius: 8rpx;
		border: 2rpx solid #eee;
	}
}

// 确定按钮
.confirm-btn {
	padding: 20rpx;
	background: #007aff;
	color: #fff;
	border: none;
	border-radius: 12rpx;
	font-size: 28rpx;
}
</style>