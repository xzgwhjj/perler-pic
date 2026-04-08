/**
 * Perler-Beads 风格拼豆转换核心
 * 基于 perler-beads 项目的算法重写
 * 支持：卡通（主色）和真实（平均色）两种模式
 */

import { rgbToLab, deltaE } from '@/utils/colorUtils.js'

// 像素化模式
export const PixelationMode = {
  Dominant: 'dominant', // 卡通模式（主色）
  Average: 'average'    // 真实模式（平均色）
}

// RGB颜色接口
export class RgbColor {
  constructor(r, g, b) {
    this.r = r
    this.g = g
    this.b = b
  }
}

// 调色板颜色
export class PaletteColor {
  constructor(key, hex, rgb) {
    this.key = key
    this.hex = hex
    this.rgb = rgb
  }
}

// 映射像素
export class MappedPixel {
  constructor(key, color, isExternal = false) {
    this.key = key
    this.color = color
    this.isExternal = isExternal
  }
}

// Hex转RGB
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? new RgbColor(
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ) : null
}

// 计算颜色距离（简化版，使用欧几里得距离）
export function colorDistance(rgb1, rgb2) {
  const dr = rgb1.r - rgb2.r
  const dg = rgb1.g - rgb2.g
  const db = rgb1.b - rgb2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

// 查找最接近的调色板颜色
export function findClosestPaletteColor(targetRgb, palette) {
  if (!palette || palette.length === 0) {
    console.error("Palette is empty or invalid!")
    return new PaletteColor('ERR', '#000000', new RgbColor(0, 0, 0))
  }

  let minDistance = Infinity
  let closestColor = palette[0]

  for (const paletteColor of palette) {
    const distance = colorDistance(targetRgb, paletteColor.rgb)
    if (distance < minDistance) {
      minDistance = distance
      closestColor = paletteColor
    }
    if (distance === 0) break // 完全匹配，提前退出
  }
  return closestColor
}

// 透明的颜色数据
export const transparentColorData = {
  key: 'TRANSPARENT',
  color: 'rgba(0,0,0,0)',
  isExternal: true
}

// 计算单元格代表色（根据模式）
function calculateCellRepresentativeColor(
  imageData,
  startX,
  startY,
  width,
  height,
  mode
) {
  const data = imageData.data
  const imgWidth = imageData.width
  let rSum = 0, gSum = 0, bSum = 0
  let pixelCount = 0
  const colorCountsInCell = {}
  let dominantColorRgb = null
  let maxCount = 0

  const endX = startX + width
  const endY = startY + height

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * imgWidth + x) * 4
      // 检查 alpha 通道，忽略完全透明的像素
      if (data[index + 3] < 128) continue

      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]

      pixelCount++

      if (mode === PixelationMode.Average) {
        rSum += r
        gSum += g
        bSum += b
      } else { // Dominant mode
        const colorKey = `${r},${g},${b}`
        colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1
        if (colorCountsInCell[colorKey] > maxCount) {
          maxCount = colorCountsInCell[colorKey]
          dominantColorRgb = new RgbColor(r, g, b)
        }
      }
    }
  }

  if (pixelCount === 0) {
    return null // 区域内没有不透明像素
  }

  if (mode === PixelationMode.Average) {
    return new RgbColor(
      Math.round(rSum / pixelCount),
      Math.round(gSum / pixelCount),
      Math.round(bSum / pixelCount)
    )
  } else { // Dominant mode
    return dominantColorRgb
  }
}

// 计算像素化网格数据
export function calculatePixelGrid(
  originalCtx,
  imgWidth,
  imgHeight,
  N, // 横向网格数量
  M, // 纵向网格数量
  palette,
  mode,
  fallbackColor
) {
  const mappedData = Array(M).fill(null).map(() => 
    Array(N).fill(new MappedPixel(fallbackColor.key, fallbackColor.hex))
  )
  
  const cellWidthOriginal = imgWidth / N
  const cellHeightOriginal = imgHeight / M

  let fullImageData = null
  try {
    fullImageData = originalCtx.getImageData(0, 0, imgWidth, imgHeight)
  } catch (e) {
    console.error("Failed to get full image data:", e)
    return mappedData
  }

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const startXOriginal = Math.floor(i * cellWidthOriginal)
      const startYOriginal = Math.floor(j * cellHeightOriginal)
      // 计算精确的单元格结束位置，避免超出图像边界
      const endXOriginal = Math.min(imgWidth, Math.ceil((i + 1) * cellWidthOriginal))
      const endYOriginal = Math.min(imgHeight, Math.ceil((j + 1) * cellHeightOriginal))
      // 计算实际的单元格宽高
      const currentCellWidth = Math.max(1, endXOriginal - startXOriginal)
      const currentCellHeight = Math.max(1, endYOriginal - startYOriginal)

      // 计算代表色
      const representativeRgb = calculateCellRepresentativeColor(
        fullImageData,
        startXOriginal,
        startYOriginal,
        currentCellWidth,
        currentCellHeight,
        mode
      )

      let finalCellColorData
      if (representativeRgb) {
        const closestBead = findClosestPaletteColor(representativeRgb, palette)
        finalCellColorData = new MappedPixel(closestBead.key, closestBead.hex)
      } else {
        // 如果单元格为空或全透明，标记为透明/外部
        finalCellColorData = { ...transparentColorData }
      }
      mappedData[j][i] = finalCellColorData
    }
  }
  
  return mappedData
}

