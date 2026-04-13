<template>
  <view class="page-container">
    <!-- 主要内容 -->
    <view class="section-container">
      <text class="section-header">拼豆图转换</text>
      <text class="section-text">将图片转换为拼豆图纸</text>
    </view>
    <!-- 上传区域 -->
    <view class="upload-section">
      <view class="upload-box" @click="chooseImage">
        <view v-if="!selectedImage" class="upload-placeholder">
          <image src="/static/svg/upload.svg" class="upload-icon" mode="aspectFit" />
          <text class="upload-text">点击图片上传</text>
          <text class="upload-text-sub">支持 JPG、PNG 格式</text>
        </view>
        <image v-else :src="selectedImage" class="preview-image" mode="aspectFit" />
        <button v-if="selectedImage" class="clear-btn" @click.stop="removeImage">
          清除
        </button>
      </view>
    </view>

    <!-- 品牌选择 -->
    <view class="section-container">
      <text class="section-title">品牌色系</text>
      <scroll-view class="brand-scroll" scroll-x>
        <view v-for="brand in brands" :key="brand.id" class="brand-tag" :class="{ active: selectedBrand === brand.id }"
          @click="selectedBrand = brand.id">
          <text class="brand-name">{{ brand.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 版型尺寸 -->
    <view class="section-container">
      <text class="section-title">版型尺寸</text>
      <view class="size-panel">
        <view class="size-row">
          <view class="size-label-container">
            <view class="size-label-icon">
              <image src="/static/svg/horizontal.svg" mode="aspectFit" class="size-icon" />
              <text class="size-label">横向钉</text>
            </view>
            <view class="size-value">
              <text class="size-label-text">{{ gridWidth }}</text>
              <text class="unit-text">钉</text>
            </view>
          </view>
          <view class="slider-input-container">
            <slider :value="gridWidth" min="5" max="300" @change="onGridWidthChange" activeColor="#1a1a2e"
              backgroundColor="#e8e8e8" block-size="20" />
            <view class="size-input-container">
              <input class="size-input" type="number" v-model="gridWidth" @blur="onGridWidthInput"
                @confirm="onGridWidthInput" min="5" max="300" />
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
              <text class="size-label-text">{{ gridHeight }}</text>
              <text class="unit-text">钉</text>
            </view>
          </view>
          <view class="slider-input-container">
            <slider :value="gridHeight" min="5" max="300" @change="onGridHeightChange" activeColor="#1a1a2e"
              backgroundColor="#e8e8e8" block-size="20" />
            <view class="size-input-container">
              <input class="size-input" type="number" v-model="gridHeight" @blur="onGridHeightInput"
                @confirm="onGridHeightInput" min="5" max="300" />
            </view>
          </view>
        </view>
        <view class="lock-row-container">
          <view class="lock-row" :class="{ active: isLocked }" @click="toggleLockRatio">
            <image :src="isLocked ? '/static/svg/lock.svg' : '/static/svg/unlock.svg'" class="lock-icon" />
            <text class="lock-text">{{ isLocked ? "已锁定比例" : "锁定比例" }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 高级选项 -->
    <view class="advanced-section">
      <view class="advanced-header" @click="showAdvancedOptions">
        <image src="/static/svg/advanced.svg" class="advanced-icon" mode="aspectFit" />
        <text class="advanced-title">高级选项</text>
        <image src="/static/svg/arrow3.svg" class="advanced-arrow" :class="{ 'is-open': showAdvancedPicker }" />
      </view>
      <view class="advanced-content" v-if="showAdvancedPicker">
        <!-- 颜色合并阈值 -->
        <view class="advanced-item">
          <text class="item-label">颜色合并阈值</text>
          <view class="slider-input-container">
            <slider :value="colorMergeThreshold" min="0" max="100" @change="onMergeThresholdChange"
              activeColor="#1a1a2e" backgroundColor="#e8e8e8" block-size="20" />
            <view class="size-input-container">
              <input class="size-input" type="number" v-model="colorMergeThreshold" @blur="onMergeThresholdInput"
                @confirm="onMergeThresholdInput" min="0" max="100" />
              <text class="unit-text">阈值</text>
            </view>
          </view>
        </view>

        <!-- 转换模式 -->
        <view class="advanced-item">
          <text class="item-label">转换模式</text>
          <view class="mode-scroll">
            <view v-for="mode in modeOptions" :key="mode.id" class="brand-tag mode-tag"
              :class="{ active: pixelationMode === mode.id }" @click="onModeChange(mode.id)">
              <text class="brand-name">{{ mode.name }}</text>
            </view>
          </view>
        </view>

        <!-- 显示拼豆板子 -->
        <view class="advanced-item show-item">
          <text class="item-label">显示拼豆板子</text>
          <view class="switch-container">
            <switch :checked="showBoard" @change="onShowBoardChange" color="#bedbff" />
          </view>
        </view>

        <!-- 显示颜色code -->
        <view class="advanced-item show-item">
          <text class="item-label">显示颜色code</text>
          <view class="switch-container">
            <switch :checked="showColorCode" @change="onShowColorCodeChange" color="#bedbff" />
          </view>
        </view>
      </view>
    </view>

    <!-- 开始按钮 -->
    <view class="action-section">
      <button class="action-btn" :class="{ disabled: !selectedImage }" :disabled="!selectedImage"
        @click="startGenerate">
        <text>开始转换</text>
        <image :src="selectedImage ? '/static/svg/arrow2.svg' : '/static/svg/arrow.svg'" class="arrow-icon"
          mode="aspectFit" />
      </button>
    </view>

    <!-- 自定义TabBar -->
    <tabbar :current="0"></tabbar>
  </view>
</template>

<script setup>
import { onShareAppMessage } from '@dcloudio/uni-app';
import { computed, ref } from "vue";

const selectedImage = ref("");
const selectedBrand = ref("mard");
const gridWidth = ref(30);
const gridHeight = ref(30);
const isLocked = ref(true);
const imageAspectRatio = ref(1);

const brands = [
  { id: "mard", name: "Mard" },
  { id: "coco", name: "Coco" },
  { id: "miwo", name: "咪小窝" },
  { id: "manman", name: "漫漫" },
  { id: "panpan", name: "盼盼" },
];

onShareAppMessage(() => { })

const onGridWidthChange = (e) => {
  const newWidth = e.detail.value;
  if (isLocked.value && imageAspectRatio.value) {
    gridHeight.value = Math.round(newWidth / imageAspectRatio.value);
  }
  gridWidth.value = newWidth;
};

const onGridHeightChange = (e) => {
  const newHeight = e.detail.value;
  if (isLocked.value && imageAspectRatio.value) {
    gridWidth.value = Math.round(newHeight * imageAspectRatio.value);
  }
  gridHeight.value = newHeight;
};

const onGridWidthInput = () => {
  gridWidth.value = Math.max(5, Math.min(300, parseInt(gridWidth.value) || 30));
  if (isLocked.value && imageAspectRatio.value) {
    gridHeight.value = Math.round(gridWidth.value / imageAspectRatio.value);
  }
};

const onGridHeightInput = () => {
  gridHeight.value = Math.max(5, Math.min(300, parseInt(gridHeight.value) || 30));
  if (isLocked.value && imageAspectRatio.value) {
    gridWidth.value = Math.round(gridHeight.value * imageAspectRatio.value);
  }
};

const toggleLockRatio = () => {
  isLocked.value = !isLocked.value;
};

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: async (res) => {
      const imagePath = res.tempFilePaths[0];
      selectedImage.value = imagePath;

      // 获取图片信息计算宽高比
      const imageInfo = await uni.getImageInfo({
        src: imagePath,
      });

      if (imageInfo && imageInfo.width && imageInfo.height) {
        imageAspectRatio.value = imageInfo.width / imageInfo.height;
        // 根据宽高比自动调整gridHeight
        if (isLocked.value) {
          gridHeight.value = Math.round(gridWidth.value / imageAspectRatio.value);
        }
      }
    },
  });
};

