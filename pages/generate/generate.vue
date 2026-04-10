<template>
	<view class="page-container">
		<!-- 恢复浮窗按钮 -->
		<view v-if="isFloatingMinimized && !showExportSettingsDialog" class="floating-restore-btn"
			@click="restoreFloatingWindow">
			<image src="/static/svg/floating-restore.svg" class="restore-icon"></image>
		</view>

		<!-- 【修改】图纸预览浮窗部分 -->
		<view class="preview-section"
			:class="{ 'floating': isFloating && !showExportSettingsDialog, 'dragging': isFloatingDragging }"
			:style="isFloating ? { left: floatX + 'rpx', top: floatY + 'rpx' } : {}" @touchend="onFloatEnd"
			@mouseup="onFloatEnd" @mouseleave="onFloatEnd">
			<!-- 浮窗头部 -->
			<view class="section-header" @touchstart="onFloatStart" @mousedown="onFloatStart"
				@touchmove.stop.prevent="onFloatMove" @mousemove.stop.prevent="onFloatMove" @mouseup="onFloatEnd"
				@mouseleave="onFloatEnd">
				<text class="section-title">图纸</text>
				<text class="section-subtitle">
					{{ pixelWidth || selectedSize }}×{{ pixelHeight || selectedSize }} ({{
						boardLayout.totalBoards }}个{{ selectedBoardSize }}×{{ selectedBoardSize }}板)
				</text>
				<view class="header-actions">
					<view class="action-icon" @click.stop="showExportSettings" v-if="!isFloating">
						<image src="/static/svg/settings.svg" class="settings-icon"></image>
					</view>
					<view class="action-icon" @click.stop="handleFloatingClick" :class="{ 'active': isFloating }">
						<image :src="isFloating ? '/static/svg/sticky-active.svg' : '/static/svg/sticky.svg'"
							class="sticky-icon"></image>
					</view>
					<view class="action-icon" @click.stop="toggleFullscreen">
						<image v-if="!isFullscreen" src="/static/svg/fullscreen.svg" class="fullscreen-icon"></image>
						<text v-else>✕</text>
					</view>
				</view>
			</view>
			<!-- 浮窗缩放手柄 -->
			<template v-if="isFloating">
				<view class="resize-handle resize-handle-nw" @touchstart.prevent="onResizeStart('nw', $event)"
					@mousedown.prevent="onResizeMouseDown('nw', $event)" @touchmove.prevent="onResizeMove"
					@mousemove.prevent="onResizeMove"></view>
				<view class="resize-handle resize-handle-ne" @touchstart.prevent="onResizeStart('ne', $event)"
					@mousedown.prevent="onResizeMouseDown('ne', $event)" @touchmove.prevent="onResizeMove"
					@mousemove.prevent="onResizeMove"></view>
				<view class="resize-handle resize-handle-sw" @touchstart.prevent="onResizeStart('sw', $event)"
					@mousedown.prevent="onResizeMouseDown('sw', $event)" @touchmove.prevent="onResizeMove"
					@mousemove.prevent="onResizeMove"></view>
				<view class="resize-handle resize-handle-se" @touchstart.prevent="onResizeStart('se', $event)"
					@mousedown.prevent="onResizeMouseDown('se', $event)" @touchmove.prevent="onResizeMove"
					@mousemove.prevent="onResizeMove"></view>
			</template>

			<view class="preview-card" :class="{ 'fullscreen': isFullscreen, 'floating-window': isFloating }">
				<view class="fullscreen-close" v-if="isFullscreen" @click="toggleFullscreen">
					<text>✕</text>
				</view>
				<movable-area :scale-area="true" class="canvas-container" :style="canvasContainerStyle">
					<movable-view :scale="true" direction="all" :x="panX" :y="panY" :scale-value="scaleValue"
						class="canvas-drag-container" :style="dragContainerStyle" @scale="onScale">
						<canvas type="2d" id="mainCanvas" class="pd-canvas" :style="canvasStyle" />
					</movable-view>
				</movable-area>
				<view class="zoom-controls" v-if="isFullscreen">
					<view class="zoom-btn" @click="zoomOut">
						<text>−</text>
					</view>
					<view class="zoom-btn" @click="zoomIn">
						<text>+</text>
					</view>
					<view class="zoom-btn" @click="resetZoom">
						<text>⟲</text>
					</view>
				</view>
			</view>
		</view>
		<!-- 操作按钮 -->
		<view class="action-section">
			<button class="action-btn edit" @click="regenerate">
				<image src="/static/svg/edit.svg" class="edit-icon"></image>
				<text class="btn-text">编辑</text>
			</button>
			<button class="action-btn download" @click="downloadImage">
				<image src="/static/svg/download.svg" class="download-icon"></image>
				<text class="btn-text">下载</text>
			</button>
		</view>

		<!-- 转换设置 -->
		<view class="settings-section">
			<view class="settings-header" @click="showSettings = !showSettings">
				<text class="settings-title">转换设置</text>
				<text class="settings-arrow" :class="{ 'is-open': showSettings }">›</text>
			</view>
			<view class="settings-content" v-if="showSettings">
				<view class="size-setting setting-item">
					<text class="setting-label setting-item-label">版型尺寸</text>
					<view class="size-panel">
						<view class="size-row">
							<view class="size-label-container">
								<view class="size-label-icon">
									<image src="/static/svg/horizontal.svg" mode="aspectFit" class="size-icon" />
									<text class="size-label">横向钉</text>
								</view>
								<view class="size-value">
									<text class="size-label-text">{{ gridColumns }}</text>
									<text class="unit-text">钉</text>
								</view>
							</view>
							<view class="slider-input-container">
								<slider :value="gridColumns" min="5" max="500" @change="onGridColumnsChange"
									activeColor="#1a1a2e" backgroundColor="#e8e8e8" block-size="20" />
								<view class="size-input-container">
									<input class="size-input" type="number" v-model="gridColumns"
										@blur="onGridColumnsInput" @confirm="onGridColumnsInput" min="5" max="500" />
								</view>
							</view>
						</view>
						<view class="size-row">
							<view class="size-label-container">
								<view class="size-label-icon">
									<image src="/static/svg/vertical.svg" mode="aspectFit" class="size-icon" />
									<text class="size-label">纵向钉</text>
								</view>
								<view class="size-value">
									<text class="size-label-text">{{ gridRows }}</text>
									<text class="unit-text">钉</text>
								</view>
							</view>
							<view class="slider-input-container">
								<slider :value="gridRows" min="5" max="500" @change="onGridRowsChange"
									activeColor="#1a1a2e" backgroundColor="#e8e8e8" block-size="20" />
								<view class="size-input-container">
									<input class="size-input" type="number" v-model="gridRows" @blur="onGridRowsInput"
										@confirm="onGridRowsInput" min="5" max="500" />
								</view>
							</view>
						</view>
						<view class="lock-row-container">
							<view class="lock-row" :class="{ active: isLocked }" @click="toggleLockRatio">
								<image :src="isLocked ? '/static/svg/lock.svg' : '/static/svg/unlock.svg'"
									class="lock-icon" />
								<text class="lock-text">{{ isLocked ? "已锁定比例" : "锁定比例" }}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="setting-item">
					<text class="setting-label">转换模式</text>
					<view class="setting-select" @click="showModePicker = true">
						<text class="select-value">{{ getModeName(pixelationMode) }}</text>
						<text class="select-arrow">›</text>
					</view>
				</view>
				<view class="setting-item">
					<text class="setting-label">颜色合并阈值</text>
					<view class="slider-input-container">
						<slider :value="colorMergeThreshold" min="0" max="100" @change="onMergeThresholdChange"
							activeColor="#1a1a2e" backgroundColor="#e8e8e8" block-size="20" />
						<view class="size-input-container">
							<input class="size-input" type="number" v-model="colorMergeThreshold"
								@blur="onMergeThresholdInput" @confirm="onMergeThresholdInput" min="0" max="100" />
							<text class="unit-text">阈值</text>
						</view>
					</view>
					<!-- <text class="setting-hint">值越大，相似颜色越容易合并</text> -->
				</view>
				<view class="setting-item">
					<text class="setting-label">拼豆品牌</text>
					<view class="setting-select" @click="showBrandPicker = true">
						<text class="select-value">{{ getBrandName(selectedBrand) }}</text>
						<text class="select-arrow">›</text>
					</view>
				</view>
				<view class="setting-item">
					<text class="setting-label">显示拼豆板子</text>
					<view class="switch-container">
						<switch :checked="showBoard" @change="onShowBoardChange" color="#1a1a2e" />
					</view>
				</view>
				<view class="setting-item">
					<text class="setting-label">显示颜色code</text>
					<view class="switch-container">
						<switch :checked="showColorCode" @change="onShowColorCodeChange" color="#1a1a2e" />
					</view>
				</view>
			</view>
		</view>

		<!-- 品牌选择弹窗 -->
		<picker-view v-if="showBrandPicker && !showExportSettingsDialog" class="brand-picker" :value="[brandIndex]"
			@change="onBrandChange">
			<view class="picker-header">
				<text class="picker-cancel" @click="showBrandPicker = false">取消</text>
				<text class="picker-title">选择品牌</text>
				<text class="picker-confirm" @click="showBrandPicker = false">确定</text>
			</view>
			<picker-view-column>
				<view v-for="(brand, index) in brands" :key="index" class="picker-item">
					{{ brand.name }}
				</view>
			</picker-view-column>
		</picker-view>

		<!-- 图像类型选择弹窗 -->
		<picker-view v-if="showImageTypePicker && !showExportSettingsDialog" class="brand-picker"
			:value="[imageTypeIndex]" @change="onImageTypeChange">
			<view class="picker-header">
				<text class="picker-cancel" @click="showImageTypePicker = false">取消</text>
				<text class="picker-title">选择图像类型</text>
				<text class="picker-confirm" @click="confirmImageType">确定</text>
			</view>
			<picker-view-column>
				<view v-for="(type, index) in imageTypeOptions" :key="index" class="picker-item">
					{{ type.name }}
				</view>
			</picker-view-column>
		</picker-view>

		<!-- 转换模式选择弹窗 -->
		<picker-view v-if="showModePicker && !showExportSettingsDialog" class="brand-picker" :value="[modeIndex]"
			@change="onModeChange">
			<view class="picker-header">
				<text class="picker-cancel" @click="showModePicker = false">取消</text>
				<text class="picker-title">选择转换模式</text>
				<text class="picker-confirm" @click="confirmMode">确定</text>
			</view>
			<picker-view-column>
				<view v-for="(mode, index) in modeOptions" :key="index" class="picker-item">
					{{ mode.name }}
				</view>
			</picker-view-column>
		</picker-view>

		<!-- 板子选择弹窗 -->
		<picker-view v-if="showBoardPicker && !showExportSettingsDialog" class="brand-picker"
			:value="[tempBoardSizeIndex]" @change="onBoardSizeChange">
			<view class="picker-header">
				<text class="picker-cancel" @click="showBoardPicker = false">取消</text>
				<text class="picker-title">选择板子</text>
				<text class="picker-confirm" @click="confirmBoardSize">确定</text>
			</view>
			<picker-view-column>
				<view v-for="(board, index) in boardSizeOptions" :key="index" class="picker-item">
					{{ board.name }}
				</view>
			</picker-view-column>
		</picker-view>

		<!-- 颜色统计 -->
		<view class="stats-section" v-if="colorStats.length > 0">
			<view class="stats-header">
				<text class="stats-title">颜色统计</text>
				<text class="stats-total">共 {{ colorStats.length }} 种颜色 / {{ totalBeads }} 颗</text>
			</view>
			<view class="stats-list">
				<view v-for="(stat, index) in colorStats" :key="index" class="color-row">
					<view class="color-swatch" :style="{ backgroundColor: stat.hex }" />
					<view class="color-info">
						<text class="color-name">{{ stat.name || stat.code }}</text>
						<text class="color-code">{{ stat.code }}</text>
					</view>
					<view class="color-progress">
						<view class="progress-bar">
							<view class="progress-fill"
								:style="{ width: getProgressPercent(stat.count) + '%', backgroundColor: stat.hex }" />
						</view>
					</view>
					<view class="color-count">
						<text class="count-num">{{ stat.count }}</text>
						<text class="count-unit">颗</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 制作提示 -->
		<!-- <view class="tips-section">
			<view class="tips-card">
				<view class="tips-icon">ⓘ</view>
				<view class="tips-content">
					<text class="tips-title">制作提示</text>
					<text class="tips-text">建议按照颜色统计顺序拼制，先完成使用量最多的颜色区域</text>
				</view>
			</view>
		</view> -->

		<!-- 导出设置弹框 -->
		<view v-if="showExportSettingsDialog" class="export-settings-dialog">
			<view class="export-settings-container">
				<view class="export-settings-header">
					<text class="export-settings-title">导出设置</text>
					<text class="export-settings-close" @click="showExportSettingsDialog = false">✕</text>
				</view>
				<scroll-view class="export-settings-content" scroll-y>
					<!-- 导出方式 -->
					<view class="export-option-group">
						<text class="group-title">导出方式</text>
						<view class="radio-group">
							<view class="radio-item" @click="exportSettings.separateImages = false">
								<view class="radio" :class="{ 'radio-checked': !exportSettings.separateImages }"></view>
								<text>合并导出</text>
							</view>
							<view class="radio-item" @click="exportSettings.separateImages = true">
								<view class="radio" :class="{ 'radio-checked': exportSettings.separateImages }"></view>
								<text>分开导出</text>
							</view>
						</view>
					</view>

					<!-- 合并方向 -->
					<view class="export-option-group" v-if="!exportSettings.separateImages">
						<text class="group-title">合并方向</text>
						<view class="radio-group">
							<view class="radio-item" @click="exportSettings.layoutDirection = 'vertical'">
								<view class="radio"
									:class="{ 'radio-checked': exportSettings.layoutDirection === 'vertical' }">
								</view>
								<text>纵向排列</text>
							</view>
							<view class="radio-item" @click="exportSettings.layoutDirection = 'horizontal'">
								<view class="radio"
									:class="{ 'radio-checked': exportSettings.layoutDirection === 'horizontal' }">
								</view>
								<text>横向排列</text>
							</view>
						</view>
					</view>

					<!-- 作者名 -->
					<view class="export-option-group">
						<text class="group-title">作者信息</text>
						<view class="checkbox-item" @click="exportSettings.showAuthor = !exportSettings.showAuthor">
							<view class="checkbox" :class="{ 'checkbox-checked': exportSettings.showAuthor }"></view>
							<text>添加作者名</text>
						</view>
						<view class="author-input-container" v-if="exportSettings.showAuthor">
							<input class="author-input" type="text" v-model="authorName" placeholder="请输入作者名" />
						</view>
					</view>

					<!-- 水印 -->
					<view class="export-option-group">
						<text class="group-title">水印设置</text>
						<view class="checkbox-item" @click="exportSettings.addWatermark = !exportSettings.addWatermark">
							<view class="checkbox" :class="{ 'checkbox-checked': exportSettings.addWatermark }"></view>
							<text>添加水印</text>
						</view>
					</view>

					<!-- 阴影 -->
					<view class="export-option-group">
						<text class="group-title">样式效果</text>
						<view class="checkbox-item" @click="exportSettings.addShadow = !exportSettings.addShadow">
							<view class="checkbox" :class="{ 'checkbox-checked': exportSettings.addShadow }"></view>
							<text>添加阴影效果</text>
						</view>
					</view>

					<!-- 记住设置 -->
					<view class="export-option-group">
						<view class="checkbox-item"
							@click="exportSettings.rememberSettings = !exportSettings.rememberSettings">
							<view class="checkbox" :class="{ 'checkbox-checked': exportSettings.rememberSettings }">
							</view>
							<text>记住以上设置，下次不再提示</text>
						</view>
					</view>
				</scroll-view>
				<view class="export-settings-footer">
					<button class="export-btn secondary" @click="showExportSettingsDialog = false">取消</button>
					<button class="export-btn primary" @click="performDownload">确定导出</button>
				</view>
			</view>
		</view>

		<!-- 底部占位 -->
		<view class="bottom-placeholder"></view>

		<!-- 隐藏Canvas用于处理图片 -->
		<canvas type="2d" id="processCanvas" class="hidden-canvas" />
	</view>