// 颜色合并（基于相似度阈值）
export function mergeSimilarColors(colorCounts, threshold = 30) {
  const colors = Object.entries(colorCounts).map(([key, data]) => ({
    key,
    hex: data.color,
    rgb: hexToRgb(data.color),
    count: data.count
  })).filter(c => c.rgb)

  if (colors.length === 0) return colorCounts

  // 按数量排序（从多到少）
  colors.sort((a, b) => b.count - a.count)

  const merged = {}
  const used = new Set()

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue

    const baseColor = colors[i]
    const group = [baseColor]
    used.add(i)

    // 查找相似颜色
    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue

      const compareColor = colors[j]
      const distance = colorDistance(baseColor.rgb, compareColor.rgb)

      if (distance < threshold) {
        group.push(compareColor)
        used.add(j)
      }
    }

    // 使用组内数量最多的颜色作为代表
    group.sort((a, b) => b.count - a.count)
    const representative = group[0]

    // 合并数量
    const totalCount = group.reduce((sum, c) => sum + c.count, 0)

    merged[representative.key] = {
      color: representative.hex,
      count: totalCount
    }
  }

  return merged
}

// 统计颜色使用数量
export function countColors(mappedData) {
  const colorCounts = {}
  let totalBeads = 0

  for (const row of mappedData) {
    for (const pixel of row) {
      if (!pixel.isExternal && pixel.key !== 'TRANSPARENT') {
        if (!colorCounts[pixel.key]) {
          colorCounts[pixel.key] = {
            color: pixel.color,
            count: 0
          }
        }
        colorCounts[pixel.key].count++
        totalBeads++
      }
    }
  }

  return { colorCounts, totalBeads }
}

// 主转换函数
export async function convertToPerlerStyle(
  imageData,
  colorPalette,
  options = {}
) {
  const {
    N = 50, // 横向网格数量
    M = 50, // 纵向网格数量
    mode = PixelationMode.Dominant,
    mergeThreshold = 30,
    canvas = null
  } = options

  // 创建 canvas 和 context
  const canvasEl = canvas || document.createElement('canvas')
  const ctx = canvasEl.getContext('2d')
  
  canvasEl.width = imageData.width
  canvasEl.height = imageData.height
  
  ctx.putImageData(imageData, 0, 0)

  // 准备调色板
  const palette = colorPalette.map(c => {
    const rgb = Array.isArray(c.rgb) 
      ? new RgbColor(c.rgb[0], c.rgb[1], c.rgb[2])
      : new RgbColor(c.rgb.r, c.rgb.g, c.rgb.b)
    
    return new PaletteColor(c.code || c.key, c.hex, rgb)
  })

  // 计算像素网格
  const mappedData = calculatePixelGrid(
    ctx,
    imageData.width,
    imageData.height,
    N,
    M,
    palette,
    mode,
    palette[0]
  )

  // 统计颜色
  const { colorCounts, totalBeads } = countColors(mappedData)

  // 合并相似颜色
  const mergedColorCounts = mergeThreshold > 0 
    ? mergeSimilarColors(colorCounts, mergeThreshold)
    : colorCounts

  return {
    mappedData,
    colorCounts: mergedColorCounts,
    totalBeads,
    gridSize: { N, M }
  }
}

export default {
  PixelationMode,
  RgbColor,
  PaletteColor,
  MappedPixel,
  hexToRgb,
  colorDistance,
  findClosestPaletteColor,
  calculatePixelGrid,
  mergeSimilarColors,
  countColors,
  convertToPerlerStyle
}