const removeImage = () => {
  selectedImage.value = "";
};

// 高级选项相关数据
const showAdvancedPicker = ref(false);
const colorMergeThreshold = ref(30);
const pixelationMode = ref("dominant");
const showBoard = ref(false);
const showColorCode = ref(true);
const showModePicker = ref(false);

const modeOptions = [
  { id: "dominant", name: "卡通" },
  { id: "average", name: "图像" }
];

const modeIndex = computed(() => {
  return modeOptions.findIndex(m => m.id === pixelationMode.value);
});

const getModeName = (modeId) => {
  const mode = modeOptions.find(m => m.id === modeId);
  return mode ? mode.name : "未知";
};

const onMergeThresholdChange = (e) => {
  colorMergeThreshold.value = e.detail.value;
};

const onMergeThresholdInput = () => {
  colorMergeThreshold.value = Math.max(0, Math.min(100, parseInt(colorMergeThreshold.value) || 30));
};

const onModeChange = (id) => {
  pixelationMode.value = id;
};

const onShowBoardChange = (e) => {
  showBoard.value = e.detail.value;
};

const onShowColorCodeChange = (e) => {
  showColorCode.value = e.detail.value;
};

const showAdvancedOptions = () => {
  showAdvancedPicker.value = !showAdvancedPicker.value;
};

