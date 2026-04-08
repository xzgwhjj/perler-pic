<template>
  <view class="svg-icon" :style="iconStyle">
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        :d="path"
        :stroke="color"
        :stroke-width="strokeWidth"
        :fill="fill || 'none'"
        :stroke-linecap="strokeLinecap"
        :stroke-linejoin="strokeLinejoin"
      />
    </svg>
  </view>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    color: {
      type: String,
      default: '#4ecdc4'
    },
    strokeWidth: {
      type: [Number, String],
      default: 1.5
    },
    fill: {
      type: String,
      default: 'none'
    },
    strokeLinecap: {
      type: String,
      default: 'round'
    },
    strokeLinejoin: {
      type: String,
      default: 'round'
    }
  },
  computed: {
    path() {
      const icons = {
        // 相机图标
        camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',

        // 魔棒图标
        wand: 'M21 12L7 26 M3 22l4-4 M18 10l4 4 M14.5 6.5l3 3 M9 5l2 2 M5 2l2 2 M21.5 2.5l-2 2',

        // 历史图标
        history: 'M12 8v4l3 3 M21 12a9 9 0 1 1-6.219-8.56 M12 3a9 9 0 0 1 0 18',

        // 调色板图标
        palette: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z',

        // 生成图标
        sparkles: 'M12 2L14 10l8 2-8 2-2 8-2-8-8-2 8-2z M20 20l-2-2-2 2 2 2z M5 8l-2-2-2 2 2 2z',

        // 图片图标
        image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z M8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',

        // 下载图标
        download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',

        // 保存图标
        save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M12 3v10h10 M12 10h10',

        // 刷新图标
        refresh: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',

        // 删除图标
        delete: 'M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M10 11v6 M14 11v6',

        // 查看图标
        eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',

        // 搜索图标
        search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',

        // 文档图标
        document: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',

        // 帮助图标
        help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',

        // 花朵图标
        flower: 'M12 7.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z M12 12V4 M12 12l6.5 2.5 M12 12l-6.5 2.5 M12 12l2.5 6.5 M12 12l-2.5 6.5 M12 7.5L8 5 M12 7.5L16 5',

        // 叶子图标
        leaf: 'M2 22s7.5-2 12-12c4-9 4-9 4-9s4 0 4 9c0 10-7.5 12-7.5 12H2z',

        // 太阳图标
        sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',

        // 云朵图标
        cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',

        // 箭头图标
        arrowRight: 'M5 12h14 M12 5l7 7-7 7',
        arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
        arrowDown: 'M12 19V5 M5 12l7 7 7-7',
        arrowUp: 'M12 5v14 M19 12l-7-7-7 7',

        // 关闭图标
        close: 'M18 6L6 18 M6 6l12 12',

        // 检查图标
        check: 'M20 6L9 17l-5-5',

        // 设置图标
        settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',

        // 网格图标
        grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z'
      }
      return icons[this.name] || ''
    },
    iconStyle() {
      return {
        width: `${this.size}px`,
        height: `${this.size}px`
      }
    }
  }
}
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
