<template>
  <view class="container">
    <scroll-view class="scroll-content" scroll-y>
      <!-- 使用说明 -->
      <view class="help-card">
        <view class="card-header">
          <text class="card-title">使用说明</text>
        </view>

        <view class="step-list">
          <view class="step-item">
            <view class="step-icon">1</view>
            <view class="step-content">
              <text class="step-heading">上传图片</text>
              <text class="step-text">从相册选择或拍摄图片</text>
            </view>
          </view>

          <view class="step-item">
            <view class="step-icon">2</view>
            <view class="step-content">
              <text class="step-heading">选择色系</text>
              <text class="step-text">选择拼豆品牌色系（如 Mard）</text>
            </view>
          </view>

          <view class="step-item">
            <view class="step-icon">3</view>
            <view class="step-content">
              <text class="step-heading">设置尺寸</text>
              <text class="step-text">选择拼豆板尺寸</text>
            </view>
          </view>

          <view class="step-item">
            <view class="step-icon">4</view>
            <view class="step-content">
              <text class="step-heading">生成图纸</text>
              <text class="step-text">点击生成按钮，自动转换</text>
            </view>
          </view>

          <view class="step-item">
            <view class="step-icon">5</view>
            <view class="step-content">
              <text class="step-heading">查看统计</text>
              <text class="step-text">查看颜色使用数量</text>
            </view>
          </view>

          <view class="step-item">
            <view class="step-icon">6</view>
            <view class="step-content">
              <text class="step-heading">下载保存</text>
              <text class="step-text">下载图纸或保存项目</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 常见问题 -->
      <view class="help-card">
        <view class="card-header">
          <text class="card-title">常见问题</text>
        </view>

        <view class="faq-list">
          <view class="faq-item">
            <text class="faq-question">如何选择合适的板型尺寸？</text>
            <text class="faq-answer">根据图片的复杂度和细节选择。细节丰富的图片建议使用大尺寸板（58x58），简单的图案可以用小板（29x29）。</text>
          </view>

          <view class="faq-item">
            <text class="faq-question">转换后的颜色和原图不一致怎么办？</text>
            <text class="faq-answer">这是正常现象，因为拼豆颜色有限。可以尝试调整原图的亮度和对比度，或者选择不同色系。</text>
          </view>

          <view class="faq-item">
            <text class="faq-question">如何添加更多色系？</text>
            <text class="faq-answer">后续版本将支持更多品牌色系，敬请期待。</text>
          </view>

          <view class="faq-item">
            <text class="faq-question">历史记录会保存多久？</text>
            <text class="faq-answer">历史记录保存在本地存储中，最多保存 20 条，清除缓存会丢失数据。</text>
          </view>
        </view>
      </view>

      <!-- 关于我们 -->
      <view class="help-card">
        <view class="card-header">
          <text class="card-title">关于我们</text>
        </view>

        <view class="about-info">
          <view class="about-item">
            <text class="about-label">应用名称</text>
            <text class="about-value">拼豆图纸转换</text>
          </view>
          <view class="about-item">
            <text class="about-label">当前版本</text>
            <text class="about-value">1.0.0</text>
          </view>
          <view class="about-item">
            <text class="about-label">开发框架</text>
            <text class="about-value">uniapp</text>
          </view>
          <view class="about-desc">
            轻松制作专属拼豆作品
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="placeholder"></view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #fafafa;
}

.scroll-content {
  padding: 30rpx;
  padding-bottom: 40rpx;
}

.help-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.card-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333333;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.step-item {
  display: flex;
  align-items: flex-start;
}

.step-icon {
  width: 52rpx;
  height: 52rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.step-heading {
  font-size: 26rpx;
  font-weight: 500;
  color: #333333;
}

.step-text {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.6;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.faq-item {
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.faq-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.faq-question {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
  color: #333333;
  margin-bottom: 10rpx;
}

.faq-answer {
  display: block;
  font-size: 24rpx;
  color: #666666;
  line-height: 1.6;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.about-item:last-child {
  border-bottom: none;
}

.about-label {
  font-size: 26rpx;
  color: #999999;
}

.about-value {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
}

.about-desc {
  text-align: center;
  padding: 30rpx 0;
  font-size: 24rpx;
  color: #999999;
}

.placeholder {
  height: 20rpx;
}
</style>