const startGenerate = () => {
  if (!selectedImage.value) {
    uni.showToast({
      title: "请先选择图片",
      icon: "none",
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/generate/generate?image=${encodeURIComponent(
      JSON.stringify(selectedImage.value)
    )}&brand=${selectedBrand.value}&gridWidth=${gridWidth.value}&gridHeight=${gridHeight.value
      }&pixelationMode=${pixelationMode.value}&colorMergeThreshold=${colorMergeThreshold.value
      }&showBoard=${showBoard.value}&showColorCode=${showColorCode.value}`,
  });
};
</script>

<style lang="scss" scoped>
@import "@/styles/theme-modern.scss";

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  padding: var(--space-xl);
  box-sizing: border-box;
}

.section-title {
  font-size: 30rpx;
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: var(--space-md);
}

/* 上传区域 */
.upload-section {
  margin-bottom: var(--space-xl);
}

.upload-box {
  width: 100%;
  height: 400rpx;
  border: 2rpx dashed var(--border-medium);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &:active {
    border-color: var(--accent-primary);
    background: var(--accent-light);
  }
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .upload-icon {
    width: 80rpx;
    height: 80rpx;
  }

  .upload-text {
    font-size: var(--text-base);
    font-weight: 500;
    color: var(--text-muted);
    margin-top: var(--space-lg);
    display: block;
  }

  .upload-text-sub {
    font-size: var(--text-sm);
    color: var(--text-light);
    margin-top: var(--space-xs);
    display: block;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
}

.clear-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  padding: 8rpx 24rpx;
  background: var(--text-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  border: none;
}

/* 区域容器 */
.section-container {
  margin-bottom: var(--space-xl);
}

.section-header {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: var(--space-xs);
}

.section-text {
  font-size: 30rpx;
  color: var(--text-secondary);
  display: block;
}

.section-text-sub {
  font-size: var(--text-sm);
  color: var(--text-light);
  margin-bottom: var(--space-xs);
}

/* 品牌选择 */
.brand-scroll {
  white-space: nowrap;
  display: flex;
  gap: var(--space-sm);
}

.brand-tag {
  padding: var(--space-sm) var(--space-lg);
  // background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 2rpx solid var(--border-medium);
  display: inline-block;
  color: var(--text-primary);
  transition: all 0.3s ease;

  &:not(:last-child) {
    margin-right: var(--space-md);
  }

  &.active {
    background: var(--accent-light-2);
    // color: var(--accent-primary);
    border-color: transparent;
  }

  &:active {
    transform: scale(0.98);
  }

  .brand-name {
    font-size: var(--text-base);
    font-weight: 500;
  }
}

.mode-scroll {
  gap: 16rpx;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  display: grid;
}

.mode-tag {
  font-weight: 500;
  font-size: 26rpx;
  border: 2rpx solid var(--border-medium);
  border-radius: 20rpx;
  color: var(--text-tertiary);
  text-align: center;

  &.active {
    color: #ffffff;
    background: var(--text-primary);
    border-color: var(--text-primary);
  }
}

/* 版型尺寸 */
.size-panel {
  border: 2rpx solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: 40rpx;
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



.slider-input-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;

  slider {
    flex: 1;
  }

  .size-input-container {
    display: flex;
    align-items: center;
    gap: 12rpx;
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

/* 尺寸选择 */
.slider-container {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: var(--bg-secondary);
  padding: 24rpx;
  border-radius: var(--radius-md);
  border: 2rpx solid var(--border-medium);
}

slider {
  flex: 1;
}

.size-input-container {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.size-input {
  width: 100rpx;
  height: 64rpx;
  padding: 8rpx 16rpx;
  border: 2rpx solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  text-align: center;
}

.unit-text {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.size-item {
  padding: var(--space-md) 0;
  // background: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 2rpx solid var(--border-medium);
  text-align: center;

  &.active {
    background: var(--text-primary);
    color: #ffffff;
    // border: 2rpx solid var(--accent-primary);
    border-color: transparent;
  }

  &:active {
    transform: scale(0.98);
  }

  .size-text {
    font-size: var(--text-base);
    font-weight: 500;
  }
}

/* 操作按钮 */
.action-section {
  margin-top: var(--space-xl);
}

.action-btn {
  width: 100%;
  height: 88rpx;
  background: var(--text-primary);
  color: #ffffff;
  border-radius: var(--radius-md);
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: calc(env(safe-area-inset-bottom) + 200rpx);
  gap: 20rpx;
  -webkit-tap-highlight-color: transparent;
  tap-highlight-color: transparent;

  &:hover,
  &:active {
    -webkit-tap-highlight-color: transparent;
    tap-highlight-color: transparent;
  }

  .arrow-icon {
    width: 32rpx;
    height: 32rpx;
  }

  &.disabled {
    // background: var(--text-lighter);
    color: var(--text-muted);
  }

  &:active:not(.disabled) {
    background: var(--text-primary);
  }
}

/* 底部占位 */
.bottom-placeholder {
  height: 200rpx;
}

/* 高级选项 */
.advanced-section {
  margin-bottom: var(--space-xl);
  border: 2rpx solid var(--border-medium);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.advanced-header {
  padding: 28rpx 32rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  gap: 20rpx;

  .advanced-icon {
    width: 40rpx;
    height: 40rpx;
  }

  &:active {
    background: var(--bg-secondary);
  }
}

.advanced-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a2e;
}

.advanced-arrow {
  width: 32rpx;
  height: 32rpx;
  transition: transform 0.3s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.advanced-content {
  padding: 0 32rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.advanced-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.show-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.item-label {
  font-size: 28rpx;
  color: #1a1a2e;
  font-weight: 500;
  margin-bottom: 16rpx;
  display: block;
}

.setting-select {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  border-radius: 12rpx;
  border: 2rpx solid #e8e8e8;

  .select-value {
    font-size: 26rpx;
    color: #1a1a2e;
  }

  .select-arrow {
    font-size: 32rpx;
    color: #999;
  }
}

.switch-container {
  display: flex;
  align-items: center;
}

/* 品牌选择器样式复用 */
.brand-picker {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 10001;
  max-height: 60vh;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

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

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  font-size: 28rpx;
  color: #1a1a2e;
}
</style>
