<template>
  <view class="container">
    <!-- 操作栏：尺寸选择 + 上传 + 导出 -->
    <view class="tool-bar">
      <picker @change="onSizeChange" :value="sizeIndex" :range="sizeList">
        <view class="picker-btn">尺寸：{{ sizeList[sizeIndex] }}</view>
      </picker>
      <button @click="uploadImage" type="primary" size="mini">上传图片</button>
      <button @click="exportPattern" type="default" size="mini">导出图纸</button>
    </view>

    <!-- 原图预览 -->
    <view class="preview-box" v-if="imageSrc">
      <image :src="imageSrc" mode="widthFix" class="origin-img"></image>
    </view>

    <!-- 拼豆图纸Canvas（核心） -->
    <canvas
      type="2d"
      id="beadCanvas"
      class="canvas"
      ref="canvasRef"
    ></canvas>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// ===================== 1. 基础配置 =====================
// 拼豆标准尺寸（通用：小拼豆15/20/30，大拼豆10/15）
const sizeList = ref(['15x15', '20x20', '30x30'])
const sizeIndex = ref(1) // 默认20x20
const gridSize = ref(20) // 网格像素数
const cellSize = ref(25) // 每个拼豆格子大小（px）

// 画布实例
const canvasRef = ref(null)
let ctx = null // Canvas 2D上下文
const imageSrc = ref('') // 上传的图片
const patternData = ref([]) // 拼豆图纸数据（色号+坐标）

// ===================== 2. 拼豆标准色卡（精准核心！） =====================
// MARD拼豆 基础标准色（RGB+色号，可自行扩展）
const BEAD_COLORS = [
  { name: '白色', code: 'W1', rgb: [255,255,255] },
  { name: '黑色', code: 'B1', rgb: [0,0,0] },
  { name: '红色', code: 'R1', rgb: [255,0,0] },
  { name: '蓝色', code: 'Bl1', rgb: [0,0,255] },
  { name: '黄色', code: 'Y1', rgb: [255,255,0] },
  { name: '绿色', code: 'G1', rgb: [0,255,0] },
  { name: '粉色', code: 'P1', rgb: [255,192,203] },
  { name: '灰色', code: 'Gr1', rgb: [128,128,128] },
]

// ===================== 3. 初始化Canvas =====================
onMounted(async () => {
  await initCanvas()
})

// 初始化画布上下文
const initCanvas = async () => {
  const query = uni.createSelectorQuery().in(getCurrentInstance())
  query.select('#beadCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      const canvas = res[0].node
      ctx = canvas.getContext('2d')
      // 设置画布实际尺寸（高清渲染）
      canvas.width = gridSize.value * cellSize.value + 40 // 留边距
      canvas.height = gridSize.value * cellSize.value + 40
    })
}

// ===================== 4. 核心功能 =====================
// 切换拼豆尺寸
const onSizeChange = (e) => {
  sizeIndex.value = e.detail.value
  gridSize.value = parseInt(sizeList.value[e.detail.value])
  initCanvas() // 重置画布
  if (imageSrc.value) drawBeadPattern() // 重新渲染
}

// 上传图片
const uploadImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      imageSrc.value = res.tempFilePaths[0]
      drawBeadPattern() // 生成图纸
    }
  })
}