</template>

<script setup>
import {
	convertToPerlerStyle
} from '@/core/perlerStyleConverter.js'
import mardColors from '@/static/colors/mard-colors.json'
import {
	flattenColorData
} from '@/utils/colorUtils.js'
import {
	onLoad
} from '@dcloudio/uni-app'
import {
	computed,
	onMounted,
	ref
} from 'vue'

// Canvas显示尺寸（绘制像素）- 5倍放大绘制：3000px绘制，600rpx显示
const CANVAS_DISPLAY_SIZE = 3000
let canvasSize = 600 // 容器显示尺寸为600rpx

// 计算属性：动态 Canvas 绘制尺寸（根据显示区域大小）
const computedCanvasDisplaySize = computed(() => {
	if (isFloating.value) {
		// 浮窗模式下，根据可用区域计算（5倍放大绘制）
		const headerHeightRpx = 60
		const availableHeightRpx = floatHeight.value - headerHeightRpx
		const sizeRpx = Math.min(floatWidth.value, availableHeightRpx)
		// 5倍放大绘制
		return sizeRpx * 5 * (1 / px2rpx) // 转换为像素
	}
	if (isFullscreen.value) {
		// 全屏模式下，使用固定正方形尺寸（5倍放大绘制）
		// 600rpx * 5 = 3000px
		return CANVAS_DISPLAY_SIZE
	}
	// 默认模式
	return CANVAS_DISPLAY_SIZE
})

// 获取设备像素比（适配高清屏）
const getPixelRatio = (ctx) => {
	// #ifdef MP-WEIXIN
	// 微信小程序环境使用 uni.getWindowInfo()
	try {
		const windowInfo = uni.getWindowInfo()
		return windowInfo.pixelRatio || 2
	} catch (e) {
		return 2 // 默认返回2倍，确保高清
	}
	// #endif

	// #ifndef MP-WEIXIN
	// H5或其他环境使用原生API
	const backingStore = ctx.backingStorePixelRatio ||
		ctx.webkitBackingStorePixelRatio ||
		ctx.mozBackingStorePixelRatio ||
		ctx.msBackingStorePixelRatio ||
		ctx.oBackingStorePixelRatio ||
		ctx.backingStorePixelRatio || 1;
	return (window.devicePixelRatio || 1) / backingStore;
	// #endif
}

// 【替换/新增】微信小程序：缓存系统信息，纯rpx计算
const systemInfo = uni.getSystemInfoSync()
const screenWidthRpx = 750 // 微信小程序固定：屏幕宽度=750rpx
const screenHeightRpx = systemInfo.windowHeight * (750 / systemInfo.windowWidth) // 屏幕高度(rpx)
const px2rpx = 750 / systemInfo.windowWidth // px转rpx系数

// 核心转换设置 - 拼豆最优默认值
const showSettings = ref(true)
const selectedBrand = ref('mard') // 拼豆品牌：固定Mard，和参考图色号完全对齐
const selectedSize = ref(29) // 板型格数：29格黄金尺寸，1个52板刚好放下，新手友好
const matchAccuracy = ref(3) // 颜色匹配精度：1-10级
const showBoard = ref(false) // 拼豆板子：默认关闭，先看纯净的图纸效果
const showColorCode = ref(true) // 显示颜色code：默认开启
const selectedBoardSize = ref(52) // 板子尺寸：默认52×52，市面最通用的标准板
const boardSpacing = ref(20) // 板子间距：默认20px，行业通用标准
const boardLineColor = ref('#cccccc')
const emptyBorderColor = ref('#999999')
const isBeadMode = ref(true) // 拼豆纯色模式：强制开启，固定nearest模式
const showBrandPicker = ref(false)
const showBoardPicker = ref(false)
const showImageTypePicker = ref(false)
const showModePicker = ref(false)
const imagePath = ref('')
const canvasReady = ref(false)
const colorStats = ref([])
const isFullscreen = ref(false)
const isFloating = ref(false)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isDragging = ref(false)
const isFloatingDragging = ref(false)
const lastTouchX = ref(0)
const lastTouchY = ref(0)
const initialDistance = ref(0)
const initialZoom = ref(1)
const pdCanvas = ref(null)
// 浮窗位置
const floatX = ref(0)
const floatY = ref(0)
const floatWidth = ref(400)
const floatHeight = ref(400)
const lastFloatX = ref(0)
const lastFloatY = ref(0)
const isFloatingMinimized = ref(false)
const isResizing = ref(false)
const resizeHandle = ref('')
const lastResizeX = ref(0)
const lastResizeY = ref(0)

// 导出设置
const showExportSettingsDialog = ref(false)
const authorName = ref('') // 作者名
const exportSettings = ref({
	separateImages: false, // 是否分开导出图纸和颜色统计
	layoutDirection: 'vertical', // 拼接方向: vertical/horizontal
	showAuthor: false, // 是否显示作者名
	addWatermark: true, // 是否添加水印
	addShadow: true, // 是否添加阴影
	rememberSettings: false // 记住设置，下次不再弹框
})

// 恢复浮窗
const restoreFloatingWindow = () => {
	floatX.value = 50
	floatY.value = 100
	floatWidth.value = 400
	floatHeight.value = 400
	isFloating.value = true
	isFloatingMinimized.value = false
	isFloatingDragging.value = false // 重置拖拽状态，避免残留
}

// 【替换】触摸缩放开始
const onResizeStart = (handle, e) => {
	if (!isFloating.value) return
	isResizing.value = true
	resizeHandle.value = handle
	const touch = e.touches[0]
	// 【新增】px转rpx
	lastResizeX.value = touch.clientX * px2rpx
	lastResizeY.value = touch.clientY * px2rpx
	e.preventDefault()
	e.stopPropagation()
}

// 【替换】鼠标缩放开始
const onResizeMouseDown = (handle, e) => {
	if (!isFloating.value) return
	isResizing.value = true
	resizeHandle.value = handle
	// 【新增】px转rpx
	lastResizeX.value = e.clientX * px2rpx
	lastResizeY.value = e.clientY * px2rpx
	e.preventDefault()
	e.stopPropagation()
}

// 【替换】缩放移动逻辑（纯rpx计算，在模板中绑定事件调用）
const onResizeMove = (e) => {
	if (!isResizing.value || !isFloating.value) return
	e.preventDefault()

	// 兼容触摸和鼠标
	const clientX = e.clientX || (e.touches && e.touches[0].clientX)
	const clientY = e.clientY || (e.touches && e.touches[0].clientY)
	if (!clientX || !clientY) return

	// px转rpx
	const currentXRpx = clientX * px2rpx
	const currentYRpx = clientY * px2rpx
	const deltaXRpx = currentXRpx - lastResizeX.value
	const deltaYRpx = currentYRpx - lastResizeY.value

	// 缩放边界（rpx）
	const minSize = 200
	const maxSize = 600

	// 按手柄类型调整
	switch (resizeHandle.value) {
		case 'se': // 右下角
			floatWidth.value = Math.max(minSize, Math.min(maxSize, floatWidth.value + deltaXRpx))
			floatHeight.value = Math.max(minSize, Math.min(maxSize, floatHeight.value + deltaYRpx))
			break
		case 'sw': // 左下角
			const newSwWidth = Math.max(minSize, Math.min(maxSize, floatWidth.value - deltaXRpx))
			floatX.value += (floatWidth.value - newSwWidth)
			floatWidth.value = newSwWidth
			floatHeight.value = Math.max(minSize, Math.min(maxSize, floatHeight.value + deltaYRpx))
			break
		case 'ne': // 右上角
			const newNeHeight = Math.max(minSize, Math.min(maxSize, floatHeight.value - deltaYRpx))
			floatY.value += (floatHeight.value - newNeHeight)
			floatHeight.value = newNeHeight
			floatWidth.value = Math.max(minSize, Math.min(maxSize, floatWidth.value + deltaXRpx))
			break
		case 'nw': // 左上角
			const newNwWidth = Math.max(minSize, Math.min(maxSize, floatWidth.value - deltaXRpx))
			const newNwHeight = Math.max(minSize, Math.min(maxSize, floatHeight.value - deltaYRpx))
			floatX.value += (floatWidth.value - newNwWidth)
			floatY.value += (floatHeight.value - newNwHeight)
			floatWidth.value = newNwWidth
			floatHeight.value = newNwHeight
			break
	}

	lastResizeX.value = currentXRpx
	lastResizeY.value = currentYRpx
}

// 缩放事件
const onScale = (event) => {
	const scale = event.detail.scale
	console.log("缩放比例:", scale)
}

// 颜色聚类：存储图片主色（低精度合并杂色用）
const imageMainColors = ref([])
// 新增专业级设置
const imageType = ref('cartoon') // 图像类型：cartoon/photo/icon/illustration
const preserveLines = ref(true) // 是否保留线条
const enablePreprocessing = ref(true) // 是否启用预处理

// Perler-Beads 风格设置（新增）
const pixelationMode = ref('dominant') // 转换模式: dominant/average
const gridColumns = ref(50) // 横向切割数量
const gridRows = ref(50) // 纵向切割数量
const isLocked = ref(true) // 是否锁定比例
const imageAspectRatio = ref(1) // 图片宽高比
const colorMergeThreshold = ref(30) // 颜色合并阈值

// 实际像素尺寸（保持宽高比）
const pixelWidth = ref(0)
const pixelHeight = ref(0)
const cellSizeDisplay = ref(0) // 用于显示的格子大小

// 全局Canvas实例
let mainCanvas = null
let mainCtx = null
let processCanvas = null
let processCtx = null

const brands = [{
	id: 'mard',
	name: 'Mard'
},
{
	id: 'coco',
	name: 'Coco'
},
{
	id: 'miwo',
	name: '咪小窝'
},
{
	id: 'manman',
	name: '漫漫'
},
{
	id: 'panpan',
	name: '盼盼'
}
]

// 拼豆板子尺寸选项
const boardSizeOptions = [
	{ size: 14, name: '14×14钉' },
	{ size: 52, name: '52×52钉' },
	{ size: 104, name: '104×104钉' }
]

