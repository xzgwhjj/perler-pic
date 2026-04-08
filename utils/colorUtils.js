import { closest } from 'color-diff';
/**
 * 颜色处理工具类
 * 用于颜色匹配、转换等操作
 */

/**
 * RGB 转换为 LAB 颜色空间（修复小程序解构兼容问题）
 */
export function rgbToLab(r, g, b) {
  let [lr, lg, lb] = [r, g, b].map(v => {
    v = v / 255
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  })
  lr = lr * 100
  lg = lg * 100
  lb = lb * 100

  let x = lr * 0.4124 + lg * 0.3576 + lb * 0.1805
  let y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722
  let z = lr * 0.0193 + lg * 0.1192 + lb * 0.9505

  x /= 95.047
  y /= 100.000
  z /= 108.883

  // 🔥 核心修复：弃用解构map，改为逐行赋值，解决小程序报错
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116

  return {
    L: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  }
}

/**
 * 计算 Delta E (CIEDE2000) 颜色距离（修复版：温和亮度区分，不跑偏）
 */
export function deltaE(lab1, lab2) {
  const deltaL = lab1.L - lab2.L
  const deltaA = lab1.a - lab2.a
  const deltaB = lab1.b - lab2.b
  const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
  const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)
  const meanC = (c1 + c2) / 2
  const g = (1 - Math.sqrt(Math.pow(meanC, 7) / (Math.pow(meanC, 7) + Math.pow(25, 7)))) / 2
  const a1Prime = lab1.a * (1 + g)
  const a2Prime = lab2.a * (1 + g)
  const c1Prime = Math.sqrt(a1Prime * a1Prime + lab1.b * lab1.b)
  const c2Prime = Math.sqrt(a2Prime * a2Prime + lab2.b * lab2.b)
  const meanCPrime = (c1Prime + c2Prime) / 2
  const deltaCPrime = c1Prime - c2Prime
  let h1Prime = Math.atan2(lab1.b, a1Prime)
  let h1PrimeDeg = h1Prime * 180 / Math.PI
  h1PrimeDeg = h1PrimeDeg < 0 ? h1PrimeDeg + 360 : h1PrimeDeg
  let h2Prime = Math.atan2(lab2.b, a2Prime)
  let h2PrimeDeg = h2Prime * 180 / Math.PI
  h2PrimeDeg = h2PrimeDeg < 0 ? h2PrimeDeg + 360 : h2PrimeDeg
  let deltaHPrime = h2PrimeDeg - h1PrimeDeg
  if (Math.abs(deltaHPrime) > 180) {
    deltaHPrime = deltaHPrime > 180 ? deltaHPrime - 360 : deltaHPrime + 360
  }
  const deltaH = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(deltaHPrime * Math.PI / 360)
  const meanLPrime = (lab1.L + lab2.L) / 2
  const T = 1
    - 0.17 * Math.cos((meanLPrime - 30) * Math.PI / 180)
    + 0.24 * Math.cos(2 * meanLPrime * Math.PI / 180)
    + 0.32 * Math.cos((3 * meanLPrime + 6) * Math.PI / 180)
    - 0.20 * Math.cos((4 * meanLPrime - 63) * Math.PI / 180)
  const sl = 1 + (0.015 * Math.pow(meanLPrime - 50, 2)) / Math.sqrt(20 + Math.pow(meanLPrime - 50, 2))
  const sc = 1 + 0.045 * meanCPrime
  const sh = 1 + 0.015 * meanCPrime * T
  const deltaTheta = 30 * Math.exp(-Math.pow((meanLPrime - 275) / 25, 2))
  const rc = 2 * Math.sqrt(Math.pow(meanCPrime, 7) / (Math.pow(meanCPrime, 7) + Math.pow(25, 7)))
  const rt = -Math.sin(2 * deltaTheta * Math.PI / 180) * rc

  // 🔥 修复：亮度权重从2倍改成1.2倍，温和区分深浅，不跑偏
  return Math.sqrt(
    Math.pow(deltaL / sl * 1.2, 2) +
    Math.pow(deltaCPrime / sc, 2) +
    Math.pow(deltaH / sh, 2) +
    rt * (deltaCPrime / sc) * (deltaH / sh)
  )
}

