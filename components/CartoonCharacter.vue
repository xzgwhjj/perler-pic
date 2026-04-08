<template>
  <view class="cartoon-character" :class="type">
    <svg class="character-svg" viewBox="0 0 100 100">
      <!-- 身体 -->
      <ellipse 
        cx="50" cy="65" rx="25" ry="30" 
        :fill="bodyColor"
      />
      <!-- 头 -->
      <circle 
        cx="50" cy="35" r="20" 
        :fill="headColor"
      />
      <!-- 眼睛 -->
      <circle cx="42" cy="32" r="5" fill="#ffffff" />
      <circle cx="58" cy="32" r="5" fill="#ffffff" />
      <circle cx="42" cy="33" r="3" :fill="eyeColor" />
      <circle cx="58" cy="33" r="3" :fill="eyeColor" />
      <!-- 腮红 -->
      <ellipse cx="38" cy="40" rx="4" ry="2" fill="#ffb6c1" opacity="0.6" />
      <ellipse cx="62" cy="40" rx="4" ry="2" fill="#ffb6c1" opacity="0.6" />
      <!-- 嘴巴 -->
      <path 
        d="M 45 42 Q 50 47 55 42" 
        stroke="#ff6b6b" 
        stroke-width="2" 
        fill="none" 
        stroke-linecap="round"
      />
      <!-- 装饰 -->
      <circle 
        v-if="type === 'happy'" 
        cx="50" cy="18" r="6" 
        fill="#ffd93d" 
      />
      <circle 
        v-if="type === 'welcome'" 
        cx="30" cy="25" r="3" 
        fill="#93c5fd" 
      />
      <circle 
        v-if="type === 'welcome'" 
        cx="70" cy="25" r="4" 
        fill="#93c5fd" 
      />
    </svg>
  </view>
</template>

<script>
export default {
  name: 'CartoonCharacter',
  props: {
    type: {
      type: String,
      default: 'happy',
      validator: (value) => ['happy', 'welcome', 'success', 'loading'].includes(value)
    }
  },
  computed: {
    bodyColor() {
      const colors = {
        happy: '#f97316',
        welcome: '#f59e0b',
        success: '#10b981',
        loading: '#60a5fa'
      }
      return colors[this.type]
    },
    headColor() {
      const colors = {
        happy: '#fbbf24',
        welcome: '#fcd34d',
        success: '#34d399',
        loading: '#93c5fd'
      }
      return colors[this.type]
    },
    eyeColor() {
      const colors = {
        happy: '#1e3a8a',
        welcome: '#1e40af',
        success: '#064e3b',
        loading: '#1e3a8a'
      }
      return colors[this.type]
    }
  }
}
</script>

<style lang="scss" scoped>
.cartoon-character {
  width: 100rpx;
  height: 100rpx;
  
  .character-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 4rpx 6rpx rgba(0, 0, 0, 0.1));
  }
  
  &.welcome {
    .character-svg {
      animation: bounce 2s ease-in-out infinite;
    }
  }
  
  &.loading {
    .character-svg {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>