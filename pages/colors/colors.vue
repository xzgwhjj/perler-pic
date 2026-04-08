<template>
  <view class="page-container">
    <!-- 品牌选择 -->
    <view class="brand-section">
      <scroll-view class="brand-scroll" scroll-x>
        <view
          v-for="brand in brands"
          :key="brand.id"
          class="brand-tab"
          :class="{ active: selectedBrand === brand.id }"
          @click="selectedBrand = brand.id"
        >
          <text class="brand-name">{{ brand.name }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 搜索 -->
    <view class="search-section">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          placeholder="搜索色号..."
          placeholder-class="placeholder"
          @input="handleSearch"
        />
      </view>
    </view>

    <!-- 色号列表 -->
    <scroll-view class="color-content" scroll-y>
      <view class="color-grid">
        <view v-for="(color, index) in filteredColors" :key="index" class="color-card">
          <view class="color-swatch" :style="{ backgroundColor: color.hex }" />
          <view class="color-info">
            <text class="color-code">{{ color.code }}</text>
            <text class="color-hex">{{ color.hex }}</text>
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 自定义TabBar -->
    <tabbar :current="2"></tabbar>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const selectedBrand = ref('mard')
const searchKeyword = ref('')
const colors = ref([])
const brands = ref([
  { id: 'mard', name: 'Mard' },
  { id: 'coco', name: 'Coco' },
  { id: 'miwo', name: '咪小窝' }
])

const filteredColors = computed(() => {
  if (!searchKeyword.value) {
    return colors.value
  }
  return colors.value.filter(color =>
    color.code.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    color.hex.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

const loadColors = () => {
  const colorData = uni.getStorageSync(`colors_${selectedBrand.value}`)
  if (colorData) {
    colors.value = colorData
  } else {
    if (selectedBrand.value === 'mard') {
      const mardColors = require('@/static/colors/mard-colors.json')
      colors.value = mardColors.colors || []
    }
  }
}

const handleSearch = (e) => {
  searchKeyword.value = e.detail.value
}

watch(selectedBrand, () => {
  loadColors()
})

onLoad(() => {
  loadColors()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme-modern.scss';

.page-container {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}

.brand-section {
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1rpx solid var(--border-light);
}

.brand-scroll {
  white-space: nowrap;
  display: flex;
  gap: var(--space-sm);
}

.brand-tab {
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);

  &.active {
    background: var(--accent-light);
    color: var(--accent-primary);
    border: 2rpx solid var(--accent-primary);
  }

  .brand-name {
    font-size: var(--text-base);
    font-weight: 500;
  }
}

.search-section {
  padding: var(--space-md) var(--space-lg);
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 0 var(--space-md);

  .search-icon {
    font-size: var(--text-lg);
    margin-right: var(--space-sm);
  }

  .search-input {
    flex: 1;
    font-size: var(--text-base);
    color: var(--text-primary);
    height: 72rpx;
  }

  .placeholder {
    color: var(--text-muted);
  }
}

.color-content {
  flex: 1;
  padding: var(--space-lg);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.color-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  overflow: hidden;

  .color-swatch {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-sm);
    margin-bottom: var(--space-sm);
    border: 1rpx solid var(--border-light);
  }

  .color-info {
    .color-code {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      display: block;
      margin-bottom: 4rpx;
    }

    .color-hex {
      font-size: var(--text-xs);
      color: var(--text-muted);
      display: block;
    }
  }
}

/* 底部占位 */
.bottom-placeholder {
  height: 200rpx;
}
</style>