// 图像类型选项
const imageTypeOptions = [
	{ id: 'cartoon', name: '卡通/动漫' },
	{ id: 'photo', name: '照片' },
	{ id: 'icon', name: '图标/Logo' },
	{ id: 'illustration', name: '插画' }
]

const modeOptions = [
	{ id: 'dominant', name: '卡通' },
	{ id: 'average', name: '图像' }
]

// 防抖定时器
let boardSizeTimer = null
let boardSpacingTimer = null

const brandIndex = computed(() => {
	return brands.findIndex(b => b.id === selectedBrand.value)
})

const boardSizeIndex = computed(() => {
	return boardSizeOptions.findIndex(b => b.size === selectedBoardSize.value)
})

// 全屏和缩放相关的计算属性
const canvasContainerStyle = computed(() => {
	if (isFullscreen.value) {
		// 全屏模式下，movable-area 占据除控制按钮外的所有空间
		// 控制按钮高度约 80rpx，加上 margin 16rpx，总共约 96rpx
		const controlsHeight = 96
		return {
			width: '100%',
			height: `calc(100% - ${controlsHeight}rpx)`,
			overflow: 'hidden',
			touchAction: 'none',
			// 移除正方形限制，让 movable-area 占据全屏可用区域
			maxWidth: 'none',
			maxHeight: 'none',
			aspectRatio: 'auto'
		}
	}
	if (isFloating.value) {
		// 浮窗模式下，高度需要减去header高度（约60rpx）
		const headerHeight = 60
		const availableHeight = floatHeight.value - headerHeight
		return {
			width: `${floatWidth.value}rpx`,
			height: `${availableHeight}rpx`, // 使用可用高度（减去header）
			overflow: 'hidden',
			touchAction: 'none'
		}
	}
	return {
		width: '600rpx',
		height: '600rpx',
		overflow: 'hidden',
		touchAction: 'none' // 禁用默认触摸行为，避免页面滚动
	}
})

const dragContainerStyle = computed(() => {
	return {
		width: '600rpx',
		height: '600rpx',
		transition: isDragging.value ? 'none' : 'transform 0.2s ease-out'
	}
})

// Canvas 样式：浮窗模式下使用实际像素尺寸，其他模式使用固定尺寸
const canvasStyle = computed(() => {
	if (isFloating.value) {
		// 浮窗模式下，Canvas 尺寸由 JavaScript 设置，CSS 只控制显示
		return {
			display: 'block'
			// 宽高由 Canvas 上下文设置决定
		}
	}
	return {
		width: '600rpx',
		height: '600rpx',
		display: 'block'
	}
})

// 计算缩放值：浮窗模式下使用fitCanvasToFloatingWindow计算的缩放，其他模式为1
const scaleValue = computed(() => {
	return isFloating.value ? zoomLevel.value : 1
})

// 移除canvasWidth和canvasHeight计算属性，Canvas尺寸在JavaScript中设置

const floatingStyle = computed(() => {
	if (isFloating.value) {
		return {
			position: 'fixed',
			left: '0',
			top: '0',
			transform: `translate(${floatX.value}px, ${floatY.value}px)`,
			zIndex: 9999, // 最高层级
			boxShadow: '0 8rpx 32rpx rgba(0, 0, 0, 0.2)',
			transition: isFloatingDragging.value ? 'none' : 'transform 0.1s ease-out'
		}
	}
	return {}
})

const floatingWindowStyle = computed(() => {
	if (isFloating.value) {
		return {
			width: `${floatWidth.value}rpx`,
			height: `${floatHeight.value}rpx`,
			transition: isResizing.value ? 'none' : 'width 0.2s, height 0.2s'
		}
	}
	return {}
})

const totalBeads = computed(() => {
	return colorStats.value.reduce((sum, item) => sum + item.count, 0)
})

// 计算需要的板子数量和布局
const boardLayout = computed(() => {
	// 使用实际像素宽高
	const imgWidth = pixelWidth.value || selectedSize.value
	const imgHeight = pixelHeight.value || selectedSize.value
	const boardSize = selectedBoardSize.value

	// 计算需要的板子数量（行和列）
	const cols = Math.ceil(imgWidth / boardSize)
	const rows = Math.ceil(imgHeight / boardSize)
	const totalBoards = rows * cols

	return {
		rows,
		cols,
		totalBoards,
		boardSize,
		imgWidth,
		imgHeight
	}
})

const getBrandName = (brandId) => {
	const brand = brands.find(b => b.id === brandId)
	return brand ? brand.name : '未知品牌'
}

const getProgressPercent = (count) => {
	if (totalBeads.value === 0) return 0
	return (count / totalBeads.value) * 100
}

const getBoardSizeName = (size) => {
	const board = boardSizeOptions.find(b => b.size === size)
	return board ? board.name : '未知板子'
}

// 打开板子选择器
const openBoardPicker = () => {
	tempBoardSizeIndex.value = boardSizeIndex.value
	showBoardPicker.value = true
}

// 工具函数：获取Canvas 2D实例
const getCanvasInstance = (canvasId) => {
	return new Promise((resolve) => {
		// uni-app 统一使用 uni.createSelectorQuery
		const query = uni.createSelectorQuery()
		query.select(`#${canvasId}`)
			.fields({
				node: true,
				size: true
			})
			.exec((res) => {
				console.log(`🔍 Canvas查询结果 ${canvasId}:`, res)
				// 先检查res是否存在且有元素
				if (res && res.length > 0 && res[0] && res[0].node) {
					const canvas = res[0].node
					const ctx = canvas.getContext('2d')
					console.log(`✅ Canvas初始化成功: ${canvasId}`, { canvas, ctx })
					resolve({
						canvas,
						ctx
					})
				} else {
					console.error(`❌ Canvas获取失败: ${canvasId}`, res)
					resolve(null)
				}
			})
	})
}

// 全屏功能
const toggleFullscreen = () => {
	// 如果在浮窗状态，先退出浮窗
	if (isFloating.value) {
		isFloating.value = false
		// 延迟一下再进入全屏，确保状态切换完成
		setTimeout(() => {
			isFullscreen.value = !isFullscreen.value
			if (isFullscreen.value) {
				centerMovableViewInFullscreen()
			}
		}, 100)
		return
	}

	isFullscreen.value = !isFullscreen.value
	if (isFullscreen.value) {
		// 进入全屏时居中显示
		centerMovableViewInFullscreen()
	} else {
		// 退出全屏时重置位置
		panX.value = 0
		panY.value = 0
		zoomLevel.value = 1
	}
}

// 缩放功能
const zoomIn = () => {
	zoomLevel.value = Math.min(zoomLevel.value + 0.25, 10)
}

const zoomOut = () => {
	zoomLevel.value = Math.max(zoomLevel.value - 0.25, 0.5)
}

const resetZoom = () => {
	zoomLevel.value = 1
	panX.value = 0
	panY.value = 0
}

// 拖拽功能 - 触摸事件
const onDragStart = (e) => {
	// 检测是否为双指手势
	if (e.touches.length === 2) {
		// 双指放大
		isDragging.value = false
		const touch1 = e.touches[0]
		const touch2 = e.touches[1]
		initialDistance.value = Math.hypot(
			touch2.clientX - touch1.clientX,
			touch2.clientY - touch1.clientY
		)
		initialZoom.value = zoomLevel.value
	} else if (e.touches.length === 1) {
		// 单指拖拽
		isDragging.value = true
		const touch = e.touches[0]
		lastTouchX.value = touch.clientX
		lastTouchY.value = touch.clientY
	}
}

const onDragMove = (e) => {
	// 双指放大
	if (e.touches.length === 2) {
		e.preventDefault()
		const touch1 = e.touches[0]
		const touch2 = e.touches[1]
		const currentDistance = Math.hypot(
			touch2.clientX - touch1.clientX,
			touch2.clientY - touch1.clientY
		)

		const scale = currentDistance / initialDistance.value
		const newZoom = Math.min(Math.max(initialZoom.value * scale, 0.5), 10)
		zoomLevel.value = newZoom
	}
	// 单指拖拽
	else if (e.touches.length === 1 && isDragging.value) {
		e.preventDefault() // 防止滚动

		const touch = e.touches[0]
		const deltaX = touch.clientX - lastTouchX.value
		const deltaY = touch.clientY - lastTouchY.value

		panX.value += deltaX
		panY.value += deltaY

		lastTouchX.value = touch.clientX
		lastTouchY.value = touch.clientY
	}
}

const onDragEnd = () => {
	isDragging.value = false
}

// 拖拽功能 - 鼠标事件
const onMouseDragStart = (e) => {
	isDragging.value = true
	lastTouchX.value = e.clientX
	lastTouchY.value = e.clientY
}

const onMouseDragMove = (e) => {
	if (!isDragging.value) return
	e.preventDefault()

	const deltaX = e.clientX - lastTouchX.value
	const deltaY = e.clientY - lastTouchY.value

	panX.value += deltaX
	panY.value += deltaY

	lastTouchX.value = e.clientX
	lastTouchY.value = e.clientY
}

const onMouseDragEnd = () => {
	isDragging.value = false
}

// 鼠标滚轮缩放
const onWheel = (e) => {
	e.preventDefault()

	const delta = e.deltaY > 0 ? -0.1 : 0.1
	const newZoom = Math.min(Math.max(zoomLevel.value + delta, 0.5), 10)
	zoomLevel.value = newZoom
}

// 处理浮窗按钮点击
const handleFloatingClick = (e) => {
	console.log('handleFloatingClick called')
	e.preventDefault()
	e.stopPropagation()
	toggleFloating()
}

const toggleFloating = () => {
	console.log('toggleFloating called, current isFloating:', isFloating.value)
	isFloating.value = !isFloating.value
	console.log('new isFloating:', isFloating.value)
	if (isFloating.value) {
		// 初始化位置和缩放 - 图纸100%完整显示
		// 高度包含header(约60rpx) + card(340rpx)
		floatX.value = 50
		floatY.value = 100
		floatWidth.value = 400
		floatHeight.value = 400 // 总高度：60rpx(header) + 340rpx(card)
		isFloatingMinimized.value = false

		console.log(`🚀 进入浮窗模式，初始尺寸: ${floatWidth.value}×${floatHeight.value}rpx`)
		console.log(`📊 movable-view 初始位置: x=${panX.value}, y=${panY.value}`)

		// 延迟增加到500ms，确保canvas渲染完成
		// 同时增加重试机制
		let retryCount = 0
		const tryCenter = () => {
			if (canvasReady.value || retryCount >= 3) {
				console.log(`🎯 第 ${retryCount + 1} 次尝试居中...`)
				fitCanvasToFloatingWindow()
			} else {
				retryCount++
				console.log(`⏳ Canvas未就绪，${retryCount}秒后重试...`)
				setTimeout(tryCenter, 500)
			}
		}

		setTimeout(tryCenter, 500)
	} else {
		// 退出浮窗时重置为原始大小
		console.log(`🚪 退出浮窗模式，重置位置`)
		zoomLevel.value = 1
		panX.value = 0
		panY.value = 0
		console.log(`📊 movable-view 重置后位置: x=${panX.value}, y=${panY.value}`)
	}
}

// 微信小程序：图纸自适应浮窗并居中
const fitCanvasToFloatingWindow = async () => {
	if (!isFloating.value) return

	console.log('🔍 fitCanvasToFloatingWindow: 开始适配浮窗...')

	// 等待canvas渲染完成（最多等1000ms）
	let canvasReady = false
	let retryCount = 0
	const maxRetries = 10 // 增加重试次数

	while (!canvasReady && retryCount < maxRetries) {
		await new Promise(resolve => setTimeout(resolve, 100))

		try {
			const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
			await new Promise(resolve => {
				query.select('#mainCanvas')
					.fields({ node: true, size: true })
					.exec((res) => {
						if (res && res[0] && res[0].width > 0 && res[0].height > 0) {
							canvasReady = true
							console.log(`✅ Canvas已准备: ${res[0].width}×${res[0].height}px`)
						} else {
							console.log(`⏳ 等待Canvas... 重试 ${retryCount + 1}/${maxRetries}`)
						}
						resolve()
					})
			})
		} catch (error) {
			console.error('Canvas查询失败:', error)
		}

		retryCount++
	}

	if (!canvasReady) {
		console.warn('❌ Canvas准备超时，跳过居中适配')
		return
	}

	// 浮窗可视区域（rpx）：与 canvasContainerStyle 保持一致
	// 高度已经在 canvasContainerStyle 中减去header，这里直接使用
	const floatWinWidthRpx = floatWidth.value
	const floatWinHeightRpx = floatHeight.value - 60 // 减去头部高度（与canvasContainerStyle保持一致）
	const floatWinWidthPx = floatWinWidthRpx / px2rpx
	const floatWinHeightPx = floatWinHeightRpx / px2rpx

	console.log(`📐 浮窗可用区域: ${floatWinWidthRpx}×${floatWinHeightRpx}rpx (${floatWinWidthPx.toFixed(2)}×${floatWinHeightPx.toFixed(2)}px)`)

	// 获取Canvas实际尺寸
	const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
	query.select('#mainCanvas')
		.fields({ node: true, size: true })
		.exec((res) => {
			if (!res || !res[0]) {
				console.error('❌ 无法获取Canvas尺寸')
				return
			}

			const canvasWidthPx = res[0].width
			const canvasHeightPx = res[0].height

			console.log(`🎨 Canvas实际尺寸: ${canvasWidthPx}×${canvasHeightPx}px`)

			// 计算等比缩放比例（以px为单位计算，避免rpx转换误差）
			const scaleX = floatWinWidthPx / canvasWidthPx
			const scaleY = floatWinHeightPx / canvasHeightPx
			const fitScale = Math.min(scaleX, scaleY, 1) // 最大缩放1倍

			console.log(`🔢 缩放比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, fitScale=${fitScale.toFixed(3)}`)

			// 计算居中偏移（px）
			const offsetX = (floatWinWidthPx - canvasWidthPx * fitScale) / 2
			const offsetY = (floatWinHeightPx - canvasHeightPx * fitScale) / 2

			console.log(`📍 居中偏移: offsetX=${offsetX.toFixed(2)}px, offsetY=${offsetY.toFixed(2)}px`)

			// 设置缩放和居中
			zoomLevel.value = fitScale
			panX.value = offsetX
			panY.value = offsetY
			console.log(`✅ 浮窗适配完成: zoomLevel=${zoomLevel.value}, panX=${panX.value}, panY=${panY.value}`)
			console.log(`📍 movable-view 位置: x=${panX.value}px, y=${panY.value}px (相对于 movable-area 左上角)`)
			console.log(`📐 movable-area 尺寸: ${floatWinWidthRpx}×${floatWinHeightRpx}rpx (${floatWinWidthPx.toFixed(2)}×${floatWinHeightPx.toFixed(2)}px)`)
			console.log(`🎯 Canvas 缩放后尺寸: ${(canvasWidthPx * fitScale).toFixed(2)}×${(canvasHeightPx * fitScale).toFixed(2)}px`)
		})
}

