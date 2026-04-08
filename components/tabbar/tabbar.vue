<template>
  <view class="custom-tabbar-container">
    <view class="custom-tabbar">
      <view
        v-for="(item, index) in tabList"
        :key="index"
        class="tab-item"
        :class="{ active: currentIndex === index }"
        @click="switchTab(index)"
      >
        <view class="tab-icon">
          <image :src="item.icon" class="icon-image" />
          <view class="icon-circle"></view>
        </view>
        <text class="tab-text">{{ item.text }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  current: {
    type: Number,
    default: 0
  }
})

const currentIndex = ref(props.current)

const tabList = [
  {
    icon: '/static/svg/home_icon.svg',
    text: '首页',
    path: '/pages/index/index'
  },
  {
    icon: '/static/svg/design_icon.svg',
    text: '设计',
    path: '/pages/design/design'
  },
  {
    icon: '/static/svg/colors_icon.svg',
    text: '色号',
    path: '/pages/colors/colors'
  },
  {
    icon: '/static/svg/profile_icon.svg',
    text: '我的',
    path: '/pages/mine/mine'
  }
]

watch(() => props.current, (newVal) => {
  currentIndex.value = newVal
})

const switchTab = (index) => {
  if (currentIndex.value === index) return

  currentIndex.value = index
  uni.switchTab({
    url: tabList[index].path
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/theme-modern.scss';

.custom-tabbar-container {
  // width: 100%;
  // height: 100rpx;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background: transparent;
  display: flex;
  justify-content: center;
  z-index: 999;
}

.custom-tabbar {
  width: 90%;
  max-width: 600rpx;
  margin: 20rpx 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16rpx 24rpx;

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12rpx 8rpx;
    border-radius: 24rpx;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    .tab-icon {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-bottom: 8rpx;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      
      .icon-image {
        width: 50rpx;
        height: 50rpx;
        transition: all 0.3s ease;
      }

      .icon-circle{
        position: absolute;
        bottom: 0rpx;
        right: 4rpx;
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        background: var(--accent-light-3);
        transition: all 0.3s ease;
        opacity: 0.5;
      }
    }

    .tab-text {
      font-size: 22rpx;
      color: var(--text-secondary);
      font-weight: 500;
      transition: all 0.3s ease;
    }

    &.active {
      .tab-icon {
        // background: var(--accent-light);

        .icon-image {
          transform: scale(1.1);
        }
        
        .icon-circle {
          width: 20rpx;
          height: 30rpx;
          border-radius: 24rpx;
          bottom: 6rpx;
          right: 50%;
          transform: translate(50%, 0);
          background: var(--accent-primary);
        }
      }

      .tab-text {
        color: var(--accent-primary);
        font-weight: 600;
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
