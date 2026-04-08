<template>
  <view class="page-container">
    <scroll-view class="main-content" scroll-y>
      <!-- 用户信息卡片 -->
      <view class="user-section">
        <view v-if="userInfo" class="user-card card">
          <view class="user-avatar">
            <text class="avatar-text">{{ userInfo.nickName ? userInfo.nickName[0] : '我' }}</text>
          </view>
          <view class="user-info">
            <text class="user-name">{{ userInfo.nickName || '未登录' }}</text>
            <text class="user-id">ID: {{ userInfo.userId || '----' }}</text>
          </view>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </view>
        <button v-else class="login-card card" @click="handleLogin">
          <text class="login-text">微信登录</text>
        </button>
      </view>

      <!-- 统计数据 -->
      <view v-if="userInfo" class="stats-section">
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-value">{{ stats.total }}</text>
            <text class="stat-label">转换</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.saved }}</text>
            <text class="stat-label">保存</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.days }}</text>
            <text class="stat-label">天数</text>
          </view>
        </view>
      </view>

      <!-- 功能列表 -->
      <view class="function-section">
        <view class="function-list">
          <view class="list-item card" @click="handleFollow">
            <view class="item-left">
              <text class="item-icon">♡</text>
              <text class="item-title">关注公众号</text>
            </view>
            <text class="item-arrow">→</text>
          </view>

          <view class="list-item card" @click="navigateTo('favorites')">
            <view class="item-left">
              <text class="item-icon">⭐</text>
              <text class="item-title">我的收藏</text>
            </view>
            <text class="item-arrow">→</text>
          </view>

          <view class="list-item card" @click="navigateTo('settings')">
            <view class="item-left">
              <text class="item-icon">⚙️</text>
              <text class="item-title">设置</text>
            </view>
            <text class="item-arrow">→</text>
          </view>

          <view class="list-item card" @click="navigateTo('about')">
            <view class="item-left">
              <text class="item-icon">ℹ️</text>
              <text class="item-title">关于</text>
            </view>
            <text class="item-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- 版本信息 -->
      <view class="version-section">
        <text class="version-text">拼豆转换器 v1.0.0</text>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </scroll-view>

    <!-- 自定义TabBar -->
    <tabbar :current="3"></tabbar>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const userInfo = ref(null)
const stats = ref({
  total: 0,
  saved: 0,
  days: 1
})

const loadUserInfo = () => {
  const userData = uni.getStorageSync('userInfo')
  if (userData) {
    userInfo.value = userData
    loadStats()
  }
}

const loadStats = () => {
  const statsData = uni.getStorageSync('userStats')
  if (statsData) {
    stats.value = statsData
  }
}

const handleLogin = async () => {
  try {
    const loginRes = await uni.login({
      provider: 'weixin'
    })

    userInfo.value = {
      nickName: '用户' + Math.floor(Math.random() * 10000),
      userId: Math.floor(Math.random() * 1000000)
    }

    uni.setStorageSync('userInfo', userInfo.value)

    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    initStats()
  } catch (error) {
    uni.showToast({
      title: '登录失败',
      icon: 'none'
    })
  }
}

const initStats = () => {
  const statsData = {
    total: 0,
    saved: 0,
    days: 1
  }
  uni.setStorageSync('userStats', statsData)
  stats.value = statsData
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('userInfo')
        userInfo.value = null
        uni.showToast({
          title: '已退出',
          icon: 'success'
        })
      }
    }
  })
}

const handleFollow = () => {
  uni.showToast({
    title: '关注功能开发中',
    icon: 'none'
  })
}

const navigateTo = (page) => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

onLoad(() => {
  loadUserInfo()
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

.main-content {
  flex: 1;
  padding: var(--space-lg);
}

.user-section {
  margin-bottom: var(--space-xl);
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);

  .user-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background: var(--accent-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .avatar-text {
      font-size: 40rpx;
      color: white;
      font-weight: 600;
    }
  }

  .user-info {
    flex: 1;

    .user-name {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
      display: block;
      margin-bottom: 4rpx;
    }

    .user-id {
      font-size: var(--text-sm);
      color: var(--text-muted);
      display: block;
    }
  }

  .logout-btn {
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    border: none;
  }
}

.login-card {
  width: 100%;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);

  .login-text {
    font-size: var(--text-lg);
    color: white;
    font-weight: 600;
  }
}

.stats-section {
  margin-bottom: var(--space-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.stat-item {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;

  .stat-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--accent-primary);
    display: block;
    margin-bottom: var(--space-xs);
  }

  .stat-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
    display: block;
  }
}

.function-section {
  margin-bottom: var(--space-xl);
}

.function-list {
  .list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-lg);
    margin-bottom: var(--space-sm);

    &:last-child {
      margin-bottom: 0;
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: var(--space-md);

      .item-icon {
        font-size: var(--text-xl);
      }

      .item-title {
        font-size: var(--text-base);
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .item-arrow {
      font-size: 32rpx;
      color: var(--text-muted);
      font-weight: 300;
    }
  }
}

.version-section {
  text-align: center;
  padding: var(--space-xl) 0;

  .version-text {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
}

/* 底部占位 */
.bottom-placeholder {
  height: 200rpx;
}
</style>