// 通用函数：让movable-view居中在movable-area中（全屏模式）
const centerMovableViewInFullscreen = async () => {
	console.log('🎯 开始全屏模式居中计算...')

	if (!isFullscreen.value) return

	// 等待canvas渲染完成
	await new Promise(resolve => setTimeout(resolve, 150))

	const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])

	// 获取movable-area的尺寸
	query.select('.canvas-container')
		.fields({ size: true })
		.exec((areaRes) => {
			if (!areaRes || !areaRes[0]) {
				console.error('❌ 无法获取 movable-area 尺寸')
				return
			}

			const areaWidth = areaRes[0].width
			const areaHeight = areaRes[0].height
			const floatWinWidthRpx = areaWidth
			const floatWinHeightRpx = areaHeight
			const floatWinWidthPx = floatWinWidthRpx / px2rpx
			const floatWinHeightPx = floatWinHeightRpx / px2rpx

			console.log(`📐 movable-area 可用区域: ${areaWidth.toFixed(2)}×${areaHeight.toFixed(2)}px`)
			console.log(`📊 全屏模式: 不包含底部控制按钮区域`)

			// 获取canvas的尺寸（应该是正方形）
			// 获取Canvas实际尺寸
			const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
			query.select('#mainCanvas')
				.fields({ node: true, size: true })
				.exec((res) => {
					if (!res || !res[0]) {
						console.error('❌ 无法获取Canvas尺寸')
						return
					}

					const canvasWidthPx = res[0].width
					const canvasHeightPx = res[0].height

					console.log(`🎨 Canvas实际尺寸: ${canvasWidthPx}×${canvasHeightPx}px`)

					// 计算等比缩放比例（以px为单位计算，避免rpx转换误差）
					const scaleX = floatWinWidthPx / canvasWidthPx
					const scaleY = floatWinHeightPx / canvasHeightPx
					const fitScale = Math.min(scaleX, scaleY, 1) // 最大缩放1倍

					console.log(`🔢 缩放比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, fitScale=${fitScale.toFixed(3)}`)

					// 计算居中偏移（px）
					const offsetX = (floatWinWidthRpx - canvasWidthPx) / 2
					const offsetY = (floatWinHeightRpx - canvasHeightPx) / 2

					console.log(`📍 居中偏移: offsetX=${offsetX.toFixed(2)}px, offsetY=${offsetY.toFixed(2)}px`)

					// 设置缩放和居中
					// zoomLevel.value = fitScale
					panX.value = offsetX
					panY.value = offsetY
					console.log(`✅ 浮窗适配完成: zoomLevel=${zoomLevel.value}, panX=${panX.value}, panY=${panY.value}`)
					console.log(`📍 movable-view 位置: x=${panX.value}px, y=${panY.value}px (相对于 movable-area 左上角)`)
					console.log(`📐 movable-area 尺寸: ${floatWinWidthRpx}×${floatWinHeightRpx}rpx (${floatWinWidthPx.toFixed(2)}×${floatWinHeightPx.toFixed(2)}px)`)
					console.log(`🎯 Canvas 缩放后尺寸: ${(canvasWidthPx * fitScale).toFixed(2)}×${(canvasHeightPx * fitScale).toFixed(2)}px`)
				})
		})
}

// 浮窗拖拽事件 - 处理触摸和鼠标事件
const onFloatStart = (e) => {
	console.log('onFloatStart called, isFloating:', isFloating.value)
	if (!isFloating.value) {
		console.log('cannot drag: isFloating is false')
		return
	}
	e.preventDefault()

	isFloatingDragging.value = true
	console.log('start dragging')
	// 【新增】px转rpx记录初始坐标
	// 处理触摸事件
	if (e.touches && e.touches.length > 0) {
		const touch = e.touches[0]
		lastFloatX.value = touch.clientX * px2rpx
		lastFloatY.value = touch.clientY * px2rpx
		console.log('touch start at:', lastFloatX.value, lastFloatY.value)
	}
	// 处理鼠标事件
	else if (e.clientX !== undefined) {
		lastFloatX.value = e.clientX * px2rpx
		lastFloatY.value = e.clientY * px2rpx
		console.log('mouse start at:', lastFloatX.value, lastFloatY.value)
	}
}

const onFloatMove = (e) => {
	if (!isFloatingDragging.value || !isFloating.value) return
	e.preventDefault()
	e.stopPropagation()
	console.log('onFloatMove called, dragging:', isFloatingDragging.value)
	// 处理触摸事件
	if (e.touches && e.touches.length > 0) {
		const touch = e.touches[0]
		// px转rpx
		const currentXRpx = touch.clientX * px2rpx
		const currentYRpx = touch.clientY * px2rpx
		const deltaXRpx = currentXRpx - lastFloatX.value
		const deltaYRpx = currentYRpx - lastFloatY.value
		console.log('touch move delta:', deltaXRpx, deltaYRpx)

		// 优化边界：留出20rpx边距，避免浮窗贴边难拖拽
		const minX = 20
		const minY = 20
		const maxX = screenWidthRpx - floatWidth.value - 20
		const maxY = screenHeightRpx - floatHeight.value - 20

		const newX = Math.max(minX, Math.min(maxX, floatX.value + deltaXRpx))
		const newY = Math.max(minY, Math.min(maxY, floatY.value + deltaYRpx))

		console.log('new position:', newX, newY)

		floatX.value = newX
		floatY.value = newY

		lastFloatX.value = currentXRpx
		lastFloatY.value = currentYRpx
	}// 处理鼠标事件
	else if (e.clientX !== undefined) {
		const currentXRpx = e.clientX * px2rpx
		const currentYRpx = e.clientY * px2rpx
		const deltaXRpx = currentXRpx - lastFloatX.value
		const deltaYRpx = currentYRpx - lastFloatY.value

		console.log('mouse move delta:', deltaXRpx, deltaYRpx)

		// 优化边界：留出20rpx边距，避免浮窗贴边难拖拽
		const minX = 20
		const minY = 20
		const maxX = screenWidthRpx - floatWidth.value - 20
		const maxY = screenHeightRpx - floatHeight.value - 20

		const newX = Math.max(minX, Math.min(maxX, floatX.value + deltaXRpx))
		const newY = Math.max(minY, Math.min(maxY, floatY.value + deltaYRpx))

		console.log('new position:', newX, newY)

		floatX.value = newX
		floatY.value = newY

		lastFloatX.value = currentXRpx
		lastFloatY.value = currentYRpx
	}
}


const onFloatEnd = () => {
	isFloatingDragging.value = false
	isResizing.value = false
	resizeHandle.value = ''
}




const onFloatMouseUp = () => {
	isFloatingDragging.value = false
	isResizing.value = false
	resizeHandle.value = ''
}

// 工具函数：绘制图片到Canvas
const drawImageToCanvas = (ctx, canvas, imgPath, width, height) => {
	return new Promise((resolve) => {
		const img = canvas.createImage()
		img.onload = () => {
			ctx.drawImage(img, 0, 0, width, height)
			resolve()
		}
		img.src = imgPath
	})
}

const onBrandChange = (e) => {
	selectedBrand.value = brands[e.detail.value[0]].id
	regenerate()
}

const onModeChange = (e) => {
	pixelationMode.value = modeOptions[e.detail.value[0]].id
}

const confirmMode = () => {
	showModePicker.value = false
	regenerate()
}

const onBoardSizeChange = (e) => {
	// 只更新临时值,不立即应用
	tempBoardSizeIndex.value = e.detail.value[0]
}

const tempBoardSizeIndex = ref(0)
const confirmBoardSize = () => {
	selectedBoardSize.value = boardSizeOptions[tempBoardSizeIndex.value].size
	showBoardPicker.value = false
	regenerate()
}

const onAccuracyChange = (e) => {
	matchAccuracy.value = e.detail.value
	regenerate()
}

const onBoardSpacingChange = (e) => {
	boardSpacing.value = e.detail.value
	// 使用防抖，滑动时频繁重新生成
	if (boardSpacingTimer) {
		clearTimeout(boardSpacingTimer)
	}
	boardSpacingTimer = setTimeout(() => {
		regenerate()
	}, 300)
}

const onBoardSizeSlider = (e) => {
	console.log('滑块changing事件触发, e.detail.value:', e.detail.value)
	selectedSize.value = e.detail.value
	console.log('selectedSize更新后:', selectedSize.value)
	// 使用防抖，滑动时频繁重新生成
	if (boardSizeTimer) {
		clearTimeout(boardSizeTimer)
	}
	boardSizeTimer = setTimeout(() => {
		console.log('防抖后重新生成, selectedSize:', selectedSize.value)
		regenerate()
	}, 300)
}

const onSizeChange = (e) => {
	console.log('滑块change事件触发, e.detail.value:', e.detail.value)
	selectedSize.value = e.detail.value
	regenerate()
}

const onBoardSizeInput = () => {
	const value = parseInt(selectedSize.value)
	if (value < 10 || value > 100) {
		selectedSize.value = Math.max(10, Math.min(100, value))
		uni.showToast({
			title: '请输入10-100之间的数字',
			icon: 'none'
		})
		return
	}
	regenerate()
}

const onBoardSpacingInput = () => {
	const value = parseInt(boardSpacing.value)
	if (value < 0 || value > 30) {
		boardSpacing.value = Math.max(0, Math.min(30, value))
		uni.showToast({
			title: '请输入0-30之间的数字',
			icon: 'none'
		})
		return
	}
	regenerate()
}

const onAccuracyInput = () => {
	const value = parseInt(matchAccuracy.value)
	if (value < 1 || value > 10) {
		matchAccuracy.value = Math.max(1, Math.min(10, value))
		uni.showToast({
			title: '请输入1-10之间的数字',
			icon: 'none'
		})
		return
	}
	regenerate()
}

const onPreprocessingChange = (e) => {
	enablePreprocessing.value = e.detail.value
	regenerate()
}

const onPreserveLinesChange = (e) => {
	preserveLines.value = e.detail.value
	regenerate()
}

// Perler-Beads 风格：横向切割数量
const onGridColumnsChange = (e) => {
	const newWidth = e.detail.value
	if (isLocked.value && imageAspectRatio.value) {
		const newHeight = Math.round(newWidth / imageAspectRatio.value)
		gridRows.value = Math.max(20, Math.min(500, newHeight))
	}
	gridColumns.value = newWidth
	regenerate()
}

const onGridColumnsInput = () => {
	gridColumns.value = Math.max(20, Math.min(100, parseInt(gridColumns.value) || 50))
	if (isLocked.value && imageAspectRatio.value) {
		const newHeight = Math.round(gridColumns.value / imageAspectRatio.value)
		gridRows.value = Math.max(20, Math.min(100, newHeight))
	}
	regenerate()
}

const onGridRowsChange = (e) => {
	const newHeight = e.detail.value
	if (isLocked.value && imageAspectRatio.value) {
		const newWidth = Math.round(newHeight * imageAspectRatio.value)
		gridColumns.value = Math.max(20, Math.min(500, newWidth))
	}
	gridRows.value = newHeight
	regenerate()
}

const onGridRowsInput = () => {
	gridRows.value = Math.max(20, Math.min(100, parseInt(gridRows.value) || 50))
	if (isLocked.value && imageAspectRatio.value) {
		const newWidth = Math.round(gridRows.value * imageAspectRatio.value)
		gridColumns.value = Math.max(20, Math.min(100, newWidth))
	}
	regenerate()
}