// 绘制拼豆图纸（核心渲染逻辑）
const drawBeadPattern = () => {
  if (!ctx || !imageSrc.value) return

  // 1. 加载图片
  const img = new Image()
  img.src = imageSrc.value
  img.onload = () => {
    // 2. 图片缩放到拼豆尺寸（最近邻插值 → 无模糊，像素精准）
    ctx.imageSmoothingEnabled = false // 关键！关闭抗锯齿，保证硬边像素
    ctx.drawImage(img, 20, 20, gridSize.value, gridSize.value)

    // 3. 提取像素数据 + 匹配拼豆标准色
    const imageData = ctx.getImageData(20, 20, gridSize.value, gridSize.value)
    const pixels = imageData.data
    patternData.value = []

    // 清空画布，重新绘制标准图纸
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    drawGrid() // 绘制网格

    // 遍历每个像素，生成拼豆格子
    for (let y = 0; y < gridSize.value; y++) {
      for (let x = 0; x < gridSize.value; x++) {
        const idx = (y * gridSize.value + x) * 4
        const r = pixels[idx]
        const g = pixels[idx + 1]
        const b = pixels[idx + 2]
        const a = pixels[idx + 3]

        // 跳过透明像素
        if (a < 10) continue

        // 匹配最接近的拼豆标准色
        const beadColor = matchBeadColor(r, g, b)
        patternData.value.push({ x, y, ...beadColor })

        // 绘制拼豆格子
        drawCell(x, y, beadColor.rgb)
        // 标注色号（小尺寸隐藏，避免拥挤）
        if (gridSize.value <= 20) drawCellText(x, y, beadColor.code)
      }
    }
    // 绘制坐标
    drawCoordinate()
  }
}

// 绘制网格（标准拼豆图纸网格）
const drawGrid = () => {
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 1
  for (let i = 0; i <= gridSize.value; i++) {
    // 横线
    ctx.beginPath()
    ctx.moveTo(20, 20 + i * cellSize.value)
    ctx.lineTo(20 + gridSize.value * cellSize.value, 20 + i * cellSize.value)
    ctx.stroke()
    // 竖线
    ctx.beginPath()
    ctx.moveTo(20 + i * cellSize.value, 20)
    ctx.lineTo(20 + i * cellSize.value, 20 + gridSize.value * cellSize.value)
    ctx.stroke()
  }
}

// 绘制单个拼豆格子
const drawCell = (x, y, rgb) => {
  const px = 20 + x * cellSize.value
  const py = 20 + y * cellSize.value
  ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
  ctx.fillRect(px + 1, py + 1, cellSize.value - 2, cellSize.value - 2)
}

// 绘制格子色号
const drawCellText = (x, y, text) => {
  const px = 20 + x * cellSize.value + cellSize.value / 2
  const py = 20 + y * cellSize.value + cellSize.value / 2
  ctx.fillStyle = '#000'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, px, py)
}

// 绘制坐标（横纵数字）
const drawCoordinate = () => {
  ctx.fillStyle = '#333'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  // 横向坐标
  for (let x = 0; x < gridSize.value; x++) {
    const px = 20 + x * cellSize.value + cellSize.value / 2
    ctx.fillText(x + 1, px, 10)
  }
  // 纵向坐标
  for (let y = 0; y < gridSize.value; y++) {
    const py = 20 + y * cellSize.value + cellSize.value / 2
    ctx.fillText(y + 1, 5, py)
  }
}

// 颜色匹配算法（RGB欧氏距离 → 精准匹配拼豆色）
const matchBeadColor = (r, g, b) => {
  let minDistance = Infinity
  let matchColor = BEAD_COLORS[0]

  for (const color of BEAD_COLORS) {
    const dr = r - color.rgb[0]
    const dg = g - color.rgb[1]
    const db = b - color.rgb[2]
    // 计算RGB距离（越小越接近）
    const distance = dr * dr + dg * dg + db * db

    if (distance < minDistance) {
      minDistance = distance
      matchColor = color
    }
  }
  return matchColor
}

// 导出图纸（保存到相册）
const exportPattern = () => {
  if (!ctx) return
  uni.canvasToTempFilePath({
    canvasId: 'beadCanvas',
    success: (res) => {
      saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => showToast({ title: '保存成功' }),
        fail: () => showToast({ title: '保存失败', icon: 'error' })
      })
    }
  })
}
</script>

<style scoped>
.container {
  padding: 20rpx;
}
.tool-bar {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}
.picker-btn {
  padding: 10rpx 20rpx;
  border: 1rpx solid #ccc;
  border-radius: 8rpx;
}
.preview-box {
  margin-bottom: 30rpx;
}
.origin-img {
  width: 300rpx;
}
.canvas {
  width: 100%;
  height: auto;
  border: 1rpx solid #eee;
}
</style>