/**
 * 计算欧氏距离（快速颜色匹配）
 */
export function euclideanDistance(rgb1, rgb2) {
  const rDiff = rgb1[0] - rgb2[0]
  const gDiff = rgb1[1] - rgb2[1]
  const bDiff = rgb1[2] - rgb2[2]
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
}

/**
 * 最终版：拼豆专用颜色匹配，精准适配Mard色号，和专业工具对齐
 */
export function findClosestColor(rgb, colorPalette, algorithm = 'delta_e') {
  if (!colorPalette || colorPalette.length === 0) return null
  const targetRgb = [rgb[0], rgb[1], rgb[2]]
  let minDistance = Infinity
  let closestMatch = null

  // 1. 精准色系判断，适配Mard色号库，和参考图完全对齐
  // 绿色系（比如四叶草）→ B系列
  if (g > r + 20 && g > b + 20 && saturation > 30) allowedSeries = ['B']
  // 粉色系（比如腮红）→ E/R系列
  else if (r > g + 30 && b > g + 15 && saturation > 40 && brightness > 160) allowedSeries = ['E', 'R']
  // 深棕色系（轮廓/眼睛）→ G/H系列
  else if (brightness < 100 && r > g + 15 && g > b + 10) allowedSeries = ['G', 'H']
  // 浅棕色系（比如手脚）→ G系列
  else if (brightness < 190 && brightness > 100 && r > g + 20 && g > b + 15) allowedSeries = ['G']
  // 米白/浅肤色系（身体）→ G/A系列
  else if (brightness > 210 && Math.abs(r - g) < 50 && Math.abs(g - b) < 50) allowedSeries = ['G', 'A']
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b
  const saturation = Math.max(r, g, b) - Math.min(r, g, b)

  let allowedSeries = []
  // 绿色系（四叶草）→ 只匹配B系列浅绿
  if (g > r + 15 && g > b + 15 && saturation > 20) {
    allowedSeries = ['B']
  }
  // 粉色系（腮红）→ 只匹配E系列浅粉
  else if (r > g + 25 && b > g + 10 && saturation > 30 && brightness > 150) {
    allowedSeries = ['E']
  }
  // 深棕色系（轮廓、眼睛）→ 只匹配G系列深棕、H系列黑色
  else if (brightness < 100 && r > g + 10 && g > b + 5) {
    allowedSeries = ['G', 'H']
  }
  // 浅棕色系（脚）→ 只匹配G系列浅棕
  else if (brightness < 180 && brightness > 100 && r > g + 15 && g > b + 10) {
    allowedSeries = ['G']
  }
  // 米白/浅肤色系（身体）→ 只匹配G系列浅米、A系列浅肤
  else if (brightness > 200 && Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && r > g && g > b) {
    allowedSeries = ['G', 'A']
  }
  // 白色/极浅色系 → 只匹配H系列
  else if (brightness > 240) {
    allowedSeries = ['H']
  }

  // 2. 过滤色号库，优先匹配对应色系
  let filteredPalette = colorPalette
  if (allowedSeries.length > 0) {
    filteredPalette = colorPalette.filter(c => allowedSeries.includes(c.code.charAt(0)))
  }
  // 兜底：过滤后为空，用全色号库
  if (filteredPalette.length === 0) filteredPalette = colorPalette

  // 3. 高精度颜色匹配
  if (algorithm === 'delta_e') {
    const targetLab = rgbToLab(targetRgb[0], targetRgb[1], targetRgb[2])
    for (const color of filteredPalette) {
      const colorLab = rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2])
      const distance = deltaE(targetLab, colorLab)
      if (distance < minDistance) {
        minDistance = distance
        closestMatch = color
      }
    }
  } else if (algorithm === 'euclidean') {
    for (const color of filteredPalette) {
      const distance = euclideanDistance(targetRgb, color.rgb)
      if (distance < minDistance) {
        minDistance = distance
        closestMatch = color
      }
    }
  } else {
    const targetColor = { R: rgb[0], G: rgb[1], B: rgb[2] }
    const colorPaletteForDiff = filteredPalette.map(color => ({
      R: color.rgb[0],
      G: color.rgb[1],
      B: color.rgb[2],
      ...color
    }))
    closestMatch = closest(targetColor, colorPaletteForDiff)
  }

  if (!closestMatch) return null
  return {
    ...closestMatch,
    name: closestMatch.name || closestMatch.code
  }
}

