<template>
	<view class="page-container" :class="{ 'no-scroll': isFullscreen }">
		<!-- 全屏遮罩：完全阻止任何操作穿透 -->
		<view v-if="isFullscreen || showExportSettingsDialog || showExportPreviewDialog" class="fullscreen-overlay"
			@touchstart.prevent @touchmove.prevent @touchend.prevent @click.prevent></view>

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
				<movable-area :scale-area="true" class="canvas-container" :style="canvasContainerStyle"
					style="background-color:darkseagreen">
					<movable-view :scale="true" direction="all" :x="panX" :y="panY" :scale-min="0.2" :inertia="false"
						:out-of-bounds="false" :damping="100" :scale-value="scaleValue" class="canvas-drag-container"
						:style="dragContainerStyle" @scale="onScale" @change="onChange" style="background-color:aqua">
						<canvas type="2d" id="mainCanvas" class="export-canvas" :style="canvasStyle"
							style="background-color:bisque;position: fixed;left: 9999px;" />
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
								<slider :value="gridColumns" min="5" max="300" @change="onGridColumnsChange"
									activeColor="#1a1a2e" backgroundColor="#e8e8e8" block-size="20" />
								<view class="size-input-container">
									<input class="size-input" type="number" v-model="gridColumns"
										@blur="onGridColumnsInput" @confirm="onGridColumnsInput" min="5" max="300" />
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
								<slider :value="gridRows" min="5" max="300" @change="onGridRowsChange"
									activeColor="#1a1a2e" backgroundColor="#e8e8e8" block-size="20" />
								<view class="size-input-container">
									<input class="size-input" type="number" v-model="gridRows" @blur="onGridRowsInput"
										@confirm="onGridRowsInput" min="5" max="300" />
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
					<text class="export-settings-close" @click="cancelExportSettings">✕</text>
				</view>
				<scroll-view class="export-settings-content" scroll-y>
					<!-- 导出方式 -->
					<view class="export-option-group">
						<text class="group-title">导出模式</text>
						<view class="radio-group">
							<view v-for="mode in separateImagesOptions" :key="mode.id" class="radio-item"
								:class="{ active: exportSettings.separateImages === mode.id }"
								@click="exportSettings.separateImages = mode.id">
								<text class="mode-name">{{ mode.name }}</text>
							</view>
						</view>
					</view>

					<!-- 合并方向 -->
					<view class="export-option-group" v-if="exportSettings.separateImages === 'merge'">
						<text class="group-title">拼接方向</text>
						<view class="radio-group">
							<view v-for="lmode in layoutDirectionOptions" :key="lmode.id" class="radio-item"
								:class="{ active: exportSettings.layoutDirection === lmode.id }"
								@click="exportSettings.layoutDirection = lmode.id">
								<image
									:src="exportSettings.layoutDirection === lmode.id ? '/static/svg/vertical2-selected.svg' : '/static/svg/vertical2.svg'"
									class="icon" :class="{ 'horizontal': lmode.id === 'horizontal' }" />
								<text class="mode-name">{{ lmode.name }}</text>
							</view>
						</view>
					</view>

					<!-- 作者名 -->
					<view class="export-option-group">
						<view class="show-item">
							<text class="group-title">添加作者名</text>
							<view class="switch-container">
								<switch :checked="exportSettings.showAuthor" @change="onShowAuthorChange"
									color="#bedbff" style="transform:scale(0.8)" />
							</view>
						</view>
						<view class="author-input-container" v-if="exportSettings.showAuthor">
							<input class="author-input" type="text" v-model="authorName" placeholder="请输入作者名" />
						</view>
					</view>

					<!-- 水印 -->
					<view class="export-option-group">
						<view class="show-item">
							<text class="group-title">添加水印</text>
							<view class="switch-container">
								<switch :checked="exportSettings.addWatermark" @change="onAddWatermarkChange"
									color="#bedbff" style="transform:scale(0.8)" />
							</view>
						</view>
						<view class="radio-group" v-if="exportSettings.addWatermark">
							<view v-for="wmode in watermarkOptions" :key="wmode.id" class="radio-item"
								:class="{ active: exportSettings.watermarkType === wmode.id }"
								@click="exportSettings.watermarkType = wmode.id">
								<text class="mode-name">{{ wmode.name }}</text>
							</view>
						</view>
						<view style="margin-top: 24rpx;" class="author-input-container"
							v-if="exportSettings.addWatermark">
							<input class="author-input" type="text" v-model="watermarkText" placeholder="请输入水印文本" />
						</view>
					</view>

					<!-- 阴影 -->
					<view class="export-option-group">
						<view class="show-item">
							<text class="group-title">添加阴影</text>
							<view class="switch-container">
								<switch :checked="exportSettings.addShadow" @change="onAddShadowChange" color="#bedbff"
									style="transform:scale(0.8)" />
							</view>
						</view>
					</view>

					<!-- 分享码 -->
					<view class="export-option-group">
						<view class="show-item">
							<text class="group-title">添加分享码</text>
							<view class="switch-container">
								<switch :checked="exportSettings.addShareCode" @change="onAddShareCodeChange"
									color="#bedbff" style="transform:scale(0.8)" />
							</view>
						</view>
					</view>

					<!-- 保留原图（分享码时显示） -->
					<view class="export-option-group" v-if="exportSettings.addShareCode">
						<view class="show-item">
							<text class="group-title">保留原图</text>
							<view class="switch-container">
								<switch :checked="exportSettings.saveOriginalImage"
									@change="exportSettings.saveOriginalImage = $event.detail.value" color="#bedbff"
									style="transform:scale(0.8)" />
							</view>
						</view>
						<text class="option-hint" v-if="exportSettings.saveOriginalImage">原图将存入云端，方便导入时还原</text>
					</view>

					<!-- 作品信息（分享码时显示） -->
					<view class="export-option-group" v-if="exportSettings.addShareCode">
						<text class="group-title">作品信息</text>

						<!-- 作品标题 -->
						<view class="input-item">
							<text class="input-label">标题</text>
							<input class="input-field" v-model="exportSettings.title" placeholder="给作品起个名字"
								maxlength="100" />
						</view>

						<!-- 作品描述（同步到发现时显示） -->
						<view class="input-item" v-if="exportSettings.shareToDiscovery">
							<text class="input-label">描述</text>
							<textarea class="input-textarea" v-model="exportSettings.description" placeholder="描述一下你的作品"
								maxlength="500" :rows="3"></textarea>
						</view>

						<!-- 标签（同步到发现时显示） -->
						<view class="input-item" v-if="exportSettings.shareToDiscovery">
							<text class="input-label">标签</text>
							<input class="input-field" v-model="exportSettings.tagsInput"
								placeholder="多个标签用逗号分隔，如: 卡通,可爱,粉色" maxlength="200" />
						</view>

						<!-- 是否公开 -->
						<view class="show-item" style="margin-top: 20rpx;">
							<text class="group-title">公开分享</text>
							<view class="switch-container">
								<switch :checked="exportSettings.isPublic"
									@change="exportSettings.isPublic = $event.detail.value" color="#bedbff"
									style="transform:scale(0.8)" />
							</view>
						</view>
						<text class="option-hint" v-if="exportSettings.isPublic">其他人可通过分享码查看此作品</text>
						<text class="option-hint" v-else>仅自己可通过分享码查看</text>

						<!-- 永久分享 -->
						<view class="show-item" style="margin-top: 20rpx;">
							<text class="group-title">永久分享</text>
							<view class="switch-container">
								<switch :checked="exportSettings.isPermanent"
									@change="exportSettings.isPermanent = $event.detail.value" color="#bedbff"
									style="transform:scale(0.8)" />
							</view>
						</view>
						<text class="option-hint" v-if="exportSettings.isPermanent">分享码永不过期</text>
						<text class="option-hint" v-else>分享码将在指定时间后失效</text>

						<!-- 过期时间选择（非永久时显示） -->
						<view class="show-item" v-if="!exportSettings.isPermanent" style="margin-top: 16rpx;">
							<text class="input-label">过期时间</text>
							<picker mode="selector" :value="expireDaysIndex" :range="expireDaysOptions"
								@change="onExpireDaysChange">
								<view class="picker-field">
									<text>{{ expireDaysOptions[expireDaysIndex] }}</text>
									<text class="picker-arrow">▼</text>
								</view>
							</picker>
						</view>
					</view>

					<!-- 同步到发现 -->
					<view class="export-option-group">
						<view class="show-item">
							<text class="group-title">同步到发现</text>
							<view class="switch-container">
								<switch :checked="exportSettings.shareToDiscovery"
									@change="exportSettings.shareToDiscovery = $event.detail.value" color="#bedbff"
									style="transform:scale(0.8)" />
							</view>
						</view>
						<text class="option-hint" v-if="exportSettings.shareToDiscovery">
							作品将同步到发现社区，供其他用户浏览和导入
						</text>
						<text class="option-hint" v-else>关闭后作品不会出现在发现社区</text>
					</view>

					<!-- 记住设置 -->
					<view class="export-option-group remember-settings" v-if="!isSetting">
						<view class="checkbox-item"
							@click="exportSettings.rememberSettings = !exportSettings.rememberSettings">
							<view class="checkbox" :class="{ 'checkbox-checked': exportSettings.rememberSettings }">
							</view>
							<text>记住以上设置，下次不再提示</text>
						</view>
					</view>
				</scroll-view>
				<view class="export-settings-footer">
					<button class="export-btn secondary" @click="cancelExportSettings">取消</button>
					<button class="export-btn primary" @click="performDownload">{{ isSetting ? '保存设置' : '预览导出图'
					}}</button>
				</view>
			</view>
		</view>

		<!-- 导出预览弹框 -->
		<view v-if="showExportPreviewDialog" class="export-preview-dialog">
			<view class="export-preview-container">
				<view class="export-preview-header">
					<text class="export-preview-title">导出预览</text>
					<text class="export-preview-close" @click="closeExportPreview(false)">✕</text>
				</view>
				<scroll-view class="export-preview-content" scroll-y>
					<!-- 加载中 -->
					<view v-if="isGeneratingPreview" class="preview-error preview-loading">
						<text>正在生成预览...</text>
					</view>
					<!-- 预览图 -->
					<image v-else-if="exportPreviewImage" class="preview-image" :src="exportPreviewImage"
						mode="widthFix" @click="previewFullImage(exportPreviewImage)" />
					<!-- 预览失败 -->
					<view v-else class="preview-error">
						<text>预览生成失败，请重试</text>
					</view>
				</scroll-view>
				<view class="export-preview-footer">
					<button class="export-btn secondary" @click="closeExportPreview(true)">重新选择</button>
					<button class="export-btn primary" @click="saveExportImage">保存图片</button>
				</view>
			</view>
		</view>

		<!-- 底部占位 -->
		<view class="bottom-placeholder"></view>

		<!-- 隐藏Canvas用于处理图片 -->
		<canvas type="2d" id="processCanvas" class="hidden-canvas" />

		<!-- 导出专用Canvas（不占用布局空间） -->
		<canvas type="2d" id="exportCanvas" class="export-canvas"
			:style="{ width: exportCanvasWidth + 'px', height: exportCanvasHeight + 'px' }" />

		<!-- 二维码专用Canvas -->
		<canvas type="2d" id="qrCodeCanvas" class="qr-canvas" :style="{ width: '150px', height: '150px' }" />
	</view>
</template>

<script setup>
import {
	convertToPerlerStyle
} from '@/core/perlerStyleConverter.js'
import mardColors from '@/static/colors/mard-colors.json'
import UQRCode from '@/uni_modules/Sansnn-uQRCode/js_sdk/uqrcode/uqrcode.js'
import {
	store
} from '@/uni_modules/uni-id-pages/common/store.js'
import {
	flattenColorData
} from '@/utils/colorUtils.js'
import {
	decodeShareCode,
	generateShareCodeDisplay,
	restoreFromShareCode
} from '@/utils/shareCode.js'
import {
	onLoad
} from '@dcloudio/uni-app'
import {
	computed,
	onMounted,
	ref
} from 'vue'

const app = getApp()

// Canvas显示尺寸（绘制像素）- 10倍放大绘制：6000px绘制，600rpx显示
const CANVAS_DISPLAY_SIZE = 6000
let canvasSize = 600 // 容器显示尺寸为600rpx