const toggleLockRatio = () => {
	isLocked.value = !isLocked.value
}

// Perler-Beads 风格：颜色合并阈值
const onMergeThresholdChange = (e) => {
	colorMergeThreshold.value = e.detail.value
	regenerate()
}

const onMergeThresholdInput = () => {
	colorMergeThreshold.value = Math.max(0, Math.min(100, parseInt(colorMergeThreshold.value) || 30))
	regenerate()
}

const getImageTypeName = (typeId) => {
	const type = imageTypeOptions.find(t => t.id === typeId)
	return type ? type.name : '未知'
}

const getModeName = (modeId) => {
	const mode = modeOptions.find(m => m.id === modeId)
	return mode ? mode.name : '未知'
}

const imageTypeIndex = computed(() => {
	return imageTypeOptions.findIndex(t => t.id === imageType.value)
})

const modeIndex = computed(() => {
	return modeOptions.findIndex(m => m.id === pixelationMode.value)
})

const onImageTypeChange = (e) => {
	imageType.value = imageTypeOptions[e.detail.value[0]].id
}

const confirmImageType = () => {
	showImageTypePicker.value = false
	regenerate()
}

const onShowBoardChange = (e) => {
	showBoard.value = e.detail.value
	regenerate()
}

const onShowColorCodeChange = (e) => {
	showColorCode.value = e.detail.value
	regenerate()
}

const onBeadModeChange = (e) => {
	isBeadMode.value = e.detail.value
	regenerate()
}

const loadColorPalette = async () => {
	try {
		// 这里默认使用 mard 色号库
		const colorData = mardColors
		return flattenColorData(colorData)
	} catch (error) {
		console.error('加载色号库失败:', error)
		return []
	}
}

// 🔥 核心：Perler-Beads 风格拼豆转换（重写版）
const processImage = async () => {
	try {
		canvasReady.value = false
		uni.showLoading({
			title: 'Perler风格转换中...'
		})

		if (!imagePath.value) {
			generateDemoImage()
			return
		}

		console.log('🔄 开始初始化Canvas...')

		// 1. 初始化Canvas
		const canvasRes = await getCanvasInstance('mainCanvas')
		console.log('📊 mainCanvas获取结果:', canvasRes)

		if (!canvasRes || !canvasRes.canvas || !canvasRes.ctx) {
			console.error('❌ 主Canvas初始化失败:', { canvasRes })
			throw new Error(`主Canvas初始化失败: ${JSON.stringify(canvasRes)}`)
		}

		mainCanvas = canvasRes.canvas
		mainCtx = canvasRes.ctx
		console.log('✅ 主Canvas初始化成功:', { mainCanvas, mainCtx })

		const processRes = await getCanvasInstance('processCanvas')
		console.log('📊 processCanvas获取结果:', processRes)

		if (!processRes || !processRes.canvas || !processRes.ctx) {
			console.error('❌ 处理Canvas初始化失败:', { processRes })
			throw new Error(`处理Canvas初始化失败: ${JSON.stringify(processRes)}`)
		}

		processCanvas = processRes.canvas
		processCtx = processRes.ctx
		console.log('✅ 处理Canvas初始化成功:', { processCanvas, processCtx })

		console.log('🎨 开始 Perler-Beads 风格转换...')
		console.log('图片路径:', imagePath.value)
		console.log('横向切割:', gridColumns.value)
		console.log('转换模式:', pixelationMode.value)
		console.log('合并阈值:', colorMergeThreshold.value)

		// 2. 获取图片信息
		const imgInfo = await uni.getImageInfo({
			src: imagePath.value
		})
		const { width, height } = imgInfo
		const displaySize = computedCanvasDisplaySize.value

		console.log('原图尺寸:', width, 'x', height)
		console.log('Canvas绘制尺寸:', displaySize, 'px (动态计算)')

		// 3. 计算网格尺寸
		const N = gridColumns.value // 横向网格数量
		const M = gridRows.value // 纵向网格数量

		console.log('网格尺寸:', N, 'x', M, '(横向 x 纵向)')

		// 4. 设置Canvas尺寸（高清绘制：绘制尺寸是显示尺寸的2倍）
		mainCanvas.width = displaySize
		mainCanvas.height = displaySize
		processCanvas.width = width
		processCanvas.height = height

		// 5. 绘制原图到处理Canvas
		await drawImageToCanvas(processCtx, processCanvas, imagePath.value, width, height)

		// 6. 获取ImageData
		const imageData = processCtx.getImageData(0, 0, width, height)

		// 7. Perler-Beads 风格转换（核心！）
		const colorPalette = await loadColorPalette()

		console.log('🚀 使用 Perler-Beads 转换引擎...')
		console.log(`网格: ${N}x${M}`)
		console.log(`模式: ${pixelationMode.value}`)
		console.log(`合并阈值: ${colorMergeThreshold.value}`)

		const result = await convertToPerlerStyle(imageData, colorPalette, {
			N,
			M,
			mode: pixelationMode.value,
			mergeThreshold: colorMergeThreshold.value,
			canvas: processCanvas
		})

		// 8. 绘制结果
		drawPerlerResult(result, colorPalette, showColorCode.value)

		// 9. 更新统计
		colorStats.value = Object.entries(result.colorCounts).map(([key, data]) => ({
			code: key,
			hex: data.color,
			count: data.count
		}))
		pixelWidth.value = N
		pixelHeight.value = M

		// 更新实际使用的gridRows值（可能与计算结果有细微差异）
		gridRows.value = M

		canvasReady.value = true
		uni.hideLoading()

	} catch (error) {
		console.error('处理失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '生成失败: ' + error.message,
			icon: 'none',
			duration: 3000
		})
		generateDemoImage()
	}
}

/**
 * 绘制 Perler-Beads 风格结果
 */
function drawPerlerResult(result, colorPalette, showColorCode = true) {
	const displaySize = computedCanvasDisplaySize.value
	console.log('🎨 drawPerlerResult - Canvas绘制尺寸:', displaySize, 'px')
	console.log(`📊 当前模式 - isFloating: ${isFloating.value}, isFullscreen: ${isFullscreen.value}`)
	console.log(`📊 computedCanvasDisplaySize 计算值: ${displaySize}px`)

	const { mappedData, colorCounts, totalBeads, gridSize } = result
	const { N, M } = gridSize

	// 确保Canvas为正方形
	if (mainCanvas) {
		console.log(`📐 设置Canvas宽高 - width: ${displaySize}, height: ${displaySize}`)
		mainCanvas.width = displaySize
		mainCanvas.height = displaySize
	}

	// 清空画布
	mainCtx.clearRect(0, 0, displaySize, displaySize)

	// 5倍高清缩放：将绘制内容放大5倍（3000px绘制，600rpx显示）
	const scaleRatio = displaySize / canvasSize
	mainCtx.save()
	mainCtx.scale(scaleRatio, scaleRatio)

	// 固定格子大小为22px（用户要求）
	const cellSize = 22

	// 计算图纸原始尺寸
	const originalWidth = N * cellSize
	const originalHeight = M * cellSize

	// 计算缩放比例以适配容器（使用95%的容器大小，最大化利用空间）
	const maxImageSize = canvasSize * 0.95
	const scaleX = maxImageSize / originalWidth
	const scaleY = maxImageSize / originalHeight
	const zoomScale = Math.min(scaleX, scaleY, 1) // 最大为1（不放大）

	// 应用整体缩放
	mainCtx.save()
	mainCtx.scale(zoomScale, zoomScale)

	console.log(`📐 图纸适配: N=${N}, M=${M}, cellSize=${cellSize}px, zoomScale=${zoomScale.toFixed(2)}`)

	// 更新显示的格子大小和缩放级别
	cellSizeDisplay.value = Math.round(cellSize * zoomScale * 10) / 10
	zoomLevel.value = zoomScale

	// 计算居中位置：在缩放后的坐标系中，图纸尺寸为 N*cellSize x M*cellSize
	// 需要居中到 canvasSize/zoomScale 的容器中
	const startX = (canvasSize / zoomScale - N * cellSize) / 2
	const startY = (canvasSize / zoomScale - M * cellSize) / 2

	// 绘制拼豆
	for (let y = 0; y < M; y++) {
		for (let x = 0; x < N; x++) {
			const pixel = mappedData[y][x]
			if (!pixel.isExternal && pixel.key !== 'TRANSPARENT') {
				mainCtx.fillStyle = pixel.color
				mainCtx.fillRect(
					startX + x * cellSize,
					startY + y * cellSize,
					cellSize,
					cellSize
				)
			}
		}
	}

	// 绘制颜色code（用户选择显示时，无论如何都要显示）
	if (showColorCode) {
		// 动态计算合适的字体大小 - 格子越小，相对字体越大
		const minFontSize = 6
		const maxFontSize = 24
		let fontSize

		// 智能字体比例：格子越小，字体占格子比例越大
		if (cellSize < 12) {
			// 超小格子：字体占60%格子高度
			fontSize = Math.max(minFontSize, cellSize * 0.6)
		} else if (cellSize < 16) {
			// 小格子：字体占50%格子高度
			fontSize = Math.max(minFontSize, cellSize * 0.5)
		} else {
			// 正常格子：字体占40%格子高度
			fontSize = Math.max(minFontSize, Math.min(maxFontSize, cellSize * 0.4))
		}

		// 启用高质量文字渲染
		mainCtx.imageSmoothingEnabled = true
		mainCtx.imageSmoothingQuality = 'high'

		for (let y = 0; y < M; y++) {
			for (let x = 0; x < N; x++) {
				const pixel = mappedData[y][x]
				if (!pixel.isExternal && pixel.key !== 'TRANSPARENT') {
					const centerX = startX + x * cellSize + cellSize / 2
					const centerY = startY + y * cellSize + cellSize / 2

					// 根据code长度微调字体大小
					const codeLength = pixel.key.length
					const adjustedFontSize = codeLength > 3 ? fontSize * 0.85 : fontSize

					// 计算背景色亮度，自动选择黑色或白色文字
					const bgColor = pixel.color
					const r = parseInt(bgColor.slice(1, 3), 16)
					const g = parseInt(bgColor.slice(3, 5), 16)
					const b = parseInt(bgColor.slice(5, 7), 16)
					// 使用感知亮度公式：亮度 = 0.299*R + 0.587*G + 0.114*B
					const brightness = (r * 299 + g * 587 + b * 114) / 1000
					const textColor = brightness > 128 ? '#000000' : '#FFFFFF'

					// 根据格子大小决定是否简化code显示
					let displayCode = pixel.key
					if (cellSize < 12) {
						// 超小格子：只显示前2个字符
						displayCode = pixel.key.substring(0, 2)
					} else if (cellSize < 16) {
						// 小格子：只显示前3个字符
						displayCode = pixel.key.substring(0, 3)
					}

					mainCtx.fillStyle = textColor
					mainCtx.font = `bold ${adjustedFontSize}px system-ui, -apple-system, sans-serif`
					mainCtx.textAlign = 'center'
					mainCtx.textBaseline = 'middle'

					// 使用fillText绘制文字，确保矢量质量
					mainCtx.fillText(displayCode, centerX, centerY)
				}
			}
		}
	}

	// 绘制网格线
	if (showBoard.value) {
		mainCtx.strokeStyle = '#cccccc'
		mainCtx.lineWidth = 0.5

		// 纵向线
		for (let x = 0; x <= N; x++) {
			mainCtx.beginPath()
			mainCtx.moveTo(startX + x * cellSize, startY)
			mainCtx.lineTo(startX + x * cellSize, startY + M * cellSize)
			mainCtx.stroke()
		}

		// 横向线
		for (let y = 0; y <= M; y++) {
			mainCtx.beginPath()
			mainCtx.moveTo(startX, startY + y * cellSize)
			mainCtx.lineTo(startX + N * cellSize, startY + y * cellSize)
			mainCtx.stroke()
		}
	}

	console.log('✅ Perler-Beads 绘制完成！')
	console.log(`总珠子数: ${totalBeads}`)
	console.log(`颜色数: ${Object.keys(colorCounts).length}`)
	console.log(`格子大小: ${cellSize.toFixed(1)}px`)

	// 如果格子太小，给用户提示建议使用放大功能
	if (showColorCode && cellSize < 14) {
		const tip = `当前格子大小(${cellSize.toFixed(1)}px)过小，建议使用放大功能查看code号`
		console.warn(tip)
		uni.showToast({
			title: '钉数过多，建议放大查看',
			icon: 'none',
			duration: 3000
		})
	}

	// 恢复图纸缩放和5倍高清缩放
	mainCtx.restore() // 恢复图纸缩放
	mainCtx.restore() // 恢复5倍高清缩放

	// 重置pan值为0（居中），浮窗模式下不重置缩放
	if (!isFloating.value && !isFullscreen.value) {
		panX.value = 0
		panY.value = 0
		zoomLevel.value = 1
	}

	console.log(`✅ 图纸绘制完成: panX=${panX.value}, panY=${panY.value}, zoomLevel=${zoomLevel.value}`)

	// 如果是浮窗模式，重新适配缩放
	if (isFloating.value) {
		setTimeout(() => {
			fitCanvasToFloatingWindow()
		}, 100)
	}

	// 如果是全屏模式，居中显示
	if (isFullscreen.value) {
		setTimeout(() => {
			centerMovableViewInFullscreen()
		}, 100)
	}
}