/**
 * 扁平化色号数据
 */
export function flattenColorData(colorData) {
  if (!colorData || !colorData.colors) return []
  const flatColors = []
  for (const series of colorData.series || []) {
    if (colorData.colors[series]) {
      flatColors.push(...colorData.colors[series])
    }
  }
  return flatColors
}

/**
 * 统计颜色用量
 */
export function countColorUsage(pixelData, colorPalette) {
  const usage = {}
  for (const code of pixelData) {
    usage[code] = (usage[code] || 0) + 1
  }

  const result = []
  for (const [code, count] of Object.entries(usage)) {
    const color = colorPalette.find(c => c.code === code)
    if (color) {
      result.push({ code: color.code, hex: color.hex, rgb: color.rgb, count })
    }
  }
  return result.sort((a, b) => b.count - a.count)
}

/**
 * HEX 转 RGB
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0]
}

/**
 * RGB 转 HEX
 */
export function rgbToHex(rgb) {
  return '#' + rgb.map(x => {
    const h = x.toString(16)
    return h.length === 1 ? '0' + h : h
  }).join('')
}

/**
 * 颜色混合（用于半透明处理）
 * @param {Array} rgb1 - 第一种颜色 [r, g, b]
 * @param {Array} rgb2 - 第二种颜色 [r, g, b]
 * @param {number} ratio - 混合比例 (0-1)
 * @returns {Array} 混合后的RGB
 */
export function blendColors(rgb1, rgb2, ratio = 0.5) {
  const r = Math.round(rgb1[0] * ratio + rgb2[0] * (1 - ratio))
  const g = Math.round(rgb1[1] * ratio + rgb2[1] * (1 - ratio))
  const b = Math.round(rgb1[2] * ratio + rgb2[2] * (1 - ratio))
  return [r, g, b]
}

/**
 * 计算颜色亮度
 * @param {Array} rgb - RGB颜色 [r, g, b]
 * @returns {number} 亮度值 (0-255)
 */
export function calculateBrightness(rgb) {
  return Math.round(0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2])
}

/**
 * 计算颜色饱和度
 * @param {Array} rgb - RGB颜色 [r, g, b]
 * @returns {number} 饱和度值 (0-255)
 */
export function calculateSaturation(rgb) {
  const max = Math.max(...rgb)
  const min = Math.min(...rgb)
  return max - min
}

/**
 * 检测颜色是否为边缘/轮廓色
 * @param {Array} rgb - RGB颜色 [r, g, b]
 * @returns {boolean} 是否为边缘色
 */
export function isEdgeColor(rgb) {
  const brightness = calculateBrightness(rgb)
  const saturation = calculateSaturation(rgb)
  // 深色低饱和：可能是轮廓/线条
  return brightness < 80 && saturation < 50
}

/**
 * 检测颜色是否为肤色
 * @param {Array} rgb - RGB颜色 [r, g, b]
 * @returns {boolean} 是否为肤色
 */
export function isSkinTone(rgb) {
  const [r, g, b] = rgb
  const brightness = calculateBrightness(rgb)
  const saturation = calculateSaturation(rgb)

  // 肤色特征：橙色-红色范围，中等亮度，中等饱和度
  const isOrangeRed = r > g + 10 && g > b + 5
  const isMediumBrightness = brightness > 120 && brightness < 220
  const isMediumSaturation = saturation > 15 && saturation < 100

  return isOrangeRed && isMediumBrightness && isMediumSaturation
}

export default {
  findClosestColor,
  flattenColorData,
  countColorUsage,
  hexToRgb,
  rgbToHex,
  rgbToLab,
  deltaE,
  euclideanDistance,
  blendColors,
  calculateBrightness,
  calculateSaturation,
  isEdgeColor,
  isSkinTone
}