// 计算属性：动态 Canvas 绘制尺寸（根据显示区域大小）
const computedCanvasDisplaySize = computed(() => {
	if (isFloating.value) {
		// 浮窗模式下，根据可用区域计算（10倍放大绘制）
		const headerHeightRpx = 60
		const availableHeightRpx = floatHeight.value - headerHeightRpx
		const sizeRpx = Math.min(floatWidth.value, availableHeightRpx)
		// 10倍放大绘制
		return sizeRpx * 10 * (1 / px2rpx) // 转换为像素
	}
	if (isFullscreen.value) {
		// 全屏模式下，使用固定正方形尺寸（10倍放大绘制）
		// 600rpx * 10 = 6000px
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

// 分享码
let tempShareCode = '' // 保存临时分享码，用于失败时删除
let tempShareId = '' // 保存临时分享码ID

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
const imagePath = ref('') // 本地图片路径
const originalImage = ref(null) // cdn图片路径
const canvasReady = ref(false)
const colorStats = ref([])
const isFullscreen = ref(false)
const isFloating = ref(false)

// 存储拼豆结果数据，用于高清导出
const perlerResultData = ref(null)
const zoomLevel = ref(0.2)
const panX = ref(0)
const panY = ref(0)
const canvasX = ref(0) // 重置画布X位置
const canvasY = ref(0) // 重置画布Y位置
const fullscreenX = ref(0) // 全屏模式下的画布重置X位置
const fullscreenY = ref(0) // 全屏模式下的画布重置Y位置
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
const isSetting = ref(false) // 是否点击设置
const authorName = ref('') // 作者名
const watermarkText = ref('') // 水印文本
const exportSettings = ref({
	separateImages: "merge", // 是否分开导出图纸和颜色统计
	layoutDirection: 'vertical', // 拼接方向: vertical/horizontal
	showAuthor: false, // 是否显示作者名
	addWatermark: false, // 是否添加水印
	watermarkType: 'fullRepeat', // 水印
	addShadow: false, // 是否添加阴影
	addShareCode: true, // 是否添加分享码
	rememberSettings: false, // 记住设置，下次不再弹框
	saveOriginalImage: false, // 是否保留原图（分享码时有效）
	isPublic: true, // 是否公开（分享码时有效）
	isPermanent: true, // 是否永久分享（分享码时有效）
	expireDays: 7, // 过期天数（非永久时有效）
	shareToDiscovery: false, // 是否同步到发现社区
	// 作品信息（分享码/发现时使用）
	title: '', // 作品标题
	description: '', // 作品描述
	tagsInput: '' // 标签输入（逗号分隔）
})

// 预览弹窗
const showExportPreviewDialog = ref(false)
const exportPreviewImage = ref('') // 预览图URL
const isGeneratingPreview = ref(false) // 是否正在生成预览

// 分享码相关
const currentShareCode = ref('') // 当前分享码
const currentShareCodeData = ref(null) // 当前分享码数据
const currentShareId = ref('') // 当前分享码数据库ID

// 过期天数选项
const expireDaysOptions = ['7天', '14天', '30天', '90天', '180天']
const expireDaysValues = [7, 14, 30, 90, 180]
const expireDaysIndex = ref(0) // 默认7天
const onExpireDaysChange = (e) => {
	expireDaysIndex.value = e.detail.value
	exportSettings.value.expireDays = expireDaysValues[e.detail.value]
}

// 生成 canvas_data（用于云端存储）
const generateCanvasData = () => {
	if (!perlerResultData.value) return null

	const {
		mappedData,
		colorCounts,
		gridSize
	} = perlerResultData.value
	const {
		N,
		M
	} = gridSize

	// 提取所有非透明像素点
	const beads = []
	for (let y = 0; y < M; y++) {
		for (let x = 0; x < N; x++) {
			const pixel = mappedData[y][x]
			// 跳过透明像素
			if (pixel.isExternal || pixel.key === 'TRANSPARENT') continue
			beads.push({
				x,
				y,
				color: pixel.color
			})
		}
	}

	// 提取使用的颜色hex列表
	const palette = Object.values(colorCounts).map(c => c.color)

	return {
		width: N,
		height: M,
		beads,
		palette
	}
}

// 调用云函数创建分享码记录
const createShareCodeToCloud = async () => {
	const canvasData = generateCanvasData()
	if (!canvasData) {
		console.error('无法生成canvas_data')
		return null
	}
	
	// 上传原图到云存储，获取URL
	if(app.isEmpty(originalImage.value) && exportSettings.value.saveOriginalImage){
		try{
			//上传到服务器
			let cloudPath = store.userInfo._id + '' + Date.now()
			let {
				fileID
			} = await uniCloud.uploadFile({
				filePath:imagePath.value,
				cloudPath,
				fileType: "image"
			});
			console.log('原图上传成功，fileID:', fileID)
			originalImage.value = fileID
		}catch(e){
			console.error(e);
		}
	}

	// 计算过期时间
	const expireDate = exportSettings.value.isPermanent ?
		null :
		new Date(Date.now() + exportSettings.value.expireDays * 24 * 60 * 60 * 1000)

	const cloudData = {
		canvas_data: canvasData,
		settings: {
			brand: selectedBrand.value,
			colorMergeThreshold: colorMergeThreshold.value,
			conversionMode: pixelationMode.value
		},
		metadata: {
			title: exportSettings.value.title || ''
		},
		preview_image: exportPreviewImage.value || '',
		// 只有勾选了保留原图才存入
		original_image: exportSettings.value.saveOriginalImage ? app.isEmpty(originalImage.value) ? imagePath.value : originalImage.value  : '',
		// 是否公开
		is_public: exportSettings.value.isPublic,
		// 过期时间
		expire_date: expireDate
	}
	console.log('上传云数据：', cloudData)

	try {
		const res = await uniCloud.callFunction({
			name: 'share-code',
			data: {
				action: 'create',
				data: cloudData
			}
		})

		console.log('云函数返回:', res)

		if (res.result.code === 0) {
			currentShareId.value = res.result.data._id
			currentShareCode.value = res.result.data.share_code
			console.log('云端分享码创建成功:', res.result.data)
			return res.result.data
		} else {
			console.error('云端分享码创建失败:', res.result.message)
			return null
		}
	} catch (e) {
		console.error('调用云函数失败:', e)
		return null
	}
}

// 更新分享码（用最新数据）
const updateShareCodeToCloud = async () => {
	if (!tempShareId) return false

	const canvasData = generateCanvasData()
	if (!canvasData) {
		console.error('无法生成canvas_data')
		return false
	}

	// 上传图片到云存储
	let previewImageUrl = ''
	let originalImageUrl = ''

	// 上传预览图
	if (exportPreviewImage.value) {
		try {
			let previewCloudPath = `preview_${store.userInfo._id}_${Date.now()}`
			let previewRes = await uniCloud.uploadFile({
				filePath: exportPreviewImage.value,
				cloudPath: previewCloudPath,
				fileType: "image"
			})
			previewImageUrl = previewRes.fileID
			console.log('预览图上传成功:', previewImageUrl)
		} catch (e) {
			console.error('预览图上传失败:', e)
		}
	}

	// 上传原图
	if (exportSettings.value.saveOriginalImage && imagePath.value) {
		try {
			// 如果原图还没上传过，直接用 fileID
			if (app.isEmpty(originalImage.value)) {
				let originalCloudPath = `original_${store.userInfo._id}_${Date.now()}.jpg`
				let originalRes = await uniCloud.uploadFile({
					filePath: imagePath.value,
					cloudPath: originalCloudPath,
					fileType: "image"
				})
				originalImageUrl = originalRes.fileID
				originalImage.value = originalImageUrl
				console.log('原图上传成功:', originalImageUrl)
			}
		} catch (e) {
			console.error('原图上传失败:', e)
		}
	}
// 计算过期时间
	const expireDate = exportSettings.value.isPermanent ?
		null :
		new Date(Date.now() + exportSettings.value.expireDays * 24 * 60 * 60 * 1000)
	const cloudData = {
		_id: tempShareId,
		canvas_data: canvasData,
		settings: {
			brand: selectedBrand.value,
			colorMergeThreshold: colorMergeThreshold.value,
			conversionMode: pixelationMode.value
		},
		metadata: {
			title: exportSettings.value.title || ''
		},
		preview_image: app.isEmpty(previewImageUrl) ? exportPreviewImage.value || '': previewImageUrl,
		original_image: exportSettings.value.saveOriginalImage ? app.isEmpty(originalImage.value) ? imagePath.value : originalImage.value  : '',
		is_public: exportSettings.value.isPublic,
		status: 1,  // 更新时直接设为正常状态
		expire_date: expireDate
	}

	try {
		const res = await uniCloud.callFunction({
			name: 'share-code',
			data: {
				action: 'create',
				data: cloudData
			}
		})
		return res.result.code === 0
	} catch (e) {
		console.error('更新分享码失败:', e)
		return false
	}
}

// 确认分享码（转为正常状态）
const confirmShareCodeToCloud = async (shareCode) => {
	if (!shareCode) return false

	try {
		const res = await uniCloud.callFunction({
			name: 'share-code',
			data: {
				action: 'confirm',
				data: {
					shareCode
				}
			}
		})
		return res.result.code === 0
	} catch (e) {
		console.error('确认分享码失败:', e)
		return false
	}
}

// 导出专用Canvas尺寸（动态计算）
const exportCanvasWidth = ref(1000)
const exportCanvasHeight = ref(1000)

// 导出图片质量设置
const EXPORT_SCALE = 4 // 导出缩放倍数（4K高清）

// 导出相关常量
const EXPORT_PADDING = 20 // 导出边距（上、左、右）
const EXPORT_FONT_SIZE = 28 // 导出字体大小
const SHARE_CODE_SIZE = 100 // 分享码区域高度
const QR_CODE_SIZE = 300 // 二维码尺寸

// 获取分享码显示文本
const getShareCodeDisplay = () => {
	if (currentShareCode.value) {
		return generateShareCodeDisplay(currentShareCode.value)
	}
	return ''
}

// 复制分享码
const copyShareCode = () => {
	if (currentShareCode.value) {
		uni.setClipboardData({
			data: currentShareCode.value,
			success: () => {
				uni.showToast({
					title: '分享码已复制',
					icon: 'success'
				})
			},
			fail: () => {
				uni.showToast({
					title: '复制失败',
					icon: 'none'
				})
			}
		})
	}
}

// 从分享码还原图纸
const restoreFromShareCodeData = (codeData) => {
	const params = restoreFromShareCode(codeData)

	// 恢复所有参数
	imagePath.value = params.imagePath
	imageAspectRatio.value = params.imageAspectRatio
	selectedBrand.value = params.brand
	selectedBoardSize.value = params.boardSize
	gridColumns.value = params.gridColumns
	gridRows.value = params.gridRows
	pixelationMode.value = params.pixelationMode
	colorMergeThreshold.value = params.colorMergeThreshold
	showBoard.value = params.showBoard
	showColorCode.value = params.showColorCode
	colorStats.value = params.colorData || []

	// 恢复导出配置
	if (params.exportSettings) {
		exportSettings.value = {
			...exportSettings.value,
			...params.exportSettings
		}
	}
	authorName.value = params.authorName
	watermarkText.value = params.watermarkText

	// 重新生成图纸
	regenerate()
}

const separateImagesOptions = [{
	id: "merge",
	name: "合并导出"
},
	// {
	// 	id: "split",
	// 	name: "分开导出"
	// }
];

const layoutDirectionOptions = [{
	id: 'vertical',
	name: '纵向'
},
{
	id: 'horizontal',
	name: '横向'
}
];

const watermarkOptions = [{
	id: 'oneCenter',
	name: '单个居中'
},
{
	id: 'fullRepeat',
	name: '多列重复'
}
];

const onShowAuthorChange = (e) => {
	exportSettings.value.showAuthor = e.detail.value;
};

const onAddWatermarkChange = (e) => {
	exportSettings.value.addWatermark = e.detail.value;
	if (app.isEmpty(watermarkText.value)) {
		watermarkText.value = authorName.value; // 水印文本默认使用作者名
	}
}

const onAddShadowChange = (e) => {
	exportSettings.value.addShadow = e.detail.value;
}

const onAddShareCodeChange = (e) => {
	exportSettings.value.addShareCode = e.detail.value;
}

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

// 移动事件
const onChange = (event) => {
	const {
		x,
		y,
		source
	} = event.detail
	console.log("移动位置:", x, y)
	console.log("事件来源:", source)
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
const boardSizeOptions = [{
	size: 14,
	name: '14×14钉'
},
{
	size: 52,
	name: '52×52钉'
},
{
	size: 104,
	name: '104×104钉'
}
]

// 图像类型选项
const imageTypeOptions = [{
	id: 'cartoon',
	name: '卡通/动漫'
},
{
	id: 'photo',
	name: '照片'
},
{
	id: 'icon',
	name: '图标/Logo'
},
{
	id: 'illustration',
	name: '插画'
}
]

const modeOptions = [{
	id: 'dominant',
	name: '卡通'
},
{
	id: 'average',
	name: '图像'
}
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
		console.log("canvasContainerStyle-浮窗可用宽度:", floatWidth.value)
		console.log("canvasContainerStyle-浮窗可用高度:", availableHeight)
		return {
			width: `${floatWidth.value}rpx`,
			height: `${availableHeight}rpx`, // 使用可用高度（减去header）
			overflow: 'hidden',
			touchAction: 'none'
		}
	}
	// 非全屏模式：根据网格比例计算容器高度
	// movable-view 宽度 3000rpx，初始缩放 0.2 显示为 600rpx
	// 高度根据网格比例计算，初始缩放后需要足够空间
	const cols = gridColumns.value || 30
	const rows = gridRows.value || 30
	const ratio = cols / rows
	const canvasHeightRpx = Math.round(3000 / ratio)
	// 初始缩放 0.2 后的显示高度，加上一些边距
	const containerHeightRpx = Math.max(300, Math.round(canvasHeightRpx * 0.2 + 40))

	return {
		width: '600rpx',
		height: `600rpx`,
		overflow: 'hidden', // (暂时注释)
		touchAction: 'none' // 禁用默认触摸行为，避免页面滚动
	}
})

const dragContainerStyle = computed(() => {
	// 基于网格尺寸计算宽高比
	const cols = gridColumns.value || 30
	const rows = gridRows.value || 30
	const maxSize = 3000 // 最长边固定尺寸
	const padding = 60 // 四周内边距

	let widthRpx, heightRpx
	if (isFloating.value) {
		// 浮窗模式下，高度需要减去header高度（约60rpx）
		const headerHeight = 60
		const availableHeight = floatHeight.value - headerHeight
		console.log("canvasContainerStyle-浮窗可用宽度:", floatWidth.value)
		console.log("canvasContainerStyle-浮窗可用高度:", availableHeight)
		if (cols >= rows) {
			widthRpx = floatWidth.value * 5 - padding * 2
			heightRpx = Math.round(widthRpx * rows / cols) - padding * 2
		} else {
			heightRpx = availableHeight * 5 - padding * 2
			widthRpx = Math.round(heightRpx * cols / rows) - padding * 2
		}

	} else {
		if (cols >= rows) {
			// 宽度方向更长 → 宽度固定最大值
			widthRpx = maxSize - padding * 2
			heightRpx = Math.round(maxSize * (rows / cols)) - padding * 2
		} else {
			// 高度方向更长 → 高度固定最大值
			heightRpx = maxSize - padding * 2
			widthRpx = Math.round(maxSize * (cols / rows)) - padding * 2
		}

	}
	console.log("dragContainerStyle-可用宽度:", widthRpx)
	console.log("dragContainerStyle-可用高度:", heightRpx)
	return {
		width: `${widthRpx}rpx`,
		height: `${heightRpx}rpx`,
		// transition: isDragging.value ? 'none' : 'transform 0.2s ease-out'
	}
})

// Canvas 样式：根据网格尺寸动态计算宽高（保持比例）
const canvasStyle = computed(() => {
	// 基础配置
	const cols = gridColumns.value || 30
	const rows = gridRows.value || 30
	const padding = 60
	// 最长边固定总尺寸（包含padding）
	const maxSize = 3000

	// 自动适配最长边
	let widthRpx, heightRpx
	if (isFloating.value) {
		// 浮窗模式下，高度需要减去header高度（约60rpx）
		const headerHeight = 60
		const availableHeight = floatHeight.value - headerHeight
		console.log("canvasContainerStyle-浮窗可用宽度:", floatWidth.value)
		console.log("canvasContainerStyle-浮窗可用高度:", availableHeight)
		if (cols >= rows) {
			widthRpx = floatWidth.value * 5 - padding * 2
			heightRpx = Math.round(widthRpx * rows / cols) - padding * 2
		} else {
			heightRpx = availableHeight * 5 - padding * 2
			widthRpx = Math.round(heightRpx * cols / rows) - padding * 2
		}

	} else {
		if (cols >= rows) {
			// 宽更长：宽度固定最大值
			widthRpx = maxSize - padding * 2
			heightRpx = Math.round(maxSize * (rows / cols)) - padding * 2
		} else {
			// 高更长：高度固定最大值
			heightRpx = maxSize - padding * 2
			widthRpx = Math.round(maxSize * (cols / rows)) - padding * 2
		}

	}

	console.log(`🎨 canvasStyle计算: ${cols}×${rows}, 宽=${widthRpx}rpx, 高=${heightRpx}rpx`)

	return {
		width: `${widthRpx}rpx`,
		height: `${heightRpx}rpx`,
		display: 'block'
	}
})

// movable-view 的缩放值
// 初始 0.2 让 3000rpx 的画布适应 600rpx 容器显示
// 最大 10 倍，总共可达 50 倍放大效果
const scaleValue = computed(() => {
	if (isFloating.value) {
		return zoomLevel.value
	}
	// 非浮窗模式：初始适应容器 (0.2)，最大 10 倍
	return zoomLevel.value || 0.2
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
					console.log(`✅ Canvas初始化成功: ${canvasId}`, {
						canvas,
						ctx
					})
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
		// 退出全屏时重置位置，缩放回初始 0.2
		panX.value = canvasX.value
		panY.value = canvasY.value
		zoomLevel.value = MIN_SCALE
	}
}

// 缩放功能：基于 0.2 的初始缩放
const MIN_SCALE = 0.2 // 最小缩放，让 3000rpx 画布适应 600rpx 容器
const MAX_SCALE = 10 // 最大缩放，50 倍放大效果

const zoomIn = () => {
	const current = zoomLevel.value || MIN_SCALE
	zoomLevel.value = Math.min(current + 0.25, MAX_SCALE)
}

const zoomOut = () => {
	const current = zoomLevel.value || MIN_SCALE
	zoomLevel.value = Math.max(current - 0.25, MIN_SCALE)
}

const resetZoom = () => {
	// // 1. 强制转 纯数字（去掉px/rpx单位，这是位置不生效的元凶！）
	//   const x = Number(fullscreenX.value) || 0
	//   const y = Number(fullscreenY.value) || 0
	// zoomLevel.value = MIN_SCALE
	// nextTick(()=>{
	// 	// 2. 重置位置到初始值
	// 	panX.value = x
	// 	panY.value = y
	// })
	// panY.value = fullscreenY.value
	// panX.value = fullscreenX.value
	centerMovableViewInFullscreen()
	console.log("重置缩放: zoomLevel=", zoomLevel.value, "panX=", panX.value, "panY=", panY.value)
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
		// 退出浮窗时重置为初始缩放 0.2
		console.log(`🚪 退出浮窗模式，重置位置`)
		zoomLevel.value = MIN_SCALE
		panX.value = canvasX.value
		panY.value = canvasY.value
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
					.fields({
						node: true,
						size: true
					})
					.exec((res) => {
						console.log(`🔍 Canvas查询结果:`, JSON.stringify(res))
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

	console.log(
		`📐 浮窗可用区域: ${floatWinWidthRpx}×${floatWinHeightRpx}rpx (${floatWinWidthPx.toFixed(2)}×${floatWinHeightPx.toFixed(2)}px)`
	)

	// 获取Canvas实际尺寸
	const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
	query.select('#mainCanvas')
		.fields({
			node: true,
			size: true
		})
		.exec((res) => {
			if (!res || !res[0]) {
				console.error('❌ 无法获取Canvas尺寸')
				return
			}
			console.log(`🔍 Canvas查询结果2:`, JSON.stringify(res))
			const canvasWidthPx = res[0].width
			const canvasHeightPx = res[0].height

			console.log(`🎨 Canvas实际尺寸: ${canvasWidthPx}×${canvasHeightPx}px`)

			// 计算等比缩放比例（以px为单位计算，避免rpx转换误差）
			const scaleX = floatWinWidthPx / canvasWidthPx
			const scaleY = floatWinHeightPx / canvasHeightPx
			const fitScale = Math.min(scaleX, scaleY, 1) // 最大缩放1倍

			console.log(
				`🔢 缩放比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, fitScale=${fitScale.toFixed(3)}`
			)

			// 计算居中偏移（px）
			const offsetX = (floatWinWidthPx - canvasWidthPx * fitScale) / 2
			const offsetY = (floatWinHeightPx - canvasHeightPx * fitScale) / 2

			console.log(`📍 居中偏移: offsetX=${offsetX.toFixed(2)}px, offsetY=${offsetY.toFixed(2)}px`)

			// 设置缩放和居中
			zoomLevel.value = MIN_SCALE
			panX.value = offsetX
			panY.value = offsetY
			console.log(`✅ 浮窗适配完成: zoomLevel=${zoomLevel.value}, panX=${panX.value}, panY=${panY.value}`)
			console.log(`📍 movable-view 位置: x=${panX.value}px, y=${panY.value}px (相对于 movable-area 左上角)`)
			console.log(
				`📐 movable-area 尺寸: ${floatWinWidthRpx}×${floatWinHeightRpx}rpx (${floatWinWidthPx.toFixed(2)}×${floatWinHeightPx.toFixed(2)}px)`
			)
			console.log(
				`🎯 Canvas 缩放后尺寸: ${(canvasWidthPx * fitScale).toFixed(2)}×${(canvasHeightPx * fitScale).toFixed(2)}px`
			)
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
	query.select('.canvas-container').fields({
		size: true
	})
	query.select('#mainCanvas').fields({
		node: true,
		size: true
	})
	query.exec((res) => {
		const areaRes = res[0]; // 容器
		const canvasRes = res[1]; // ✅ 你是对的！这就是真实Canvas
		if (!res || !areaRes || !canvasRes) {
			console.error('❌ 无法获取 movable-area或者Canvas尺寸')
			return
		}

		console.log(`📐 movable-area-全屏模式 尺寸: ${JSON.stringify(res)}`)

		const areaWidth = areaRes.width
		const areaHeight = areaRes.height
		const floatWinWidthRpx = areaWidth
		const floatWinHeightRpx = areaHeight
		const floatWinWidthPx = floatWinWidthRpx / px2rpx
		const floatWinHeightPx = floatWinHeightRpx / px2rpx

		console.log(`📐 movable-area 可用区域: ${areaWidth.toFixed(2)}×${areaHeight.toFixed(2)}px`)
		console.log(`📊 全屏模式: 不包含底部控制按钮区域`)

		// 获取canvas的尺寸（应该是正方形）
		// 获取Canvas实际尺寸

		const canvasWidthPx = canvasRes.width
		const canvasHeightPx = canvasRes.height

		console.log(`🎨 Canvas实际尺寸: ${canvasWidthPx}×${canvasHeightPx}px`)

		// 计算等比缩放比例（以px为单位计算，避免rpx转换误差）
		const scaleX = floatWinWidthPx / canvasWidthPx
		const scaleY = floatWinHeightPx / canvasHeightPx
		const fitScale = Math.min(scaleX, scaleY, 1) // 最大缩放1倍

		console.log(
			`🔢 缩放比例: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, fitScale=${fitScale.toFixed(3)}`
		)

		// 计算居中偏移（px）
		const offsetX = (floatWinWidthRpx - canvasWidthPx) / 2
		const offsetY = (floatWinHeightRpx - canvasHeightPx) / 2

		console.log(`📍 居中偏移: offsetX=${offsetX.toFixed(2)}px, offsetY=${offsetY.toFixed(2)}px`)

		// 设置缩放和居中
		zoomLevel.value = MIN_SCALE
		panX.value = Math.max(0, offsetX.toFixed(2))
		panY.value = Math.max(0, offsetY.toFixed(2))
		// 重置全屏模式下的canvas位置
		fullscreenX.value = panX.value
		fullscreenY.value = panY.value
		console.log(`✅ 全屏适配完成: zoomLevel=${zoomLevel.value}, panX=${panX.value}, panY=${panY.value}`)
		console.log(`📍 movable-view 位置: x=${panX.value}px, y=${panY.value}px (相对于 movable-area 左上角)`)
		console.log(
			`📐 movable-area 尺寸: ${floatWinWidthRpx}×${floatWinHeightRpx}rpx (${floatWinWidthPx.toFixed(2)}×${floatWinHeightPx.toFixed(2)}px)`
		)
		console.log(
			`🎯 Canvas 缩放后尺寸: ${(canvasWidthPx * fitScale).toFixed(2)}×${(canvasHeightPx * fitScale).toFixed(2)}px`
		)

	})
}

// 非全屏模式：让 Canvas 居中显示
const centerCanvasInNormalMode = async () => {
	// 仅在非全屏、非浮窗模式下执行
	if (isFullscreen.value || isFloating.value) return

	console.log('🎯 开始非全屏模式居中计算...')

	// 等待 canvas 渲染完成
	await new Promise(resolve => setTimeout(resolve, 200))

	const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])

	// 获取 movable-area 的尺寸
	query.select('.canvas-container').fields({
		size: true
	})
	query.select('#mainCanvas').fields({
		size: true
	})
	query.exec((res) => {
		const areaRes = res[0]; // 容器
		const canvasRes = res[1]; // ✅ 你是对的！这就是真实Canvas
		if (!res || !areaRes || !canvasRes) {
			console.error('❌ 无法获取 movable-area或者Canvas尺寸')
			return
		}

		console.log(`📐 movable-area-非全屏模式 尺寸: ${JSON.stringify(res)}`)

		const areaWidthPx = areaRes.width // 600rpx
		const areaHeightPx = areaRes.height // 600rpx

		const paddingPx = 10 // 预留20px内边距

		console.log(`📐 canvas-非全屏模式 尺寸: ${JSON.stringify(canvasRes)}`)
		const canvasWidthPx = canvasRes.width
		const canvasHeightPx = canvasRes.height

		// 获取当前缩放级别
		const scale = zoomLevel.value || MIN_SCALE

		// Canvas 缩放后的尺寸
		const scaledWidth = canvasWidthPx * scale
		const scaledHeight = canvasHeightPx * scale

		// 计算居中偏移（px）
		const offsetX = (areaWidthPx - canvasWidthPx.toFixed(2)) / 2
		const offsetY = (areaHeightPx - canvasHeightPx.toFixed(2)) / 2

		console.log(`📐 movable-area: ${areaWidthPx.toFixed(2)}×${areaHeightPx.toFixed(2)}px`)
		console.log(
			`🎨 Canvas: ${canvasWidthPx}×${canvasHeightPx}px, 缩放后: ${scaledWidth.toFixed(2)}×${scaledHeight.toFixed(2)}px`
		)
		console.log(`📍 居中偏移: x=${offsetX.toFixed(2)}px, y=${offsetY.toFixed(2)}px`)

		// 设置居中位置
		panX.value = Math.max(0, offsetX.toFixed(2))
		panY.value = Math.max(0, offsetY.toFixed(2))
		// 重置居中位置
		canvasX.value = panX.value
		canvasY.value = panY.value
		console.log(`✅ 非全屏居中完成: panX=${panX.value}, panY=${panY.value}`)
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
	} // 处理鼠标事件
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
		gridRows.value = Math.max(20, Math.min(300, newHeight))
	}
	gridColumns.value = newWidth
	regenerate()
}

const onGridColumnsInput = () => {
	gridColumns.value = Math.max(20, Math.min(300, parseInt(gridColumns.value) || 50))
	if (isLocked.value && imageAspectRatio.value) {
		const newHeight = Math.round(gridColumns.value / imageAspectRatio.value)
		gridRows.value = Math.max(20, Math.min(300, newHeight))
	}
	regenerate()
}

const onGridRowsChange = (e) => {
	const newHeight = e.detail.value
	if (isLocked.value && imageAspectRatio.value) {
		const newWidth = Math.round(newHeight * imageAspectRatio.value)
		gridColumns.value = Math.max(20, Math.min(300, newWidth))
	}
	gridRows.value = newHeight
	regenerate()
}

const onGridRowsInput = () => {
	gridRows.value = Math.max(20, Math.min(300, parseInt(gridRows.value) || 50))
	if (isLocked.value && imageAspectRatio.value) {
		const newWidth = Math.round(gridRows.value * imageAspectRatio.value)
		gridColumns.value = Math.max(20, Math.min(300, newWidth))
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
			console.error('❌ 主Canvas初始化失败:', {
				canvasRes
			})
			throw new Error(`主Canvas初始化失败: ${JSON.stringify(canvasRes)}`)
		}

		mainCanvas = canvasRes.canvas
		mainCtx = canvasRes.ctx
		console.log('✅ 主Canvas初始化成功:', {
			mainCanvas,
			mainCtx
		})

		const processRes = await getCanvasInstance('processCanvas')
		console.log('📊 processCanvas获取结果:', processRes)

		if (!processRes || !processRes.canvas || !processRes.ctx) {
			console.error('❌ 处理Canvas初始化失败:', {
				processRes
			})
			throw new Error(`处理Canvas初始化失败: ${JSON.stringify(processRes)}`)
		}

		processCanvas = processRes.canvas
		processCtx = processRes.ctx
		console.log('✅ 处理Canvas初始化成功:', {
			processCanvas,
			processCtx
		})

		console.log('🎨 开始 Perler-Beads 风格转换...')
		console.log('图片路径:', imagePath.value)
		console.log('横向切割:', gridColumns.value)
		console.log('转换模式:', pixelationMode.value)
		console.log('合并阈值:', colorMergeThreshold.value)

		// 2. 获取图片信息
		const imgInfo = await uni.getImageInfo({
			src: imagePath.value
		})
		const {
			width,
			height
		} = imgInfo
		const displaySize = computedCanvasDisplaySize.value

		console.log('原图尺寸:', width, 'x', height)
		console.log('Canvas绘制尺寸:', displaySize, 'px (动态计算)')

		// 3. 计算网格尺寸
		const N = gridColumns.value // 横向网格数量
		const M = gridRows.value // 纵向网格数量

		console.log('网格尺寸:', N, 'x', M, '(横向 x 纵向)')

		// 4. 设置处理Canvas尺寸（用于获取ImageData）
		// mainCanvas 的尺寸会在 drawPerlerResult 中根据网格尺寸设置
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

		// 9. 保存拼豆结果数据，用于高清导出
		perlerResultData.value = {
			mappedData: result.mappedData,
			colorCounts: result.colorCounts,
			totalBeads: result.totalBeads,
			gridSize: result.gridSize,
			colorPalette
		}

		// 10. 更新统计
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
		// uni.hideLoading()

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
 * 
 * 缩放方案：
 * - movable-view 尺寸: 3000rpx × 3000rpx
 * - movable-view scale 0.2: 显示 600rpx（适应容器）
 * - movable-view scale 10: 显示 30000rpx（50倍放大）
 * - Canvas 内部固定 22px 绘制，动态缩放（确保 Canvas ≤ 16384px）
 */
function drawPerlerResult(result, colorPalette, showColorCode = true) {
	const {
		mappedData,
		colorCounts,
		totalBeads,
		gridSize
	} = result
	const {
		N,
		M
	} = gridSize

	// 固定格子大小 22px
	const cellSize = 22

	// 原始图纸尺寸
	const originalWidth = N * cellSize
	const originalHeight = M * cellSize

	// Canvas 最大尺寸限制 16384px
	const MAX_CANVAS_SIZE = 16384

	// 动态计算高清缩放倍数，确保 Canvas 不超过限制
	const maxScaleX = MAX_CANVAS_SIZE / originalWidth
	const maxScaleY = MAX_CANVAS_SIZE / originalHeight
	const hdScale = Math.min(maxScaleX, maxScaleY, 5) // 最大 5 倍

	// Canvas 绘制尺寸
	const canvasPixelWidth = Math.round(originalWidth * hdScale)
	const canvasPixelHeight = Math.round(originalHeight * hdScale)

	console.log(`🎨 drawPerlerResult: ${N}×${M}钉, cellSize=${cellSize}px`)
	console.log(`   原始尺寸: ${originalWidth}×${originalHeight}rpx`)
	console.log(`   高清缩放: ${hdScale.toFixed(2)}x`)
	console.log(`   Canvas尺寸: ${canvasPixelWidth}×${canvasPixelHeight}rpx`)

	// 设置 Canvas 尺寸
	if (mainCanvas) {
		mainCanvas.width = canvasPixelWidth
		mainCanvas.height = canvasPixelHeight
	}

	// 清空画布
	mainCtx.clearRect(0, 0, canvasPixelWidth, canvasPixelHeight)

	// 高清缩放
	mainCtx.save()
	mainCtx.scale(hdScale, hdScale)

	// 绘制起点
	const startX = 0
	const startY = 0

	// 首次绘制：zoomLevel = 0.2（让 3000rpx 画布适应 600rpx 容器）
	const MIN_SCALE = 0.2
	if (zoomLevel.value === 0 || zoomLevel.value === 1) {
		zoomLevel.value = MIN_SCALE
	}

	// 更新显示的格子大小
	cellSizeDisplay.value = cellSize

	console.log(`📐 图纸绘制: N=${N}, M=${M}, cellSize=${cellSize}px, zoomLevel=${zoomLevel.value}`)

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

	// 绘制颜色 code
	if (showColorCode) {
		// 固定字体大小为 cellSize 的 40%
		const fontSize = Math.max(8, Math.min(14, cellSize * 0.4))

		mainCtx.imageSmoothingEnabled = true
		mainCtx.imageSmoothingQuality = 'high'

		for (let y = 0; y < M; y++) {
			for (let x = 0; x < N; x++) {
				const pixel = mappedData[y][x]
				if (!pixel.isExternal && pixel.key !== 'TRANSPARENT') {
					const centerX = startX + x * cellSize + cellSize / 2
					const centerY = startY + y * cellSize + cellSize / 2

					// 计算背景色亮度
					const bgColor = pixel.color
					const r = parseInt(bgColor.slice(1, 3), 16)
					const g = parseInt(bgColor.slice(3, 5), 16)
					const b = parseInt(bgColor.slice(5, 7), 16)
					const brightness = (r * 299 + g * 587 + b * 114) / 1000
					const textColor = brightness > 128 ? '#000000' : '#FFFFFF'

					mainCtx.fillStyle = textColor
					mainCtx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
					mainCtx.textAlign = 'center'
					mainCtx.textBaseline = 'middle'
					mainCtx.fillText(pixel.key, centerX, centerY)
				}
			}
		}
	}

	// 恢复缩放
	mainCtx.restore()

	console.log('✅ Perler-Beads 绘制完成！')
	console.log(`总珠子数: ${totalBeads}`)
	console.log(`颜色数: ${Object.keys(colorCounts).length}`)
	console.log(`格子大小: ${cellSize}px (固定)`)

	uni.hideLoading()

	// 非全屏模式下居中显示
	if (!isFullscreen.value && !isFloating.value) {
		const canvasTimer = setTimeout(() => {
			centerCanvasInNormalMode()
			clearTimeout(canvasTimer)
		}, 200)
	} else {
		// 全屏或浮窗模式下重置为 0
		panX.value = canvasX.value
		panY.value = canvasY.value
	}

	console.log(`✅ 图纸绘制完成: zoomLevel=${zoomLevel.value}`)
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
		return {
			rgb: [r, g, b],
			count,
			weight
		}
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
		const clusters = Array.from({
			length: clusterCount
		}, () => [])

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
		return {
			rgb: [r, g, b],
			count
		}
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
	const mergeThreshold = (6 - matchAccuracy.value) * 15 // 1→75, 5→15, 越小合并越多

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
		return targetRgb // 距离太远，不合并
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
		zoomLevel.value = MIN_SCALE
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
	// 打开弹窗前，先加载本地存储的设置
	const savedSettings = uni.getStorageSync('exportSettings')
	if (savedSettings) {
		exportSettings.value = {
			...exportSettings.value,
			...savedSettings
		}
		authorName.value = savedSettings.authorName || ''
		watermarkText.value = savedSettings.watermarkText || ''
	}

	isSetting.value = true
	showExportSettingsDialog.value = true
}

const toggleExportSettingsDialog = () => {
	// 如果设置了记住选项，直接显示预览
	if (exportSettings.value.rememberSettings) {
		generateExportPreview()
	} else {
		isSetting.value = false
		showExportSettingsDialog.value = true
	}
}

const cancelExportSettings = () => {
	isSetting.value = false
	showExportSettingsDialog.value = false
}

// 生成导出预览图
const generateExportPreview = async () => {
	// 关闭设置弹窗
	showExportSettingsDialog.value = false
	console.log("tempShareId", tempShareId)
	console.log("tempShareId2", app.isEmpty(tempShareId))

	// 显示预览弹窗
	showExportPreviewDialog.value = true
	isGeneratingPreview.value = true
	exportPreviewImage.value = ''

	// 如果开启了分享码，先生成分享码（必须等待完成后再执行导出）
	if (app.isEmpty(tempShareId)) {
		await createShareCode()
	} else {
		if (app.isEmpty(tempShareCode)) {
			try {
				// 生成过分享码，但丢失，通过ID重新获取
				const res = await uniCloud.callFunction({
					name: 'share-code',
					data: {
						action: 'shareCodeById',
						data: {
							id: tempShareId
						}
					}
				})
				console.log('云函数返回:', res)

				if (res.result.code === 0) {
					tempShareCode = res.result.data.share_code
					console.log('重新获取分享码成功:', tempShareCode)
				} else {
					// 失败重新创建分享码
					await createShareCode()
				}
			} catch (e) {
				console.error('调用云函数失败:', e)
				await createShareCode()
			}
		} else {
			console.log('已存在分享码，无需重新生成:', tempShareCode)
		}
	}

	try {
		// 生成预览图
		const previewImage = await performFullExport(true) // 传入 true 表示只生成预览
		exportPreviewImage.value = previewImage
	} catch (error) {
		console.error('生成预览失败:', error)
		uni.showToast({
			title: '预览生成失败',
			icon: 'none'
		})
	} finally {
		isGeneratingPreview.value = false
	}
}

// 创建分享码
const createShareCode = async () => {
	if (exportSettings.value.addShareCode) {
		const token = uni.getStorageSync('uni_id_token')
		if (token) {
			// 创建临时分享码记录
			const shareResult = await createShareCodeToCloud()
			if (shareResult) {
				tempShareCode = shareResult.share_code
				tempShareId = shareResult._id
				console.log('分享码已保存到云端:', shareResult.share_code)
			}
		} else {
			if (exportSettings.value.isPublic) {
				await createShareCodeToCloud()
			} else {
				console.warn('未登录，无法生成私密分享码')
			}
		}
	}
}

// 关闭预览弹窗
const closeExportPreview = (isClose) => {
	showExportPreviewDialog.value = false
	exportPreviewImage.value = ''
	// 如果设置了记住选项，直接显示预览
	if (exportSettings.value.rememberSettings && isClose) {
		isSetting.value = false
		showExportSettingsDialog.value = true
	}
}

// 预览完整图片
const previewFullImage = (url) => {
	if (url) {
		uni.previewImage({
			urls: [url],
			current: url
		})
	}
}

// 删除临时分享码记录
const deleteShareCodeToCloud = async (shareCode) => {
	if (!shareCode) return false

	try {
		const res = await uniCloud.callFunction({
			name: 'share-code',
			data: {
				action: 'delete',
				data: {
					shareCode
				}
			}
		})
		return res.result.code === 0
	} catch (e) {
		console.error('删除分享码失败:', e)
		return false
	}
}

// 保存导出图片
const saveExportImage = async () => {
	if (!exportPreviewImage.value) {
		uni.showToast({
			title: '请先生成预览',
			icon: 'none'
		})
		return
	}

	uni.showLoading({
		title: '保存中...'
	})
	try {
		// 保存到相册
		await new Promise((resolve, reject) => {
			uni.saveImageToPhotosAlbum({
				filePath: exportPreviewImage.value,
				success: async () => {
					// 保存成功后，更新分享码（用最新数据，同时设为正常状态）
					if (exportSettings.value.addShareCode && tempShareId) {
						await updateShareCodeToCloud()
					}

					// 如果勾选了同步到发现，发布到发现社区
					if (exportSettings.value.shareToDiscovery) {
						const token = uni.getStorageSync('uni_id_token')
						if (token) {
							const discoveryResult = await publishToDiscovery(tempShareId)
							if (discoveryResult.code === 0) {
								console.log('已同步到发现社区:', discoveryResult.data)
							}
						}
					}

					// 显示成功提示
					if (exportSettings.value.addShareCode && tempShareCode) {
						uni.showToast({
							title: `保存成功，分享码: ${tempShareCode}`,
							icon: 'none',
							duration: 2500
						})
					} else if (exportSettings.value.shareToDiscovery) {
						uni.showToast({
							title: '保存成功，已同步到发现',
							icon: 'none',
							duration: 2000
						})
					} else {
						uni.hideLoading()
						uni.showToast({
							title: '保存成功',
							icon: 'none'
						})
					}
					closeExportPreview()
					resolve()
				},
				fail: async (err) => {
					uni.hideLoading()
					console.error('保存失败:', err)

					// 保存失败时，删除临时分享码记录
					if (exportSettings.value.addShareCode && tempShareCode) {
						const deleted = await deleteShareCodeToCloud(tempShareCode)
						if (deleted) {
							console.log('已清理临时分享码记录:', tempShareCode)
						}
					}

					// 根据错误类型提示用户
					if (err.errMsg && err.errMsg.includes('auth deny')) {
						uni.showToast({
							title: '需要相册权限才能保存',
							icon: 'none'
						})
					} else {
						uni.showToast({
							title: '保存失败',
							icon: 'none'
						})
					}
					reject(err)
				}
			})
		})
	} catch (error) {
		uni.hideLoading()
		console.error('保存失败:', error)
	}
}

// 发布到发现社区
const publishToDiscovery = async (shareCodeId) => {
	const canvasData = generateCanvasData()
	if (!canvasData) {
		console.error('无法生成canvas_data')
		return {
			code: 10001,
			message: '无法生成作品数据'
		}
	}

	// 解析标签
	const tags = exportSettings.value.tagsInput ?
		exportSettings.value.tagsInput.split(/[,，]/).map(t => t.trim()).filter(t => t) :
		[]

	const cloudData = {
		canvas_data: canvasData,
		settings: {
			brand: selectedBrand.value,
			colorMergeThreshold: colorMergeThreshold.value,
			conversionMode: pixelationMode.value
		},
		metadata: {
			title: exportSettings.value.title || '',
			description: exportSettings.value.description || '',
			tags: tags
		},
		preview_image: exportPreviewImage.value || '',
		share_code_id: shareCodeId || null, // 关联分享码
		is_public: exportSettings.value.isPublic
	}

	try {
		const res = await uniCloud.callFunction({
			name: 'discovery-works',
			data: {
				action: 'publish',
				data: cloudData
			}
		})
		return res.result
	} catch (e) {
		console.error('发布到发现失败:', e)
		return {
			code: 99999,
			message: '发布失败'
		}
	}
}

// ==================== 导出功能 ====================

// 获取导出专用的Canvas实例
const getExportCanvasInstance = () => {
	return new Promise((resolve) => {
		const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
		query.select('#exportCanvas')
			.fields({
				node: true,
				size: true
			})
			.exec((res) => {
				if (res && res.length > 0 && res[0] && res[0].node) {
					const canvas = res[0].node
					const ctx = canvas.getContext('2d')
					const dpr = uni.getWindowInfo().pixelRatio || 2
					resolve({
						canvas,
						ctx,
						width: res[0].width,
						height: res[0].height,
						dpr
					})
				} else {
					resolve(null)
				}
			})
	})
}

// 计算导出布局尺寸
const calculateExportLayout = async () => {
	// 获取主Canvas的实际尺寸
	const mainCanvasInfo = await new Promise((resolve) => {
		const query = uni.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
		query.select('#mainCanvas')
			.fields({
				node: true,
				size: true
			})
			.exec((res) => {
				if (res && res[0]) {
					resolve(res[0])
				} else {
					resolve(null)
				}
			})
	})

	if (!mainCanvasInfo || !mainCanvasInfo.width) {
		console.error('无法获取主Canvas尺寸')
		return null
	}

	const mainWidth = mainCanvasInfo.width
	const mainHeight = mainCanvasInfo.height

	// 确保图纸区域足够大，能容纳高清50px的格子
	const hdCellSize = 50
	const {
		mappedData,
		gridSize
	} = perlerResultData.value || {}
	let minRequiredWidth = mainWidth
	let minRequiredHeight = mainHeight

	if (mappedData && gridSize) {
		const N = gridSize.N
		const M = gridSize.M
		minRequiredWidth = Math.max(mainWidth, N * hdCellSize + EXPORT_PADDING * 2)
		minRequiredHeight = Math.max(mainHeight, M * hdCellSize + EXPORT_PADDING * 2)
	}

	// 颜色统计图区域 - Grid布局，每行显示多个颜色
	const colorItemWidth = 300 // 每个颜色项宽度
	const colorsPerRow = Math.floor((minRequiredWidth - EXPORT_PADDING * 2) / colorItemWidth)
	const actualColorsPerRow = Math.max(1, Math.min(colorsPerRow, colorStats.value.length))
	const statsRows = Math.ceil(colorStats.value.length / actualColorsPerRow)
	const statsItemHeight = 50
	const statsHeight = 50 + statsRows * statsItemHeight + 16 * 7 + 12 // 标题 + 行 + padding
	const statsWidth = minRequiredWidth


	// 作品信息区域 - 包含标题、描述、标签等
	const infoWidth = minRequiredWidth
	let contentRows = 2; // 固定3行内容
	// 计算有几行信息
	if (exportSettings.value.showAuthor) {
		contentRows++
	}
	if (exportSettings.value.title) {
		contentRows++
	}
	const infoHeight = 16 * 2 * contentRows + 50 + contentRows * 40 + 50 // 作品信息区域高度

	// 分享码区域高度（包含二维码和文字）
	const shareCodeAreaHeight = exportSettings.value.addShareCode ? QR_CODE_SIZE + 16 * 8 : 0
	// 根据布局方向计算位置
	const isHorizontal = exportSettings.value.layoutDirection === 'horizontal'

	// 下边框总高度（纵向布局）
	const bottomHeight = isHorizontal ? Math.max(infoHeight, shareCodeAreaHeight) + 100 : statsHeight + Math.max(infoHeight, shareCodeAreaHeight) + 100 // 统计图 + 分享码 + 间距

	// 横向布局时的颜色统计表（纵向单列排列）
	const statsItemHeightH = 60 // 横向布局时每项高度
	const maxStatsHeight = minRequiredHeight + bottomHeight - EXPORT_PADDING * 2 // 最大高度（受限于图纸高度）
	const colorsPerColumn = Math.floor(maxStatsHeight / statsItemHeightH)
	const statsColumns = Math.ceil(colorStats.value.length / colorsPerColumn)
	const statsWidthH = 200 + statsColumns * 100 + 100 // 每列宽度约100px
	// 右侧边框宽度（横向布局）
	const rightWidth = statsWidthH + 50
	console.log({ colorsPerColumn: colorsPerColumn })
	console.log({ rightWidth: rightWidth })
	console.log({ statsWidthH: statsWidthH })

	// 总尺寸：图纸 + 下边框/右边框
	let layout = {
		mainWidth: minRequiredWidth,
		mainHeight: minRequiredHeight,
		statsWidth,
		statsHeight,
		statsWidthH,
		statsHeight: maxStatsHeight,
		colorsPerColumn,
		infoWidth,
		infoHeight,
		contentRows,
		shareCodeAreaHeight,
		bottomHeight,
		rightWidth,
		colorsPerRow: actualColorsPerRow,
		isMerge: exportSettings.value.separateImages === 'merge',
		direction: exportSettings.value.layoutDirection
	}


	if (isHorizontal) {
		// 横向布局：图纸在左，统计表在右，信息/分享码在下方
		layout.totalWidth = minRequiredWidth + rightWidth + EXPORT_PADDING * 2
		layout.totalHeight = minRequiredHeight + bottomHeight + EXPORT_PADDING * 2
		layout.mainX = EXPORT_PADDING
		layout.mainY = EXPORT_PADDING
		layout.statsX = minRequiredWidth + EXPORT_PADDING
		layout.statsY = EXPORT_PADDING
		layout.infoX = EXPORT_PADDING
		layout.infoY = minRequiredHeight + EXPORT_PADDING + 16
		layout.shareCodeX = layout.infoX
		layout.shareCodeY = layout.infoY
	} else {
		// 纵向布局：图纸在上，下边框在下（原有逻辑）
		layout.totalWidth = minRequiredWidth + EXPORT_PADDING * 2
		layout.totalHeight = minRequiredHeight + bottomHeight + EXPORT_PADDING * 2
		layout.mainX = EXPORT_PADDING
		layout.mainY = EXPORT_PADDING
		layout.statsX = EXPORT_PADDING
		layout.statsY = minRequiredHeight + EXPORT_PADDING
		layout.infoX = EXPORT_PADDING
		layout.infoY = minRequiredHeight + statsHeight + EXPORT_PADDING + 16
		layout.shareCodeX = EXPORT_PADDING
		layout.shareCodeY = layout.infoY
	}

	// 添加阴影偏移量
	layout.shadowOffset = exportSettings.value.addShadow ? 15 : 0
	layout.totalWidth += layout.shadowOffset * 2
	layout.totalHeight += layout.shadowOffset * 2
	layout.mainX += layout.shadowOffset
	layout.mainY += layout.shadowOffset
	layout.statsX += layout.shadowOffset
	layout.statsY += layout.shadowOffset
	layout.infoX += layout.shadowOffset
	layout.infoY += layout.shadowOffset
	layout.shareCodeX += layout.shadowOffset
	layout.shareCodeY += layout.shadowOffset
	layout.authorX += layout.shadowOffset
	layout.authorY += layout.shadowOffset
	console.log('计算导出布局:', layout)
	return layout
}

// 绘制颜色统计图（Grid布局）
const drawColorStats = (ctx, x, y, width, scale, colorsPerRow) => {
	const padding = 16 * scale
	const lineWidth = 2 * scale; // 边框粗细
	const radius = 14 * scale; // ✅ 圆弧圆角大小（可自由调整）
	const titleHeight = 50; // 标题栏高度
	const itemHeight = 50 * scale // 每个颜色条目高度
	const swatchSize = 40 * scale
	const fontSize = 20 * scale
	// 颜色距离标题的间距
	const colorStartY = 12 * scale;
	// const itemWidth = 160 * scale
	// ========== 核心：自动计算 Grid 尺寸 ==========
	const totalColors = colorStats.value.length; // 总颜色数
	const totalRows = Math.ceil(colorStats.value.length / colorsPerRow); // 网格总行数
	// 计算可用宽度：总宽度 - 左右padding
	const availableWidth = width - 2 * padding
	// 重新计算每个颜色项宽度，适配可用区域
	const itemWidth = availableWidth / colorsPerRow
	// ✅ 关键变量：外边框的宽度和高度
	const boxWidth = availableWidth; // 统计外框宽度
	const boxHeight = titleHeight + totalRows * itemHeight + padding * 7 + colorStartY; // 统计外框高度
	// 统计外框起始坐标（居中 + 内边距）
	const boxStartX = x;
	const boxStartY = y + padding * 2; // 标题文字下方间距
	// 标题起始坐标
	const titleX = x + padding * 3;
	const titleY = y + padding * 7;

	console.log('统计布局计算:', {
		totalColors,
		colorsPerRow,
		totalRows,
		availableWidth,
		itemWidth,
		boxWidth,
		boxHeight
	})
	console.log('统计外框坐标:', {
		boxStartX,
		boxStartY
	})


	// ========== 1. 绘制【整体外边框】==========
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = '#ebe6e7' // 边框颜色
	// ctx.strokeStyle = '#ff0000' // 边框颜色

	// 标题
	ctx.font = `bold ${fontSize * 2}px sans-serif`
	ctx.fillStyle = '#101828'
	ctx.fillText(`颜色统计 - ${colorStats.value.length}种颜色 / ${totalBeads.value}颗`, titleX, titleY)
	console.log('绘制标题:', {
		text: `颜色统计 - ${colorStats.value.length}种颜色 / ${totalBeads.value}颗`,
		x: titleX,
		y: titleY
	})
	// y += fontSize * 2
	// ctx.strokeRect(boxStartX, boxStartY, boxWidth, boxHeight);


	// ========== ✅ 绘制【圆弧圆角边框】核心代码 ==========
	ctx.beginPath();
	// 左上角圆弧
	ctx.arc(boxStartX + radius, boxStartY + radius, radius, Math.PI, Math.PI * 1.5);
	// 顶部直线
	ctx.lineTo(boxStartX + boxWidth - radius, boxStartY);
	// 右上角圆弧
	ctx.arc(boxStartX + boxWidth - radius, boxStartY + radius, radius, Math.PI * 1.5, Math.PI * 2);
	// 右侧直线
	ctx.lineTo(boxStartX + boxWidth, boxStartY + boxHeight - radius);
	// 右下角圆弧
	ctx.arc(boxStartX + boxWidth - radius, boxStartY + boxHeight - radius, radius, 0, Math.PI * 0.5);
	// 底部直线
	ctx.lineTo(boxStartX + radius, boxStartY + boxHeight);
	// 左下角圆弧
	ctx.arc(boxStartX + radius, boxStartY + boxHeight - radius, radius, Math.PI * 0.5, Math.PI);
	// 左侧直线 + 闭合路径
	ctx.closePath();
	// 描边绘制圆弧边框
	ctx.stroke();

	for (let i = 0; i < colorStats.value.length; i++) {
		const stat = colorStats.value[i]
		const col = i % colorsPerRow
		const row = Math.floor(i / colorsPerRow)

		const itemX = titleX + col * itemWidth
		const itemY = titleY + row * itemHeight + colorStartY + 28 * scale

		console.log(`绘制颜色条目 ${i}:`, {
			color: stat.color,
			count: stat.count
		})
		console.log(`颜色条目 ${i} 位置:`, {
			col: col,
			row: row,
			itemX: itemX,
			itemY: itemY
		})
		console.log(`颜色条目 ${i} 尺寸:`, {
			itemWidth: itemWidth,
			itemHeight: itemHeight
		})

		// 绘制颜色色块
		ctx.fillStyle = stat.hex
		ctx.fillRect(itemX + 10 * scale, itemY + 10 * scale, swatchSize, swatchSize);


		// 颜色名称和编号 + 颗粒数量
		ctx.font = `500 ${fontSize * 1.7}px sans-serif`
		ctx.fillStyle = '#6a7282'
		const codeText = stat.code || ''
		const countText = `（${stat.count}）`
		const textY = itemY + swatchSize * 0.7 + 16 * scale;

		// 绘制颜色code
		ctx.fillText(codeText, itemX + swatchSize + 20 * scale, textY)
		console.log(`绘制颜色code ${codeText}:`, {
			x: itemX + swatchSize + 20 * scale,
			y: textY
		})

		// 计算颜色code宽度，然后绘制颗粒数量
		const codeWidth = ctx.measureText(codeText).width
		ctx.fillText(countText, itemX + swatchSize + 15 * scale + codeWidth, textY)
		console.log(`绘制颗粒数量 ${countText}:`, {
			x: itemX + swatchSize + 15 * scale + codeWidth,
			y: textY
		})
	}

	// 返回最终Y坐标，用于后续绘制二维码/说明文字
	return boxStartY + boxHeight + padding;
}

// 绘制颜色统计图（横向布局：纵向单列排列，超高换列）
const drawColorStatsHorizontal = (ctx, x, y, maxHeight, scale, colorsPerColumn) => {
	const padding = 16 * scale
	const lineWidth = 2 * scale
	const radius = 14 * scale
	const itemHeight = 60 * scale // 每项高度
	const swatchSize = 40 * scale
	const fontSize = 20 * scale
	const columnWidth = 300 * scale // 每列宽度

	const totalColors = colorStats.value.length
	const columns = Math.ceil(totalColors / colorsPerColumn)
	const boxWidth = columns * columnWidth + padding * 4
	const boxHeight = maxHeight - padding * 2
	
	const boxStartX = x + padding * 3
	const boxStartY = y

	// 标题
	const titleX = boxStartX + padding * 2
	const titleY = boxStartY + padding + 40
	ctx.font = `bold ${fontSize * 2}px sans-serif`
	ctx.fillStyle = '#101828'
	ctx.fillText(`颜色统计`, titleX, titleY + padding)

	// 副标题（统计数量）
	ctx.font = `bold ${fontSize * 1.8}px sans-serif`
	ctx.fillStyle = '#6a7282'
	ctx.fillText(`${totalColors}种颜色 / ${totalBeads.value}颗`, titleX, titleY + 70 + padding )

	// 绘制外边框
	ctx.lineWidth = lineWidth
	ctx.strokeStyle = '#ebe6e7'
	// ctx.strokeStyle = '#ff0000'
	ctx.beginPath()
	ctx.arc(boxStartX + radius, boxStartY + radius, radius, Math.PI, Math.PI * 1.5)
	ctx.lineTo(boxStartX + boxWidth - radius, boxStartY)
	ctx.arc(boxStartX + boxWidth - radius, boxStartY + radius, radius, Math.PI * 1.5, Math.PI * 2)
	ctx.lineTo(boxStartX + boxWidth, boxStartY + boxHeight - radius)
	ctx.arc(boxStartX + boxWidth - radius, boxStartY + boxHeight - radius, radius, 0, Math.PI * 0.5)
	ctx.lineTo(boxStartX + radius, boxStartY + boxHeight)
	ctx.arc(boxStartX + radius, boxStartY + boxHeight - radius, radius, Math.PI * 0.5, Math.PI)
	ctx.closePath()
	ctx.stroke()

	// 绘制每个颜色条目
	const itemStartY = y + padding + 60
	for (let i = 0; i < totalColors; i++) {
		const stat = colorStats.value[i]
		const col = Math.floor(i / colorsPerColumn)
		const row = i % colorsPerColumn

		const itemX = titleX
		const itemY = itemStartY + row * itemHeight + 70 + padding * 2 

		// 颜色色块
		ctx.fillStyle = stat.hex
		ctx.fillRect(itemX, itemY, swatchSize, swatchSize)

		// 颜色code和数量
		ctx.font = `${fontSize * 1.7}px sans-serif`
		ctx.fillStyle = '#6a7282'
		const codeText = stat.code || ''
		const countText = `(${stat.count})`
		ctx.fillText(codeText, itemX + swatchSize + 5, itemY + swatchSize * 0.7)
		const codeWidth = ctx.measureText(codeText).width
		ctx.fillText(countText, itemX + swatchSize + 10 + codeWidth, itemY + swatchSize * 0.7)
	}

	return boxWidth
}

// 绘制作品信息
const drawArtworkInfo = (ctx, x, y, width, scale, contentRows) => {
	console.log('绘制作品信息:', {
		x,
		y,
		width,
		scale
	})
	const padding = 16 * scale
	const lineWidth = 2 * scale; // 边框粗细
	// 计算可用宽度：总宽度 - 左右padding
	const availableWidth = ((width - 2 * padding) / 5) * 2 // 作品信息区域占总宽度的2/5
	const radius = 14 * scale; // ✅ 圆弧圆角大小（可自由调整）
	const titleHeight = 50; // 标题栏高度
	const lineHeight = 60 * scale; // 每行文字高度
	const titleFontSize = 40 * scale; // 标题字号
	const textFontSize = 20 * scale; // 内容字号
	const textColor = '#101828'; // 主文字颜色
	const labelColor = '#6a7282'; // 标签文字颜色（浅灰，区分内容）
	const borderColor = '#ebe6e7';     // 边框色
	// const borderColor = '#ff0000'; // 边框色（测试用）
	// 统计外框起始坐标（居中 + 内边距）
	const boxStartX = x;
	const boxStartY = y + padding * 4; // 标题文字下方间距
	// 标题起始坐标
	const titleX = x + padding * 3;
	const titleY = y + padding * 7 + 20;

	console.log('作品信息行数:', contentRows)
	// ========== 1. 计算模块总高度 ==========

	const contentHeight = contentRows * lineHeight;
	const boxHeight = padding * 2 * contentRows + titleHeight +
		contentHeight; // 模块总高度  16 * 2 + 50 + contentRows * 40
	console.log('作品信息模块高度计算:', {
		contentHeight,
		boxHeight
	})
	console.log('作品信息模块坐标:', {
		boxStartX,
		boxStartY
	})
	console.log('作品信息模块宽度:', availableWidth)
	// 填充背景 + 描边边框
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = borderColor;
	// ========== 2. 绘制圆角背景（和颜色统计模块样式统一） ==========
	ctx.beginPath();
	// 左上角圆弧
	ctx.arc(boxStartX + radius, boxStartY + radius, radius, Math.PI, Math.PI * 1.5);
	// 顶部直线
	ctx.lineTo(boxStartX + availableWidth - radius, boxStartY);
	// 右上角圆弧
	ctx.arc(boxStartX + availableWidth - radius, boxStartY + radius, radius, Math.PI * 1.5, Math.PI * 2);
	// 右侧直线
	ctx.lineTo(boxStartX + availableWidth, boxStartY + boxHeight - radius);
	// 右下角圆弧
	ctx.arc(boxStartX + availableWidth - radius, boxStartY + boxHeight - radius, radius, 0, Math.PI * 0.5);
	// 底部直线
	ctx.lineTo(boxStartX + radius, boxStartY + boxHeight);
	// 左下角圆弧
	ctx.arc(boxStartX + radius, boxStartY + boxHeight - radius, radius, Math.PI * 0.5, Math.PI);
	ctx.closePath();
	ctx.stroke();

	// ========== 3. 绘制标题「作品信息」 ==========
	ctx.font = `bold ${titleFontSize}px sans-serif`; // 字重600加粗
	ctx.fillStyle = textColor;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle'; // 文字垂直居中
	ctx.fillText('作品信息', titleX, titleY);

	// ========== 4. 绘制三行左右对齐的文字 ==========
	// 定义三行数据（标签+内容）
	const rows = [{
		label: '作品标题',
		value: exportSettings.value.title || '-'
	},
	{
		label: '作者名',
		value: authorName.value || '-'
	},
	{
		label: '品牌色系',
		value: selectedBrand.value
	},
	{
		label: '尺寸规格',
		value: gridColumns.value + '*' + gridRows.value
	}
	];
	if (contentRows == 2) {
		rows.splice(0, 2) // 没有标题和作者信息，就不显示
	} else if (app.isEmpty(exportSettings.value.title)) {
		rows.splice(0, 1) // 没有标题就不显示标题行
	} else if (app.isEmpty(exportSettings.value.showAuthor)) {
		rows.splice(1, 1) // 没有作者信息就不显示作者行
	}

	rows.forEach((row, index) => {
		// 计算当前行的垂直居中Y坐标
		const rowY = boxStartY + titleHeight + (index + 1) * lineHeight + padding * 2;
		console.log(`绘制作品信息行 ${index}:`, {
			label: row.label,
			value: row.value,
			x: titleX,
			y: rowY
		})

		// ① 绘制左边标签（左对齐，浅灰色）
		ctx.font = `500 ${textFontSize * 1.7}px sans-serif`;
		ctx.fillStyle = labelColor;
		ctx.textAlign = 'left';
		ctx.fillText(row.label, titleX, rowY);

		// ② 绘制右边内容（右对齐，主色）
		ctx.fillStyle = textColor;
		ctx.textAlign = 'right';
		ctx.fillText(row.value, titleX + availableWidth - padding * 5, rowY);
	});

	// 重置对齐方式，避免影响后续绘制
	ctx.textAlign = 'left';

	// 返回模块底部Y坐标，用于后续绘制其他元素
	return y + boxHeight;
}

// 绘制水印
const drawWatermark = (ctx, canvasWidth, canvasHeight, scale) => {
	if (!exportSettings.value.addWatermark || !watermarkText.value) return

	const fontSize = EXPORT_FONT_SIZE * scale * 1.5

	if (exportSettings.value.watermarkType === 'oneCenter') {
		// 单个居中水印
		ctx.save()
		ctx.globalAlpha = 0.5
		ctx.font = `bold ${fontSize * 7}px sans-serif`
		ctx.fillStyle = '#99a1af'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText(watermarkText.value, canvasWidth / 2, canvasHeight / 2)
		ctx.restore()
	} else {
		// 多列斜着循环文字
		ctx.save()
		ctx.globalAlpha = 0.5
		ctx.font = `${fontSize}px sans-serif`
		ctx.fillStyle = '#99a1af'
		// ctx.fillStyle = '#ffaa00'
		ctx.textAlign = 'left'
		ctx.textBaseline = 'top'

		const spacing = 200 * scale
		const rows = Math.ceil(canvasHeight / spacing) + 2
		const cols = Math.ceil(canvasWidth / spacing) + 2

		console.log('绘制斜着循环水印:', {
			rows,
			cols,
			spacing
		})

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				ctx.save()
				ctx.translate(c * spacing + spacing / 2, r * spacing + spacing / 2)
				ctx.rotate(-Math.PI / 6) // 旋转30度
				ctx.fillText(watermarkText.value, 0, 0)
				ctx.restore()
			}
		}
		ctx.restore()
	}
}

// 绘制分享码标识（包含二维码）
const drawShareCode = (ctx, x, y, width, shareCode, scale) => {
	console.log('绘制分享码标识:', {
		x,
		y,
		width,
		shareCode,
		scale
	})
	if (!exportSettings.value.addShareCode || !shareCode) return
	// 主色/点缀色
	const accentPrimary = '#5cadfd'
	const accentLight = '#eff6ff'      // 二维码背景
	const accentLight2 = '#bedbff'
	const accentLight3 = '#93c5fd'
	const accentHover = '#357abd'      // 二维码定位点深色
	const padding = 16 * scale; // 边框
	const lineWidth = 2 * scale // 粗细
	// 计算可用宽度：总宽度 - 左右padding
	const availableLeftWidth = ((width - 2 * padding) / 5) * 2 // 作品信息区域占总宽度的2/5
	const availableWidth = ((width - 2 * padding) / 5) * 3 - padding * 2 // 分享码占总宽度的3/5
	const radius = 14 * scale; // ✅ 圆弧圆角大小（可自由调整）

	const fontSize = EXPORT_FONT_SIZE * scale
	const qrSize = QR_CODE_SIZE * scale

	const borderColor = '#bedbff4d';     // 边框色
	// const borderColor = '#ff0000'; // 边框色（测试用）
	// 统计外框起始坐标（居中 + 内边距）
	const boxStartX = x + availableLeftWidth + padding;
	const boxStartY = y + padding * 4; // 标题文字下方间距

	// ========== 1. 计算模块总高度 ==========
	const boxHeight = padding * 8 + qrSize; // 模块总高度  16 * 2 + 50 + contentRows * 40
	console.log('分享码模块高度计算:', {
		boxHeight
	})
	console.log('分享码模块坐标:', {
		boxStartX,
		boxStartY
	})
	console.log('分享码模块宽度:', availableWidth)
	// 填充背景 +  = lineWidth;
	ctx.strokeS描边边框
	ctx.lineWidthtyle = borderColor;
	// ========== 2. 绘制圆角背景（和颜色统计模块样式统一） ==========
	ctx.beginPath();
	// 左上角圆弧
	ctx.arc(boxStartX + radius, boxStartY + radius, radius, Math.PI, Math.PI * 1.5);
	// 顶部直线
	ctx.lineTo(boxStartX + availableWidth - radius, boxStartY);
	// 右上角圆弧
	ctx.arc(boxStartX + availableWidth - radius, boxStartY + radius, radius, Math.PI * 1.5, Math.PI * 2);
	// 右侧直线
	ctx.lineTo(boxStartX + availableWidth, boxStartY + boxHeight - radius);
	// 右下角圆弧
	ctx.arc(boxStartX + availableWidth - radius, boxStartY + boxHeight - radius, radius, 0, Math.PI * 0.5);
	// 底部直线
	ctx.lineTo(boxStartX + radius, boxStartY + boxHeight);
	// 左下角圆弧
	ctx.arc(boxStartX + radius, boxStartY + boxHeight - radius, radius, Math.PI * 0.5, Math.PI);
	ctx.closePath();
	const gradient = ctx.createLinearGradient(boxStartX, boxStartY, boxStartX + availableWidth, boxStartY +
		boxHeight);
	// 添加渐变颜色（完全匹配你的CSS）
	gradient.addColorStop(0, 'rgba(190, 219, 255, 0.2)'); // #bedbff33 转RGBA
	gradient.addColorStop(1, '#ffffff'); // 纯白色
	ctx.fillStyle = gradient;
	ctx.fill();
	ctx.stroke();

	ctx.save()

	// 二维码区域（左侧）
	const qrX = boxStartX + padding * 4
	const qrY = boxStartY + padding * 4
	const qrPadding = 10 * scale // 二维码边框内边距
	const qrBorderSize = qrSize + qrPadding * 2

	// 绘制二维码框
	// 填充背景 + 描边边框
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = '#ebe6e7';
	// ========== 2. 绘制圆角背景（和颜色统计模块样式统一） ==========
	ctx.beginPath();
	// 左上角圆弧
	ctx.arc(qrX + radius, qrY + radius, radius, Math.PI, Math.PI * 1.5);
	// 顶部直线
	ctx.lineTo(qrX + qrBorderSize - radius, qrY);
	// 右上角圆弧
	ctx.arc(qrX + qrBorderSize - radius, qrY + radius, radius, Math.PI * 1.5, Math.PI * 2);
	// 右侧直线
	ctx.lineTo(qrX + qrBorderSize, qrY + qrBorderSize - radius);
	// 右下角圆弧
	ctx.arc(qrX + qrBorderSize - radius, qrY + qrBorderSize - radius, radius, 0, Math.PI * 0.5);
	// 底部直线
	ctx.lineTo(qrX + radius, qrY + qrBorderSize);
	// 左下角圆弧
	ctx.arc(qrX + radius, qrY + qrBorderSize - radius, radius, Math.PI * 0.5, Math.PI);
	ctx.closePath();
	ctx.fillStyle = '#ffffff';
	ctx.fill();
	ctx.stroke();

	ctx.save()

	// 分享码太长时跳过二维码绘制（限制约1000字符）
	console.log('分享码:', shareCode)
	console.log('分享码长度:', shareCode.length)
	// 创建并绘制【蓝色系彩色二维码】
	try {
		const qr = new UQRCode()
		// 上线需要替换域名
		qr.data = 'https://mp-f64c74e6-f53f-41e0-8406-216ac4da6408.cdn.bspapp.com' + '?shareCode=' + shareCode // 你的内容 PPPPPR
		qr.size = qrSize
		// 🔥 替换背景色：白色 → 浅蓝底色 #eff6ff
		qr.backgroundColor = accentLight
		// 🔥 替换前景色基础色：黑色 → 主蓝色 #5cadfd
		qr.foregroundColor = accentPrimary
		qr.make()

		const moduleCount = qr.moduleCount
		const cellSize = qrSize / moduleCount

		console.log('二维码模块数:', moduleCount)
		console.log('二维码单元格大小:', cellSize)

		// 绘制二维码（逐格子绘制）
		for (let row = 0; row < moduleCount; row++) {
			for (let col = 0; col < moduleCount; col++) {
				if (qr.isBlack(row, col)) {
					// ==============================================
					// 🔥 核心：彩色美化 - 定位点用深色，普通点用主色
					// 二维码三个角的定位框 → 用更深的 #357abd
					// 普通模块 → 用主色 #5cadfd
					// ==============================================
					const isPositionBox =
						(row < 7 && col < 7) ||                      // 左上角
						(row < 7 && col > moduleCount - 8) ||       // 右上角
						(row > moduleCount - 8 && col < 7)          // 左下角

					// 定位点用深色，普通点用主色，层次感更强
					ctx.fillStyle = isPositionBox ? accentHover : accentPrimary
					// 绘制彩色二维码模块
					ctx.fillRect(
						qrX + col * cellSize,
						qrY + row * cellSize,
						cellSize + 0.5,
						cellSize + 0.5
					)
					// console.log(`绘制二维码模块: row=${row}, col=${col}, isPositionBox=${isPositionBox}`)
					// console.log(`模块坐标: x=${qrX + col * cellSize}, y=${qrY + row * cellSize}, size=${cellSize + 0.5}`)
				}
			}
		}
	} catch (err) {
		console.error('生成二维码失败:', err)
		// 回退：显示文字提示
		ctx.font = `${fontSize * 0.6}px sans-serif`
		ctx.fillStyle = '#999'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText('二维码生成失败', qrX + qrSize / 2, qrY + qrSize / 2)
	}

	// 二维码区域（右侧）
	// 分享码文本内容
	const textX = qrX + qrBorderSize + padding * 2
	const textY = qrY + padding * 4 // 从二维码顶部开始，留出字体大小
	const textMaxWidth = availableWidth - qrBorderSize - padding * 9 // 右侧边距
	const textHeight = 150
	ctx.font = `${fontSize * 1.5}px sans-serif`
	ctx.fillStyle = '#4a5565'
	ctx.textAlign = 'left'
	ctx.textBaseline = 'middle'
	ctx.fillText('请使用[豆图]小程序扫码', textX, textY, textMaxWidth)
	console.log('分享码提示文字坐标:', {
		x: textX,
		y: textY,
		availableWidth: textMaxWidth,
	})
	// 分享码
	// 填充背景 + 描边边框
	const codeY = textY + 30 + padding * 2
	ctx.lineWidth = lineWidth;
	ctx.strokeStyle = '#ebe6e7';
	// ========== 2. 绘制圆角背景（和颜色统计模块样式统一） ==========
	ctx.beginPath();
	// 左上角圆弧
	ctx.arc(textX + radius, codeY + radius, radius, Math.PI, Math.PI * 1.5);
	// 顶部直线
	ctx.lineTo(textX + textMaxWidth - radius, codeY);
	// 右上角圆弧
	ctx.arc(textX + textMaxWidth - radius, codeY + radius, radius, Math.PI * 1.5, Math.PI * 2);
	// 右侧直线
	ctx.lineTo(textX + textMaxWidth, codeY + textHeight - radius);
	// 右下角圆弧
	ctx.arc(textX + textMaxWidth - radius, codeY + textHeight - radius, radius, 0, Math.PI * 0.5);
	// 底部直线
	ctx.lineTo(textX + radius, codeY + textHeight);
	// 左下角圆弧
	ctx.arc(textX + radius, codeY + textHeight - radius, radius, Math.PI * 0.5, Math.PI);
	ctx.closePath();
	ctx.fillStyle = '#ffffff';
	ctx.fill();
	ctx.stroke();
	ctx.font = `${fontSize * 1.5}px sans-serif`
	ctx.fillStyle = '#4a5565'
	ctx.textAlign = 'left'
	ctx.textBaseline = 'middle'
	ctx.fillText(`分享码：${shareCode}`, textX + padding * 2, codeY + textHeight / 2, textMaxWidth - padding * 2)
	ctx.save()

	ctx.restore()
}

// 完整的导出流程
const performFullExport = async (isPreview = false) => {
	// 预览模式不显示 loading
	if (!isPreview) {
		uni.showLoading({
			title: '正在生成...'
		})
	}

	try {
		// 1. 获取主Canvas图像
		const mainImagePath = await new Promise((resolve, reject) => {
			uni.canvasToTempFilePath({
				canvas: mainCanvas,
				fileType: 'png',
				quality: 1,
				success: (res) => resolve(res.tempFilePath),
				fail: (err) => reject(err)
			})
		})

		// 3. 计算布局
		const layout = await calculateExportLayout()
		if (!layout) {
			throw new Error('无法计算导出布局')
		}

		// 4. 分开导出模式
		if (!layout.isMerge) {
			const imagePath = await performSeparateExport(mainImagePath, layout, tempShareCode, isPreview)
			return imagePath
		}
		console.log('合并导出布局:', tempShareCode)
		// 5. 合并导出模式
		const imagePath = await performMergeExport(mainImagePath, layout, tempShareCode, isPreview)
		return imagePath

	} catch (error) {
		console.error('导出失败:', error)
		uni.hideLoading()
		uni.showToast({
			icon: 'none',
			title: '导出失败: ' + error.message
		})
		return null
	}
}

// 合并导出
const performMergeExport = async (mainImagePath, layout, shareCode, isPreview = false) => {
	console.log('执行合并导出，布局:', shareCode)
	// 获取导出Canvas
	const exportCanvas = await getExportCanvasInstance()
	if (!exportCanvas) {
		throw new Error('无法获取导出画布')
	}

	// 设置导出Canvas尺寸
	const canvasWidth = layout.totalWidth
	const canvasHeight = layout.totalHeight
	exportCanvas.canvas.width = canvasWidth
	exportCanvas.canvas.height = canvasHeight
	exportCanvas.ctx.scale(1, 1)

	// 绘制阴影背景
	if (exportSettings.value.addShadow) {
		exportCanvas.ctx.save()
		exportCanvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
		exportCanvas.ctx.shadowBlur = 30
		exportCanvas.ctx.shadowOffsetX = 10
		exportCanvas.ctx.shadowOffsetY = 10
		exportCanvas.ctx.fillStyle = '#ffffff'
		exportCanvas.ctx.fillRect(layout.shadowOffset, layout.shadowOffset,
			canvasWidth - layout.shadowOffset * 2, canvasHeight - layout.shadowOffset * 2)
		exportCanvas.ctx.restore()
	}

	// 绘制白色背景
	exportCanvas.ctx.fillStyle = '#ffffff'
	exportCanvas.ctx.fillRect(0, 0, canvasWidth, canvasHeight)

	// ========== 高清绘制拼豆图纸（使用大格子尺寸） ==========
	const {
		mappedData,
		gridSize
	} = perlerResultData.value || {}
	if (mappedData && gridSize) {
		// 使用更大的格子尺寸进行高清绘制（50px 确保清晰）
		const hdCellSize = 50
		const minCellSize = 50 // 最小格子尺寸限制（确保不低于50px）
		const N = gridSize.N
		const M = gridSize.M

		// 计算图纸区域的实际尺寸
		const hdWidth = N * hdCellSize
		const hdHeight = M * hdCellSize

		// 可用空间（已确保足够大）
		const availableWidth = layout.mainWidth - layout.shadowOffset * 2
		const availableHeight = layout.mainHeight - layout.shadowOffset * 2

		// 选择合适的绘制尺寸（固定使用50px高清尺寸）
		let drawWidth, drawHeight, cellSize
		if (hdWidth <= availableWidth && hdHeight <= availableHeight) {
			// 可以使用高清尺寸
			drawWidth = hdWidth
			drawHeight = hdHeight
			cellSize = hdCellSize
		} else {
			// 使用布局尺寸，确保不低于50px
			drawWidth = availableWidth
			drawHeight = availableHeight
			cellSize = Math.max(minCellSize, Math.min(drawWidth / N, drawHeight / M))
		}

		// 计算居中偏移
		const offsetX = layout.mainX + layout.shadowOffset + (availableWidth - drawWidth) / 2
		const offsetY = layout.mainY + layout.shadowOffset + (availableHeight - drawHeight) / 2

		// 绘制图纸阴影（在图纸区域绘制白色矩形 + 阴影效果）
		if (exportSettings.value.addShadow) {
			exportCanvas.ctx.save()
			exportCanvas.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
			exportCanvas.ctx.shadowBlur = 30
			exportCanvas.ctx.shadowOffsetX = 10
			exportCanvas.ctx.shadowOffsetY = 10
			exportCanvas.ctx.fillStyle = '#ffffff'
			exportCanvas.ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight)
			exportCanvas.ctx.restore()
		}

		// 高清绘制拼豆格子
		exportCanvas.ctx.save()

		// 绘制每个格子
		for (let y = 0; y < M; y++) {
			for (let x = 0; x < N; x++) {
				const pixel = mappedData[y]?.[x]
				if (pixel && !pixel.isExternal && pixel.key !== 'TRANSPARENT') {
					exportCanvas.ctx.fillStyle = pixel.color
					exportCanvas.ctx.fillRect(
						offsetX + x * cellSize,
						offsetY + y * cellSize,
						cellSize,
						cellSize
					)
				}
			}
		}

		// 绘制颜色 code
		if (showColorCode.value) {
			const fontSize = 20 // 固定字体大小

			for (let y = 0; y < M; y++) {
				for (let x = 0; x < N; x++) {
					const pixel = mappedData[y]?.[x]
					if (pixel && !pixel.isExternal && pixel.key !== 'TRANSPARENT') {
						const centerX = offsetX + x * cellSize + cellSize / 2
						const centerY = offsetY + y * cellSize + cellSize / 2

						// 计算背景色亮度
						const bgColor = pixel.color
						const r = parseInt(bgColor.slice(1, 3), 16)
						const g = parseInt(bgColor.slice(3, 5), 16)
						const b = parseInt(bgColor.slice(5, 7), 16)
						const brightness = (r * 299 + g * 587 + b * 114) / 1000
						const textColor = brightness > 128 ? '#000000' : '#FFFFFF'

						exportCanvas.ctx.fillStyle = textColor
						exportCanvas.ctx.font = `bold ${fontSize}px system-ui, sans-serif`
						exportCanvas.ctx.textAlign = 'center'
						exportCanvas.ctx.textBaseline = 'middle'
						exportCanvas.ctx.fillText(pixel.key, centerX, centerY)
					}
				}
			}
		}

		exportCanvas.ctx.restore()
	} else {
		// 回退：使用原有方式绘制
		const mainImage = await new Promise((resolve, reject) => {
			const img = exportCanvas.canvas.createImage()
			img.onload = () => resolve(img)
			img.onerror = reject
			img.src = mainImagePath
		})
		exportCanvas.ctx.drawImage(mainImage, layout.mainX, layout.mainY, layout.mainWidth, layout.mainHeight)
	}

	// 根据布局方向绘制剩余内容
	const isHorizontal = layout.direction === 'horizontal'

	if (isHorizontal) {
		// 横向布局：颜色统计表在图纸右侧（纵向单列排列），分享码和信息在下方
		// 绘制颜色统计图（右侧，纵向排列）
		if (colorStats.value.length > 0) {
			drawColorStatsHorizontal(exportCanvas.ctx, layout.statsX, layout.statsY, layout.statsHeight, 1,
				layout.colorsPerColumn)
		}

		// 绘制作品信息（下方左侧）
		drawArtworkInfo(exportCanvas.ctx, layout.infoX, layout.infoY, layout.infoWidth, 1, layout.contentRows)

		// 绘制分享码（下方右侧）
		if (shareCode) {
			drawShareCode(exportCanvas.ctx, layout.shareCodeX, layout.shareCodeY, layout.totalWidth - layout
				.shadowOffset * 2 - layout.rightWidth , shareCode, 1)
		}
		console.log({layout:layout})
	} else {
		// 纵向布局：颜色统计表在图纸下方，分享码和信息在统计表下方
		// 绘制颜色统计图（下方）
		if (colorStats.value.length > 0) {
			drawColorStats(exportCanvas.ctx, layout.statsX, layout.statsY, layout.statsWidth, 1, layout
				.colorsPerRow)
		}

		// 绘制作品信息（在颜色统计图下方）
		drawArtworkInfo(exportCanvas.ctx, layout.infoX, layout.infoY, layout.infoWidth, 1, layout.contentRows)

		// 绘制分享码（左侧文字 + 右侧二维码）
		if (shareCode) {
			drawShareCode(exportCanvas.ctx, layout.shareCodeX, layout.shareCodeY, layout.totalWidth - layout
				.shadowOffset * 2, shareCode, 1)
		}
	}

	// 绘制水印（最后绘制，覆盖在最上层）
	drawWatermark(exportCanvas.ctx, canvasWidth, canvasHeight, 1)

	// 导出图片
	const finalImagePath = await new Promise((resolve, reject) => {
		uni.canvasToTempFilePath({
			canvas: exportCanvas.canvas,
			fileType: 'png',
			quality: 1,
			destWidth: canvasWidth * EXPORT_SCALE,
			destHeight: canvasHeight * EXPORT_SCALE,
			success: (res) => resolve(res.tempFilePath),
			fail: (err) => reject(err)
		})
	})

	// 预览模式：只返回图片路径
	if (isPreview) {
		return finalImagePath
	}

	// 保存到相册
	await saveToAlbum(finalImagePath, shareCode)
	return finalImagePath
}

// 分开导出
const performSeparateExport = async (mainImagePath, layout, shareCode, isPreview = false) => {
	// ========== 第一张：图纸 ==========
	const exportCanvas1 = await getExportCanvasInstance()
	if (!exportCanvas1) {
		throw new Error('无法获取导出画布')
	}

	// 图纸尺寸
	const paperWidth = layout.mainWidth + EXPORT_PADDING * 2
	const paperHeight = layout.mainHeight + EXPORT_PADDING * 2 + (exportSettings.value.addShadow ? 30 : 0)

	exportCanvas1.canvas.width = paperWidth
	exportCanvas1.canvas.height = paperHeight

	// 绘制阴影
	if (exportSettings.value.addShadow) {
		exportCanvas1.ctx.save()
		exportCanvas1.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
		exportCanvas1.ctx.shadowBlur = 30
		exportCanvas1.ctx.shadowOffsetX = 10
		exportCanvas1.ctx.shadowOffsetY = 10
		exportCanvas1.ctx.fillStyle = '#ffffff'
		exportCanvas1.ctx.fillRect(0, 0, paperWidth, paperHeight)
		exportCanvas1.ctx.restore()
	}

	// 白色背景
	exportCanvas1.ctx.fillStyle = '#ffffff'
	exportCanvas1.ctx.fillRect(0, 0, paperWidth, paperHeight)

	// ========== 高清绘制拼豆图纸 ==========
	const {
		mappedData,
		gridSize
	} = perlerResultData.value || {}
	if (mappedData && gridSize) {
		const hdCellSize = 44
		const minCellSize = 16 // 最小格子尺寸限制
		const N = gridSize.N
		const M = gridSize.M

		const hdWidth = N * hdCellSize
		const hdHeight = M * hdCellSize

		const availableWidth = layout.mainWidth
		const availableHeight = layout.mainHeight

		let drawWidth, drawHeight, cellSize
		if (hdWidth <= availableWidth && hdHeight <= availableHeight) {
			drawWidth = hdWidth
			drawHeight = hdHeight
			cellSize = hdCellSize
		} else {
			drawWidth = availableWidth
			drawHeight = availableHeight
			cellSize = Math.max(minCellSize, Math.min(drawWidth / N, drawHeight / M))
		}

		const offsetX = EXPORT_PADDING + (availableWidth - drawWidth) / 2
		const offsetY = EXPORT_PADDING + (availableHeight - drawHeight) / 2

		exportCanvas1.ctx.save()

		for (let y = 0; y < M; y++) {
			for (let x = 0; x < N; x++) {
				const pixel = mappedData[y]?.[x]
				if (pixel && !pixel.isExternal && pixel.key !== 'TRANSPARENT') {
					exportCanvas1.ctx.fillStyle = pixel.color
					exportCanvas1.ctx.fillRect(
						offsetX + x * cellSize,
						offsetY + y * cellSize,
						cellSize,
						cellSize
					)
				}
			}
		}

		// 绘制颜色 code
		if (showColorCode.value) {
			const fontSize = 20 // 固定字体大小

			for (let y = 0; y < M; y++) {
				for (let x = 0; x < N; x++) {
					const pixel = mappedData[y]?.[x]
					if (pixel && !pixel.isExternal && pixel.key !== 'TRANSPARENT') {
						const centerX = offsetX + x * cellSize + cellSize / 2
						const centerY = offsetY + y * cellSize + cellSize / 2

						const bgColor = pixel.color
						const r = parseInt(bgColor.slice(1, 3), 16)
						const g = parseInt(bgColor.slice(3, 5), 16)
						const b = parseInt(bgColor.slice(5, 7), 16)
						const brightness = (r * 299 + g * 587 + b * 114) / 1000
						const textColor = brightness > 128 ? '#000000' : '#FFFFFF'

						exportCanvas1.ctx.fillStyle = textColor
						exportCanvas1.ctx.font = `bold ${fontSize}px system-ui, sans-serif`
						exportCanvas1.ctx.textAlign = 'center'
						exportCanvas1.ctx.textBaseline = 'middle'
						exportCanvas1.ctx.fillText(pixel.key, centerX, centerY)
					}
				}
			}
		}

		exportCanvas1.ctx.restore()
	} else {
		// 回退：使用原有方式
		const mainImage = await new Promise((resolve, reject) => {
			const img = exportCanvas1.canvas.createImage()
			img.onload = () => resolve(img)
			img.onerror = reject
			img.src = mainImagePath
		})
		exportCanvas1.ctx.drawImage(mainImage, EXPORT_PADDING, EXPORT_PADDING, layout.mainWidth, layout
			.mainHeight)
	}

	// 绘制水印
	drawWatermark(exportCanvas1.ctx, paperWidth, paperHeight, 1)

	// 导出图纸
	const paperPath = await new Promise((resolve, reject) => {
		uni.canvasToTempFilePath({
			canvas: exportCanvas1.canvas,
			fileType: 'png',
			quality: 1,
			destWidth: paperWidth * EXPORT_SCALE,
			destHeight: paperHeight * EXPORT_SCALE,
			success: (res) => resolve(res.tempFilePath),
			fail: (err) => reject(err)
		})
	})

	// 预览模式：只返回图纸路径
	if (isPreview) {
		return paperPath
	}

	// 保存图纸
	await new Promise((resolve) => {
		uni.saveImageToPhotosAlbum({
			filePath: paperPath,
			success: resolve,
			fail: resolve
		})
	})

	// ========== 第二张：颜色统计图 ==========
	if (colorStats.value.length > 0) {
		const exportCanvas2 = await getExportCanvasInstance()
		if (!exportCanvas2) {
			throw new Error('无法获取导出画布')
		}

		const statsHeight = Math.min(400, 60 + colorStats.value.length * 45) + EXPORT_PADDING * 2 + 30
		const statsWidth = layout.statsWidth + EXPORT_PADDING * 2

		exportCanvas2.canvas.width = statsWidth
		exportCanvas2.canvas.height = statsHeight

		// 绘制阴影
		if (exportSettings.value.addShadow) {
			exportCanvas2.ctx.save()
			exportCanvas2.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
			exportCanvas2.ctx.shadowBlur = 30
			exportCanvas2.ctx.shadowOffsetX = 10
			exportCanvas2.ctx.shadowOffsetY = 10
			exportCanvas2.ctx.fillStyle = '#ffffff'
			exportCanvas2.ctx.fillRect(0, 0, statsWidth, statsHeight)
			exportCanvas2.ctx.restore()
		}

		// 白色背景
		exportCanvas2.ctx.fillStyle = '#ffffff'
		exportCanvas2.ctx.fillRect(0, 0, statsWidth, statsHeight)

		// 绘制颜色统计图
		drawColorStats(exportCanvas2.ctx, EXPORT_PADDING, EXPORT_PADDING, layout.statsWidth, 1)

		// 导出统计图
		const statsPath = await new Promise((resolve, reject) => {
			uni.canvasToTempFilePath({
				canvas: exportCanvas2.canvas,
				fileType: 'png',
				quality: 1,
				destWidth: statsWidth * EXPORT_SCALE,
				destHeight: statsHeight * EXPORT_SCALE,
				success: (res) => resolve(res.tempFilePath),
				fail: (err) => reject(err)
			})
		})

		// 保存统计图
		await new Promise((resolve) => {
			uni.saveImageToPhotosAlbum({
				filePath: statsPath,
				success: resolve,
				fail: resolve
			})
		})
	}

	// 完成提示
	uni.hideLoading()
	uni.showToast({
		title: '导出成功',
		icon: 'success',
		duration: 2000
	})
	if (shareCode) {
		uni.showModal({
			title: '分享码已生成',
			content: `分享码: ${shareCode.substring(0, 30)}${shareCode.length > 30 ? '...' : ''}`,
			confirmText: '复制分享码',
			cancelText: '完成',
			success: (res) => {
				if (res.confirm) {
					copyShareCode()
				}
			}
		})
	}
}

// 保存到相册并显示提示
const saveToAlbum = (filePath, shareCode) => {
	return new Promise((resolve) => {
		uni.saveImageToPhotosAlbum({
			filePath,
			success: () => {
				uni.hideLoading()
				uni.showToast({
					title: '导出成功',
					icon: 'success',
					duration: 2000
				})
				if (shareCode) {
					uni.showModal({
						title: '分享码已生成',
						content: `分享码: ${shareCode.substring(0, 30)}${shareCode.length > 30 ? '...' : ''}`,
						confirmText: '复制分享码',
						cancelText: '完成',
						success: (res) => {
							if (res.confirm) {
								copyShareCode()
							}
							resolve()
						}
					})
				} else {
					resolve()
				}
			},
			fail: () => {
				uni.hideLoading()
				uni.showToast({
					icon: 'none',
					title: '保存失败'
				})
				resolve()
			}
		})
	})
}

// 重写的 performDownload
const performDownload = () => {
	// 保存设置到本地存储
	const settingsToSave = {
		...exportSettings.value,
		authorName: authorName.value,
		watermarkText: watermarkText.value
	}
	uni.setStorageSync('exportSettings', settingsToSave)

	// 设置模式下，保存设置并关闭弹窗，不执行导出
	if (isSetting.value) {
		showExportSettingsDialog.value = false
		isSetting.value = false
		return
	}

	showExportSettingsDialog.value = false

	// 生成预览图
	generateExportPreview()
}

// 高清下载功能（修复作用域报错+放大模糊）
const downloadImage = () => {
	// 检查是否有保存的设置
	const savedSettings = uni.getStorageSync('exportSettings')
	if (savedSettings) {
		exportSettings.value = {
			...exportSettings.value,
			...savedSettings
		}
		authorName.value = savedSettings.authorName || ''
		watermarkText.value = savedSettings.watermarkText || ''
	}

	toggleExportSettingsDialog()
}

onLoad(async (options) => {
	// 检查是否是分享码导入
	if (options.shareCode) {
		const result = decodeShareCode(options.shareCode)
		if (result.valid) {
			restoreFromShareCodeData(result.data)
			console.log('从分享码还原图纸成功')
		} else {
			uni.showToast({
				title: result.error || '分享码无效',
				icon: 'none'
			})
		}
		return
	}

	// 普通参数加载
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
		exportSettings.value = {
			...exportSettings.value,
			...savedSettings
		}
		authorName.value = savedSettings.authorName || ''
		watermarkText.value = savedSettings.watermarkText || ''
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
				console.log(
					`📐 图片尺寸: ${imageInfo.width}×${imageInfo.height}, 宽高比: ${imageAspectRatio.value}`)

				// 根据图片比例重新计算 gridRows（保持 gridColumns 不变）
				const newRows = Math.round(gridColumns.value / imageAspectRatio.value)
				gridRows.value = Math.max(5, Math.min(300, newRows))
				console.log(`📐 更新 gridRows: ${gridRows.value}（基于比例 ${imageAspectRatio.value}）`)
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
						console.log('📐 理论格子大小:', (canvasSize / Math.max(gridColumns.value,
							gridRows.value)).toFixed(1), 'px')
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

/* 全屏遮罩：完全阻止任何操作穿透 */
.fullscreen-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9998;
	background: transparent;
	pointer-events: all;
}

/* 全屏模式阻止页面滚动 */
.page-container.no-scroll {
	overflow: hidden !important;
	height: 100vh;
	position: fixed;
	left: 0;
	right: 0;
	touch-action: none;
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

/* 二维码Canvas */
.qr-canvas {
	position: fixed;
	left: -9999rpx;
	width: 150px;
	height: 150px;
}

/* 导出专用Canvas */
.export-canvas {
	position: fixed;
	left: -9999rpx;
	top: -9999rpx;
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
	box-sizing: border-box;
}

.export-settings-footer {
	flex-shrink: 0;
	background: #ffffff;
	padding: 32rpx;
	display: flex;
	gap: 24rpx;
	// border-top: 1rpx solid #f0f0f0;
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

.remember-settings {
	border-top: 2rpx solid var(--border-medium);
}

/* 导出预览弹框 */
.export-preview-dialog {
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

.export-preview-container {
	width: 600rpx;
	max-width: 90vw;
	height: 900rpx;
	max-height: 85vh;
	background: #ffffff;
	border-radius: 24rpx;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
	z-index: 100000;
}

.export-preview-header {
	flex-shrink: 0;
	background: #ffffff;
	padding: 32rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 1rpx solid #f0f0f0;
}

.export-preview-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1a1a2e;
}

.export-preview-close {
	font-size: 40rpx;
	color: #999;
	cursor: pointer;
}

.export-preview-content {
	width: 560rpx;
	flex: 1;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 20rpx;
	background: #f5f5f5;
	box-sizing: border-box;
	border-radius: 24rpx;
}



.preview-error {
	color: var(--color-error-2);
	font-size: 28rpx;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.preview-loading {
	text-align: center;
	color: var(--text-muted);
	font-size: 28rpx;
}

.preview-image {
	// max-width: 100%;
	// max-height: 100%;
	// display: block;
	width: 560rpx;
	height: auto;
}

.export-preview-footer {
	flex-shrink: 0;
	display: flex;
	gap: 24rpx;
	padding: 24rpx 32rpx;
	border-top: 1rpx solid #f0f0f0;
	background: #ffffff;
}

.export-preview-footer .export-btn {
	flex: 1;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 16rpx;
	font-size: 28rpx;
	margin: 0;
}

.show-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;

	.group-title {
		margin-bottom: 0;
	}
}

.group-title {
	font-weight: 500;
	margin-bottom: 24rpx;
	font-size: var(--text-base);
	color: var(--text-primary);
}

.switch-container {
	display: flex;
	align-items: center;
}

.radio-group {
	gap: 16rpx;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	display: grid;
}

.radio-item {
	padding: var(--space-sm) var(--space-lg);
	// background: var(--bg-secondary);
	transition: all 0.3s ease;
	font-weight: 500;
	font-size: 26rpx;
	border: 2rpx solid var(--border-medium);
	border-radius: 20rpx;
	color: var(--text-tertiary);
	text-align: center;
	box-sizing: border-box;
	gap: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;

	&.active {
		color: #ffffff;
		background: var(--text-primary);
		border-color: var(--text-primary);
	}

	.icon {
		width: 32rpx;
		height: 32rpx;

		&.horizontal {
			transform: rotate(90deg);
		}
	}



	text {
		font-size: var(--text-base);
		font-weight: 500;
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
	padding-top: 24rpx;
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
	display: flex;
	justify-content: center;
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

/* 输入框样式 */
.input-item {
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.input-label {
	display: block;
	font-size: 26rpx;
	color: #666;
	margin-bottom: 12rpx;
}

.input-field {
	width: 100%;
	height: 72rpx;
	padding: 0 24rpx;
	border: 1px solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	background: #fff;
	box-sizing: border-box;
}

.input-textarea {
	width: 100%;
	min-height: 120rpx;
	padding: 16rpx 24rpx;
	border: 1px solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	background: #fff;
	box-sizing: border-box;
	resize: vertical;
}

.picker-field {
	width: 100%;
	height: 72rpx;
	padding: 0 24rpx;
	border: 1px solid #e0e0e0;
	border-radius: 12rpx;
	font-size: 28rpx;
	background: #fff;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.picker-arrow {
	font-size: 24rpx;
	color: #999;
	margin-left: 16rpx;
}

.option-hint {
	font-size: 24rpx;
	color: #999;
	margin-top: 12rpx;
}
</style>