/**
 * 绘制板子和空钉
 */
function drawBoards(ctx, startX, startY, cellSize, totalPegsX, totalPegsY, pegColorMap) {
	const layout = boardLayout.value
	const singleBoardSize = cellSize * layout.boardSize

	for (let boardRow = 0; boardRow < layout.rows; boardRow++) {
		for (let boardCol = 0; boardCol < layout.cols; boardCol++) {
			const boardX = startX + boardCol * (singleBoardSize + boardSpacing.value)
			const boardY = startY + boardRow * (singleBoardSize + boardSpacing.value)

			// 绘制板子边框
			ctx.strokeStyle = boardLineColor.value
			ctx.lineWidth = 2
			ctx.strokeRect(boardX, boardY, singleBoardSize, singleBoardSize)

			// 绘制空钉
			for (let pegY = 0; pegY < layout.boardSize; pegY++) {
				for (let pegX = 0; pegX < layout.boardSize; pegX++) {
					const globalX = boardCol * layout.boardSize + pegX
					const globalY = boardRow * layout.boardSize + pegY
					const key = `${globalY},${globalX}`

					if (!pegColorMap[key]) {
						const rectX = boardX + pegX * cellSize + cellSize * 0.15
						const rectY = boardY + pegY * cellSize + cellSize * 0.15
						const rectSize = cellSize * 0.7

						ctx.strokeStyle = emptyBorderColor.value
						ctx.lineWidth = 1.5
						ctx.strokeRect(rectX, rectY, rectSize, rectSize)
					}
				}
			}
		}
	}
}

/**
 * 绘制拼豆（正方形版本）
 */
function drawBeads(ctx, startX, startY, cellSize, grid, colors) {
	const rows = grid.length
	const cols = grid[0].length

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const color = grid[y][x]
			if (color) {
				const rectX = startX + x * cellSize + cellSize * 0.08
				const rectY = startY + y * cellSize + cellSize * 0.08
				const rectSize = cellSize * 0.84

				// 绘制拼豆（正方形）
				ctx.fillStyle = color.hex
				ctx.fillRect(rectX, rectY, rectSize, rectSize)

				// 绘制边框
				ctx.strokeStyle = 'rgba(0,0,0,0.1)'
				ctx.lineWidth = 0.5
				ctx.strokeRect(rectX, rectY, rectSize, rectSize)

				// 绘制色号（如果空间足够且开启显示）
				if (showColorCode && cellSize >= 8) {
					const centerX = rectX + rectSize / 2
					const centerY = rectY + rectSize / 2
					ctx.fillStyle = '#000000'
					ctx.font = `bold ${Math.max(8, cellSize * 0.35)}px sans-serif`
					ctx.textAlign = 'center'
					ctx.textBaseline = 'middle'
					ctx.fillText(color.code, centerX, centerY)
				}
			}
		}
	}
}

/**
 * 绘制板子分割线
 */
function drawBoardDividers(ctx, startX, startY, cellSize, totalPegsX, totalPegsY) {
	const layout = boardLayout.value
	const singleBoardSize = cellSize * layout.boardSize

	ctx.strokeStyle = boardLineColor.value
	ctx.lineWidth = 0.5

	for (let boardRow = 0; boardRow < layout.rows; boardRow++) {
		for (let boardCol = 0; boardCol < layout.cols; boardCol++) {
			const boardX = startX + boardCol * (singleBoardSize + boardSpacing.value)
			const boardY = startY + boardRow * (singleBoardSize + boardSpacing.value)

			// 右侧分割线
			ctx.beginPath()
			ctx.moveTo(boardX + singleBoardSize, boardY)
			ctx.lineTo(boardX + singleBoardSize, boardY + singleBoardSize)
			ctx.stroke()

			// 下侧分割线
			ctx.beginPath()
			ctx.moveTo(boardX, boardY + singleBoardSize)
			ctx.lineTo(boardX + singleBoardSize, boardY + singleBoardSize)
			ctx.stroke()
		}
	}
}

/**
 * 原始兼容处理函数（保留现有逻辑）
 */
async function legacyProcessImage(imageData, colorPalette, transparentMap) {
	// 这里放入你原来的 processImage 逻辑（为了简洁，省略具体实现）
	console.log('⚙️ 使用兼容模式处理...')

	// 简化的兼容处理
	const pixelResult = pixelate(imageData, {
		resolution: selectedSize.value,
		mode: isBeadMode.value ? 'nearest' : 'detail'
	})

	// 使用原始的颜色匹配逻辑
	// ...（省略详细实现，保持原有功能）

	return pixelResult
}

// ========== 最终版：K-Means聚类，排除透明像素，保护小面积关键色 ==========
function kMeansColorCluster(pixelData, width, height, clusterCount, transparentMap = null) {
	const pixels = []
	const data = pixelData.data
	const colorCount = {}
	const totalPixels = width * height

	// 1. 只收集不透明的有效像素，排除透明背景
	for (let i = 0; i < data.length; i += 4) {
		const x = (i / 4) % width
		const y = Math.floor((i / 4) / width)
		const a = data[i + 3]
		// 透明像素直接跳过，不参与聚类
		if (a < 128 || (transparentMap && transparentMap.has(`${x},${y}`))) continue

		const r = data[i]
		const g = data[i + 1]
		const b = data[i + 2]
		const key = `${r},${g},${b}`
		pixels.push([r, g, b])
		colorCount[key] = (colorCount[key] || 0) + 1
	}
	if (pixels.length === 0) return []

	// 2. 按「出现频率50% + 色彩饱和度50%」加权，优先保留高饱和关键色
	const colorList = Object.entries(colorCount).map(([key, count]) => {
		const [r, g, b] = key.split(',').map(Number)
		const saturation = Math.max(r, g, b) - Math.min(r, g, b)
		const weight = (count / totalPixels) * 0.5 + (saturation / 255) * 0.5
		return { rgb: [r, g, b], count, weight }
	}).sort((a, b) => b.weight - a.weight)

	// 3. 初始化聚类中心，优先保留关键色
	let centroids = colorList.slice(0, clusterCount).map(item => item.rgb)
	// 去重兜底
	centroids = [...new Map(centroids.map(c => [c.join(','), c])).values()]
	while (centroids.length < clusterCount) {
		const nextColor = colorList[centroids.length]?.rgb
		if (!nextColor) break
		if (!centroids.find(c => c.join(',') === nextColor.join(','))) {
			centroids.push(nextColor)
		}
	}

	// 4. 迭代聚类，温和收敛不强制合并
	let lastCentroids = []
	let iterations = 0
	const maxIterations = 50
	while (iterations < maxIterations && JSON.stringify(centroids) !== JSON.stringify(lastCentroids)) {
		lastCentroids = centroids.map(c => [...c])
		const clusters = Array.from({ length: clusterCount }, () => [])

		for (const p of pixels) {
			let minDist = Infinity
			let clusterIndex = 0
			for (let i = 0; i < centroids.length; i++) {
				const dist = euclideanDistance(p, centroids[i])
				if (dist < minDist) {
					minDist = dist
					clusterIndex = i
				}
			}
			clusters[clusterIndex].push(p)
		}

		const newCentroids = []
		for (let i = 0; i < centroids.length; i++) {
			if (clusters[i].length === 0) {
				newCentroids.push(centroids[i])
				continue
			}
			const sum = clusters[i].reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
			newCentroids.push(sum.map(v => Math.round(v / clusters[i].length)))
		}
		centroids = newCentroids
		iterations++
	}
	return centroids
}

// ========== 新增：像素RGB映射到聚类后的主色 ==========
function mapPixelToCluster(pixelRgb, clusters) {
	let minDist = Infinity
	let bestCluster = pixelRgb
	for (const cluster of clusters) {
		const dist = euclideanDistance(pixelRgb, cluster)
		if (dist < minDist) {
			minDist = dist
			bestCluster = cluster
		}
	}
	return bestCluster
}

// 🔥 提取图片主色（低精度合并杂色用）
function extractMainColors(pixelResult, width, height) {
	const colorCount = {}
	// 遍历所有像素统计颜色
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4
			const r = pixelResult.data[idx]
			const g = pixelResult.data[idx + 1]
			const b = pixelResult.data[idx + 2]
			const a = pixelResult.data[idx + 3]
			if (a < 64) continue
			const key = `${r},${g},${b}`
			colorCount[key] = (colorCount[key] || 0) + 1
		}
	}
	// 转数组并按数量排序
	const colorList = Object.entries(colorCount).map(([key, count]) => {
		const [r, g, b] = key.split(',').map(Number)
		return { rgb: [r, g, b], count }
	}).sort((a, b) => b.count - a.count)

	// 根据精度动态调整主色池大小
	// 精度1-5：5个主色，精度6-10：20个主色
	const mainColorCount = matchAccuracy.value <= 5 ? 5 : 20
	return colorList.slice(0, mainColorCount)
}

// 🔥 低精度：找到最接近的主色（合并杂色）
function findClosestMainColor(targetRgb) {
	let minDist = Infinity
	let bestRgb = targetRgb

	// 根据精度设置合并阈值，精度越低，合并力度越大
	// 精度1-5：阈值逐渐降低，1时最激进合并，5时轻微合并
	const mergeThreshold = (6 - matchAccuracy.value) * 15  // 1→75, 5→15, 越小合并越多

	for (const color of imageMainColors.value) {
		const dist = euclideanDistance(targetRgb, color.rgb)
		if (dist < minDist) {
			minDist = dist
			bestRgb = color.rgb
		}
	}

	// 只有当距离足够近时才合并，否则保持原色
	if (minDist <= mergeThreshold) {
		return bestRgb
	} else {
		return targetRgb  // 距离太远，不合并
	}
}

const generateDemoImage = async () => {
	console.log('🎨 生成示例图纸')

	const colorPalette = [{
		name: '浅米色',
		code: 'A1',
		hex: '#faf5cd',
		rgb: [250, 245, 205]
	},
	{
		name: '草绿色',
		code: 'B2',
		hex: '#64f343',
		rgb: [100, 243, 67]
	},
	{
		name: '浅蓝色',
		code: 'C3',
		hex: '#a2e0f7',
		rgb: [162, 224, 247]
	},
	{
		name: '深蓝色',
		code: 'D4',
		hex: '#162d7b',
		rgb: [22, 45, 123]
	},
	{
		name: '粉红色',
		code: 'E5',
		hex: '#f0569f',
		rgb: [240, 86, 159]
	},
	{
		name: '深红色',
		code: 'F6',
		hex: '#913635',
		rgb: [145, 54, 53]
	},
	{
		name: '棕色',
		code: 'G7',
		hex: '#985c3a',
		rgb: [152, 92, 58]
	},
	{
		name: '浅粉色',
		code: 'H8',
		hex: '#e7d6dc',
		rgb: [231, 214, 220]
	}
	]

	// 使用 2D Canvas API（与 processImage 保持一致）
	const canvasRes = await getCanvasInstance('mainCanvas')
	if (!canvasRes || !canvasRes.canvas || !canvasRes.ctx) {
		console.error('❌ Canvas初始化失败:', canvasRes)
		return
	}

	mainCanvas = canvasRes.canvas
	mainCtx = canvasRes.ctx

	console.log('✅ Canvas初始化成功')

	const gridSize = selectedSize.value

	// 固定格子大小为22px（绘制时的大小）
	const cellSize = 22

	// 动态计算 Canvas 显示尺寸
	const displaySize = computedCanvasDisplaySize.value
	const actualCanvasSize = displaySize / 5 // 显示尺寸 = 绘制尺寸 / 5

	console.log(`📐 示例图纸配置: gridSize=${gridSize}, cellSize=${cellSize}px, displaySize=${displaySize}px`)
	console.log(`📏 实际Canvas显示尺寸: ${actualCanvasSize}px`)

	// 计算缩放比例以适配窗口
	const originalContentSize = gridSize * cellSize
	const fitScale = Math.min(actualCanvasSize / originalContentSize, 1)

	// 更新显示的格子大小和缩放级别
	cellSizeDisplay.value = Math.round(cellSize * fitScale * 10) / 10
	zoomLevel.value = fitScale

	console.log(`🔢 缩放适配: originalContentSize=${originalContentSize}px, fitScale=${fitScale.toFixed(3)}`)

	// 设置Canvas尺寸
	mainCanvas.width = displaySize
	mainCanvas.height = displaySize

	// 清空画布
	mainCtx.fillStyle = '#ffffff'
	mainCtx.fillRect(0, 0, displaySize, displaySize)

	// 5倍高清缩放
	mainCtx.save()
	mainCtx.scale(5, 5) // 5倍放大绘制

	const colorCountMap = {}

	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			const colorIndex = Math.floor(Math.random() * colorPalette.length)
			const color = colorPalette[colorIndex]

			if (!colorCountMap[color.code]) {
				colorCountMap[color.code] = {
					...color,
					count: 0
				}
			}
			colorCountMap[color.code].count++

			mainCtx.fillStyle = color.hex
			mainCtx.beginPath()
			mainCtx.arc(
				i * cellSize + cellSize / 2,
				j * cellSize + cellSize / 2,
				cellSize / 2 - 1,
				0,
				2 * Math.PI
			)
			mainCtx.fill()
		}
	}

	mainCtx.strokeStyle = '#e8e8e8'
	mainCtx.lineWidth = 0.5 / zoomScale // 考虑缩放，保持线条粗细一致
	for (let i = 0; i <= gridSize; i++) {
		mainCtx.beginPath()
		mainCtx.moveTo(0, i * cellSize)
		mainCtx.lineTo(gridSize * cellSize, i * cellSize)
		mainCtx.stroke()

		mainCtx.beginPath()
		mainCtx.moveTo(i * cellSize, 0)
		mainCtx.lineTo(i * cellSize, gridSize * cellSize)
		mainCtx.stroke()
	}

	mainCtx.restore() // 恢复5倍高清缩放

	colorStats.value = Object.values(colorCountMap).sort((a, b) => b.count - a.count)

	canvasReady.value = true
	console.log('✅ 示例图纸绘制完成')

	// 重置pan值为0（居中），浮窗模式下不重置缩放
	if (!isFloating.value) {
		panX.value = 0
		panY.value = 0
		zoomLevel.value = 1
	} else {
		// 浮窗模式下，重新适配缩放
		console.log('🎯 浮窗模式下，重新适配缩放...')
		setTimeout(() => {
			fitCanvasToFloatingWindow()
		}, 100)
	}
}

const regenerate = () => {
	if (imagePath.value) {
		processImage()
	} else {
		generateDemoImage()
	}
}

// 自动选择最优板子尺寸
const autoSelectBestBoard = () => {
	const gridSize = selectedSize.value
	let bestBoardSize = 52 // 默认52x52
	let minTotalBoards = Infinity

	for (const option of boardSizeOptions) {
		const boardSize = option.size
		const cols = Math.ceil(gridSize / boardSize)
		const rows = Math.ceil(gridSize / boardSize)
		const totalBoards = rows * cols

		if (totalBoards < minTotalBoards ||
			(totalBoards === minTotalBoards && boardSize < bestBoardSize)) {
			minTotalBoards = totalBoards
			bestBoardSize = boardSize
		}
	}

	selectedBoardSize.value = bestBoardSize
	console.log('自动选择最优板子:', bestBoardSize, '×', bestBoardSize, '需要', minTotalBoards, '个板子')
}

// 导出设置相关函数
const showExportSettings = () => {
	showExportSettingsDialog.value = true
}

const toggleExportSettingsDialog = () => {
	// 如果设置了记住选项且没有按住shift键，直接下载
	if (exportSettings.value.rememberSettings) {
		performDownload()
	} else {
		showExportSettingsDialog.value = true
	}
}

const performDownload = () => {
	// 保存设置
	if (exportSettings.value.rememberSettings) {
		uni.setStorageSync('exportSettings', exportSettings.value)
	}

	showExportSettingsDialog.value = false

	uni.showLoading({
		title: '生成中...'
	})

	// 根据设置生成图片
	setTimeout(() => {
		// 简化的下载逻辑（实际应根据设置生成不同图片）
		// 使用更高的分辨率导出，确保文字清晰
		const exportScale = 3 // 增大导出倍数
		uni.canvasToTempFilePath({
			canvas: mainCanvas,
			width: CANVAS_SIZE,
			height: CANVAS_SIZE,
			destWidth: CANVAS_SIZE * exportScale,
			destHeight: CANVAS_SIZE * exportScale,
			fileType: 'png',
			quality: 1,
			success: (res) => {
				uni.saveImageToPhotosAlbum({
					filePath: res.tempFilePath,
					success: () => {
						uni.hideLoading()
						uni.showModal({
							title: '成功',
							content: '图纸已保存到相册',
							showCancel: false
						})
					},
					fail: () => {
						uni.hideLoading()
						uni.showToast({
							icon: 'none',
							title: '保存失败'
						})
					}
				})
			},
			fail: () => {
				uni.hideLoading()
				uni.showToast({
					icon: 'none',
					title: '生成失败'
				})
			}
		})
	}, 100)
}

// 高清下载功能（修复作用域报错+放大模糊）
const downloadImage = () => {
	// 检查是否有保存的设置
	const savedSettings = uni.getStorageSync('exportSettings')
	if (savedSettings) {
		exportSettings.value = { ...exportSettings.value, ...savedSettings }
	}

	toggleExportSettingsDialog()
}

onLoad(async (options) => {
	imagePath.value = JSON.parse(decodeURIComponent(options.image)) || ''
	selectedBrand.value = options.brand || 'mard'
	selectedSize.value = parseInt(options.size) || 29
	gridColumns.value = parseInt(options.gridWidth) || 50
	gridRows.value = parseInt(options.gridHeight) || 50
	pixelationMode.value = options.pixelationMode || 'dominant'
	colorMergeThreshold.value = parseInt(options.colorMergeThreshold) || 30
	showBoard.value = options.showBoard === 'true'
	showColorCode.value = options.showColorCode !== 'false'

	// 加载保存的导出设置
	const savedSettings = uni.getStorageSync('exportSettings')
	if (savedSettings) {
		exportSettings.value = { ...exportSettings.value, ...savedSettings }
	}

	console.log('页面加载参数:', options)

	// 获取图片信息计算宽高比
	if (imagePath.value) {
		try {
			const imageInfo = await uni.getImageInfo({
				src: imagePath.value
			})
			if (imageInfo && imageInfo.width && imageInfo.height) {
				imageAspectRatio.value = imageInfo.width / imageInfo.height
			}
		} catch (error) {
			console.error('获取图片信息失败:', error)
		}
	}

	// 自动选择最优板子
	autoSelectBestBoard()
})

// 在DOM准备好后生成图纸
onMounted(() => {
	console.log('🎯 DOM已准备好，开始生成图纸...')

	// 动态获取Canvas显示尺寸
	const timer = setTimeout(async () => {
		try {
			const query = uni.createSelectorQuery()
			console.log('查询Canvas尺寸...', query)
			query.select('#mainCanvas')
				.boundingClientRect()
				.exec((res) => {
					console.log('🔍 Canvas查询结果:', res)
					if (res && res[0] && res[0].width && res[0].width > 0) {
						// 获取实际像素尺寸（不是rpx）
						canvasSize = res[0].width
						console.log('📐 Canvas显示尺寸更新为:', canvasSize, 'px')
						console.log('📏 格子数:', gridColumns.value, 'x', gridRows.value)
						console.log('📐 理论格子大小:', (canvasSize / Math.max(gridColumns.value, gridRows.value)).toFixed(1), 'px')
					} else {
						console.warn('⚠️ 无法获取Canvas尺寸，使用默认值:', canvasSize)
					}
					regenerate()
				})
		} catch (error) {
			console.error('❌ 更新Canvas尺寸失败:', error)
			regenerate()
		}
		clearTimeout(timer)
	}, 300)
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme-modern.scss';

.page-container {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	padding: 48rpx;
	box-sizing: border-box;
	position: relative;
	z-index: 1;
}

/* 预览区域 */
.preview-section {
	margin-bottom: 24rpx;
	transition: all 0.3s ease;
	display: flex;
	flex-direction: column;

	/* 浮窗样式 */
	&.floating {
		position: fixed;
		display: flex;
		flex-direction: column;

		/* 覆盖原top */
		transform: none !important;
		/* 禁用原transform，用JS控制left/top */
		z-index: 9999;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
		transition: left 0.05s ease-out, top 0.05s ease-out;
		/* 调整过渡时间，更流畅 */
		border-radius: 24rpx;
		// overflow: hidden; // 移除overflow，让缩放手柄可以超出边界

		/* 浮窗模式下section-header没有margin-bottom */
		.section-header {
			margin-bottom: 0;
		}

		/* 浮窗缩放手柄 */
		.resize-handle {
			position: absolute;
			width: 60rpx;
			height: 60rpx;
			background: transparent;
			border: none;
			z-index: 10000;
			touch-action: none;

			&.resize-handle-nw {
				top: -30rpx;
				left: -30rpx;
				cursor: nw-resize;
			}

			&.resize-handle-ne {
				top: -30rpx;
				right: -30rpx;
				cursor: ne-resize;
			}

			&.resize-handle-sw {
				bottom: -30rpx;
				left: -30rpx;
				cursor: sw-resize;
			}

			&.resize-handle-se {
				bottom: -30rpx;
				right: -30rpx;
				cursor: se-resize;
			}
		}
	}

	/* 【新增】拖拽时禁用过渡动画，避免卡顿 */
	&.dragging {
		transition: none !important;
	}

	&.sticky {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--bg-primary);
		padding: 24rpx 0;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}

	&.floating-window {
		flex: 1;
		width: 100%;
		height: 400rpx;
		padding: 0; // 浮窗模式去掉padding，让图纸占满
		border-radius: 0;
		overflow: hidden;
		background: #ffffff;
		transition: none; // 拖拽时禁用过渡效果
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
		cursor: move;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 99999; // 提高层级，确保在最上面
		margin-bottom: 0;
		border: none;


		.canvas-container {
			// 移除 !important，让内联样式生效
			box-sizing: border-box;
			display: flex;
			align-items: center;
			justify-content: center;

			.canvas-drag-container {
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pd-canvas {
				// Canvas的实际尺寸由JavaScript设置，CSS只控制显示尺寸
				display: block; // 移除图片默认的底部间隙
			}
		}

		.zoom-controls {
			position: absolute;
			bottom: 16rpx;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0, 0, 0, 0.7);
			border-radius: 24rpx;
			padding: 8rpx;
			z-index: 10;

			.zoom-btn {
				width: 48rpx;
				height: 48rpx;
				font-size: 24rpx;
			}

			.zoom-level {
				font-size: 20rpx;
				min-width: 60rpx;
				color: white;
			}
		}
	}

	&.floating .section-header {
		cursor: move;
		user-select: none;
		-webkit-user-select: none;
		background: rgba(26, 26, 46, 0.9);
		color: white;
		z-index: 11;
		padding: 12rpx 16rpx;
		border-radius: 16rpx;
		flex-shrink: 0;

		.section-title,
		.section-subtitle {
			color: white;
			font-size: 22rpx;
		}
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24rpx;

		.section-title {
			font-size: 28rpx;
			font-weight: 600;
			color: #1a1a2e;
		}

		.header-actions {
			display: flex;
			gap: 16rpx;

			.action-icon {
				width: 64rpx;
				height: 64rpx;
				// background: #f5f5f5;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.3s;

				.sticky-icon,
				.fullscreen-icon {
					width: 32rpx;
					height: 32rpx;
				}

				&:hover {
					background: var(--text-lighter);
				}

				&.active {
					background: #bedbff26;
				}
			}
		}

		.section-subtitle {
			font-size: 24rpx;
			color: #999;
		}
	}

	.preview-card {
		background: #ffffff;
		border-radius: 32rpx;
		padding: 32rpx;
		border: 2rpx solid #ebe6e7;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1;
		box-sizing: border-box;

		/* 确保canvas-drag-container居中 */
		.canvas-drag-container {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		&.fullscreen {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 9999;
			background: #1a1a2e;
			border: none;
			border-radius: 0;
			display: flex;
			flex-direction: column;
			padding: 24rpx;
			box-sizing: border-box;

			.fullscreen-close {
				position: absolute;
				top: 24rpx;
				right: 24rpx;
				width: 80rpx;
				height: 80rpx;
				background: rgba(255, 255, 255, 0.1);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 40rpx;
				color: white;
				cursor: pointer;
				z-index: 10000;
				transition: all 0.3s;

				&:hover {
					background: rgba(255, 255, 255, 0.2);
				}
			}

			.canvas-container {
				flex: 1; // 占据剩余空间（除了底部控制按钮）
				display: flex;
				align-items: center;
				justify-content: center;
				overflow: hidden;
				background: #0f0f1a;
				border-radius: 16rpx;
				margin-bottom: 16rpx;
				min-height: 0;
				position: relative;
				// 全屏模式下，移除正方形限制，让 movable-area 占据全屏可用区域
				// 只在非全屏模式下保持正方形
				max-width: 600rpx;
				max-height: 600rpx;
				aspect-ratio: 1;
				align-self: center; // 在 flex 容器中居中

				.canvas-drag-container {
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: grab;
					user-select: none;
					touch-action: none;

					&.dragging {
						cursor: grabbing;
					}
				}
			}

			.pd-canvas {
				transform-origin: center center;
			}

			.zoom-controls {
				display: flex;
				align-items: center;
				gap: 16rpx;
				padding: 16rpx;
				background: rgba(255, 255, 255, 0.1);
				border-radius: 12rpx;
				justify-content: center;

				.zoom-btn {
					width: 64rpx;
					height: 64rpx;
					display: flex;
					align-items: center;
					justify-content: center;
					background: rgba(255, 255, 255, 0.2);
					border-radius: 8rpx;
					font-size: 32rpx;
					color: white;
					cursor: pointer;
					transition: all 0.3s;

					&:hover {
						background: rgba(255, 255, 255, 0.3);
					}
				}

				.zoom-level {
					font-size: 24rpx;
					color: white;
					min-width: 80rpx;
					text-align: center;
				}
			}
		}

		margin-bottom: 32rpx;

		.pd-canvas {
			width: 600rpx;
			height: 600rpx;
			border-radius: 16rpx;
			z-index: 1;
		}

		.canvas-placeholder {
			width: 600rpx;
			height: 600rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f8f8f8;
			border-radius: 16rpx;

			.placeholder-text {
				font-size: 28rpx;
				color: #ccc;
			}
		}
	}

	.floating-window {
		flex: 1;
		width: 100%;
		height: 400rpx;
		padding: 0; // 浮窗模式去掉padding，让图纸占满
		border-radius: 16rpx;
		overflow: hidden;
		background: #ffffff;
		transition: none; // 拖拽时禁用过渡效果
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
		cursor: move;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 99999; // 提高层级，确保在最上面
		margin-bottom: 0;
		border: none;
	}

}

/* 操作按钮 */
.action-section {
	display: flex;
	gap: 24rpx;
	margin-bottom: 24rpx;

	.action-btn {
		flex: 1;
		height: 96rpx;
		border: none;
		border-radius: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
		font-size: 28rpx;
		font-weight: 500;
		transition: all 0.2s ease;

		&.edit {
			background: #ffffff;
			color: #1a1a2e;
			// box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
			border: 2rpx solid #ebe6e7;

			&:active {
				background: #f0f0f0;
			}

			.btn-icon {
				font-size: 32rpx;
			}

			.edit-icon {
				width: 36rpx;
				height: 36rpx;
			}
		}

		&.download {
			background: var(--text-primary);
			color: #ffffff;
			// box-shadow: 0 8rpx 16rpx rgba(26, 26, 46, 0.24);

			&:active {
				background: #2a2a3e;
				transform: translateY(2rpx);
			}

			.btn-icon {
				font-size: 28rpx;
			}

			.download-icon {
				width: 36rpx;
				height: 36rpx;
			}
		}

		.btn-text {
			font-size: 28rpx;
		}
	}
}

/* 设置区域 */
.settings-section {
	background: #ffffff;
	border-radius: 24rpx;
	margin-bottom: 24rpx;
	overflow: hidden;
	// box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	border: 2rpx solid #ebe6e7;

	.settings-header {
		padding: 28rpx 32rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f0f0f0;

		.settings-title {
			font-size: 28rpx;
			font-weight: 600;
			color: #1a1a2e;
		}

		.settings-arrow {
			font-size: 40rpx;
			color: #ccc;
			transition: transform 0.3s ease;

			&.is-open {
				transform: rotate(90deg);
			}
		}
	}

	.settings-content {
		padding: 24rpx 32rpx;
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;

		.setting-label {
			font-size: 26rpx;
			color: #666;
			flex-shrink: 0;
		}

		.setting-item-label {
			margin-bottom: var(--space-md);
		}

		.setting-value {
			font-size: 26rpx;
			color: #1a1a2e;
			font-weight: 500;
		}

		.slider-container {
			display: flex;
			align-items: center;
			gap: 16rpx;

			slider {
				flex: 1;
			}

			.slider-value {
				font-size: 24rpx;
				color: #1a1a2e;
				min-width: 80rpx;
				text-align: right;
			}
		}
	}

	.size-setting {
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
	}
}



/* 版型尺寸面板 */
.size-panel {
	width: 100%;
	border: 2rpx solid var(--border-medium);
	border-radius: var(--radius-lg);
	padding: 40rpx;
	box-sizing: border-box;
	background: #ffffff;
}

.size-row {
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.size-label-container {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.size-label-icon {
		display: flex;
		align-items: center;
		gap: 20rpx;

		.size-icon {
			width: 40rpx;
			height: 40rpx;
		}
	}
}

.size-label {
	font-size: var(--text-base);
	color: var(--text-primary);
	font-weight: 500;
	width: 120rpx;
	flex-shrink: 0;
}

.size-value {
	display: flex;
	align-items: center;
	gap: 8rpx;

	.size-label-text {
		font-weight: 600;
		font-size: 30rpx;
	}

	.unit-text {
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
}

.lock-row-container {
	padding-top: 16rpx;
	border-top: 2rpx solid var(--text-light);
}

.lock-row {
	display: flex;
	align-items: center;
	justify-content: center;
	// margin: 16rpx 0;
	cursor: pointer;
	transition: all 0.3s ease;
	border: 2rpx solid var(--border-medium);
	border-radius: 28rpx;
	gap: 20rpx;
	height: 96rpx;

	&.active {
		background: var(--accent-light-2);
		border-color: var(--accent-light-2);
	}

	.lock-icon {
		width: 36rpx;
		height: 36rpx;
	}

	.lock-text {
		font-size: var(--text-base);
		color: var(--text-tertiary);
	}
}

/* 统计区域 */
.stats-section {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 28rpx 24rpx;
	margin-bottom: 24rpx;
	// box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	border: 2rpx solid #ebe6e7;

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 20rpx;

		.stats-title {
			font-size: 28rpx;
			font-weight: 600;
			color: #1a1a2e;
		}

		.stats-total {
			font-size: 24rpx;
			color: #999;
		}
	}

	.stats-list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
	}

	.color-row {
		display: flex;
		align-items: center;
		gap: 16rpx;

		.color-swatch {
			width: 56rpx;
			height: 56rpx;
			border-radius: 12rpx;
			border: 2rpx solid #f0f0f0;
			flex-shrink: 0;
		}

		.color-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 4rpx;

			.color-name {
				font-size: 24rpx;
				color: #1a1a2e;
				font-weight: 500;
			}

			.color-code {
				font-size: 22rpx;
				color: #999;
			}
		}

		.color-progress {
			width: 120rpx;
			flex-shrink: 0;

			.progress-bar {
				width: 100%;
				height: 12rpx;
				background: #f0f0f0;
				border-radius: 6rpx;
				overflow: hidden;

				.progress-fill {
					height: 100%;
					border-radius: 6rpx;
					transition: width 0.3s ease;
				}
			}
		}

		.color-count {
			display: flex;
			align-items: baseline;
			gap: 2rpx;
			min-width: 80rpx;
			justify-content: flex-end;

			.count-num {
				font-size: 26rpx;
				color: #1a1a2e;
				font-weight: 600;
			}

			.count-unit {
				font-size: 22rpx;
				color: #999;
			}
		}
	}
}

/* 提示区域 */
.tips-section {
	margin-bottom: 24rpx;

	.tips-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 24rpx;
		padding: 24rpx;
		display: flex;
		gap: 16rpx;
		box-shadow: 0 8rpx 16rpx rgba(102, 126, 234, 0.24);

		.tips-icon {
			width: 48rpx;
			height: 48rpx;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 12rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24rpx;
			color: #ffffff;
			flex-shrink: 0;
		}

		.tips-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8rpx;

			.tips-title {
				font-size: 26rpx;
				font-weight: 600;
				color: #ffffff;
			}

			.tips-text {
				font-size: 24rpx;
				color: rgba(255, 255, 255, 0.85);
				line-height: 1.5;
			}
		}
	}
}

.bottom-placeholder {
	height: 120rpx;
}

/* 恢复浮窗按钮 */
.floating-restore-btn {
	position: fixed;
	bottom: 120rpx;
	right: 24rpx;
	width: 96rpx;
	height: 96rpx;
	background: var(--text-primary);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
	z-index: 1001;
	cursor: pointer;

	.restore-icon {
		width: 48rpx;
		height: 48rpx;
		filter: brightness(0) invert(1);
	}
}

/* 浮窗中的缩放控制 */
.preview-section.floating-window .zoom-controls {
	display: none !important;
}

/* 品牌选择器 */
.brand-picker {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #ffffff;
	border-radius: 32rpx 32rpx 0 0;
	padding-bottom: env(safe-area-inset-bottom);
	z-index: 10001;

	.picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 28rpx 32rpx;
		border-bottom: 1rpx solid #f0f0f0;

		.picker-cancel,
		.picker-confirm {
			font-size: 28rpx;
			color: #1a1a2e;
			padding: 8rpx 16rpx;
		}

		.picker-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #1a1a2e;
		}
	}

	.picker-item {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 88rpx;
		font-size: 28rpx;
		color: #1a1a2e;
	}
}

/* 滑块输入容器 */
.slider-input-container {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex: 1;
	min-width: 0;

	slider {
		flex: 1;
		min-width: 0;
	}

	.size-input-container {
		display: flex;
		align-items: center;
		gap: 4rpx;
		flex-shrink: 0;
	}

	.size-input {
		width: 70rpx;
		height: 44rpx;
		padding: 4rpx 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1rpx solid #e0e0e0;
		border-radius: 8rpx;
		font-size: 22rpx;
		color: #1a1a2e;
		text-align: center;
		box-sizing: border-box;
		flex-shrink: 0;

		&:focus {
			border-color: #1a1a2e;
			background: #ffffff;
		}
	}

	.unit-text {
		font-size: 22rpx;
		color: #999;
		flex-shrink: 0;
	}
}

/* 品牌选择按钮 */
.setting-select {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 24rpx;
	border-radius: 12rpx;
	min-width: 160rpx;

	.select-value {
		font-size: 26rpx;
		color: #1a1a2e;
		font-weight: 500;
	}

	.select-arrow {
		font-size: 32rpx;
		color: #999;
	}
}

/* 尺寸选项 */
.size-options {
	display: flex;
	gap: 12rpx;
	flex-wrap: wrap;

	.size-option {
		padding: 12rpx 24rpx;
		background: #f5f5f5;
		border-radius: 12rpx;
		border: 2rpx solid transparent;
		transition: all 0.2s ease;

		.size-text {
			font-size: 24rpx;
			color: #666;
		}

		&.active {
			background: #1a1a2e;
			border-color: #1a1a2e;

			.size-text {
				color: #ffffff;
			}
		}
	}
}

/* 隐藏Canvas */
.hidden-canvas {
	position: fixed;
	left: -9999rpx;
	width: 1rpx;
	height: 1rpx;
}

/* 导出设置弹框 */
.export-settings-dialog {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 99999;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48rpx;
	overflow: hidden;
	touch-action: none;
}

.export-settings-container {
	width: 600rpx;
	max-width: 90vw;
	height: 800rpx;
	max-height: 85vh;
	background: #ffffff;
	border-radius: 24rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
	z-index: 100000;
}

.export-settings-header {
	flex-shrink: 0;
	background: #ffffff;
	padding: 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.export-settings-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a2e;
}

.export-settings-close {
	font-size: 40rpx;
	color: #999;
	cursor: pointer;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.export-settings-content {
	flex: 1;
	background: #ffffff;
	padding: 32rpx;
	overflow-y: auto;
}

.export-settings-footer {
	flex-shrink: 0;
	background: #ffffff;
	padding: 32rpx;
	display: flex;
	gap: 24rpx;
	border-top: 1rpx solid #f0f0f0;
}

.export-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 24rpx;
	font-size: 28rpx;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border: none;

	&.primary {
		background: #1a1a2e;
		color: #ffffff;
	}

	&.secondary {
		background: #f5f5f5;
		color: #666;
	}
}

.export-option-group {
	margin-bottom: 40rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.group-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #1a1a2e;
	margin-bottom: 24rpx;
	display: block;
}

.radio-group {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.radio-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	cursor: pointer;
	padding: 16rpx;
	border-radius: 12rpx;
	transition: background 0.2s;

	&:active {
		background: #f5f5f5;
	}

	text {
		font-size: 26rpx;
		color: #333;
	}
}

.radio {
	width: 36rpx;
	height: 36rpx;
	border: 2rpx solid #ccc;
	border-radius: 50%;
	position: relative;
	transition: all 0.2s;

	&.radio-checked {
		border-color: #1a1a2e;
		background: #1a1a2e;

		&::after {
			content: '';
			position: absolute;
			top: 50%;
			left: 50%;
			width: 16rpx;
			height: 16rpx;
			background: #ffffff;
			border-radius: 50%;
			transform: translate(-50%, -50%);
		}
	}
}

.checkbox-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	cursor: pointer;
	padding: 16rpx;
	border-radius: 12rpx;
	transition: background 0.2s;
	margin-bottom: 24rpx;

	&:active {
		background: #f5f5f5;
	}

	&:last-child {
		margin-bottom: 0;
	}

	text {
		font-size: 26rpx;
		color: #333;
	}
}

.checkbox {
	width: 36rpx;
	height: 36rpx;
	border: 2rpx solid #ccc;
	border-radius: 8rpx;
	position: relative;
	transition: all 0.2s;

	&.checkbox-checked {
		border-color: #1a1a2e;
		background: #1a1a2e;

		&::after {
			content: '✓';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: #ffffff;
			font-size: 24rpx;
			font-weight: bold;
		}
	}
}

.author-input-container {
	margin-top: 16rpx;
	padding-left: 56rpx;
}

.author-input {
	width: 100%;
	height: 72rpx;
	padding: 0 24rpx;
	border: 2rpx solid #e8e8e8;
	border-radius: 12rpx;
	font-size: 26rpx;
	color: #333;
	box-sizing: border-box;
}

/* 浮窗设置图标 */
.settings-icon {
	width: 32rpx;
	height: 32rpx;
}
</style>