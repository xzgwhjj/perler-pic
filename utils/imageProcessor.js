/**
 * 图像预处理工具类 - 专业级拼豆转换
 * 提供降噪、锐化、对比度调整等功能
 */

/**
 * 创建兼容的图像数据对象
 * @param {Uint8ClampedArray} data - 像素数据
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {object} 图像数据对象
 */
export function createImageData(data, width, height) {
  return {
    data: data,
    width: width,
    height: height
  }
}

/**
 * 双边滤波降噪（保留边缘）
 * @param {object} imageData - 输入图像数据
 * @param {number} diameter - 滤波直径
 * @param {number} sigmaColor - 颜色空间标准差
 * @param {number} sigmaSpace - 坐标空间标准差
 * @returns {object} 降噪后的图像数据
 */
export function bilateralFilter(imageData, diameter = 3, sigmaColor = 25, sigmaSpace = 25) {
  const { data, width, height } = imageData
  const output = new Uint8ClampedArray(data)
  const radius = Math.floor(diameter / 2)
  
  // 高斯权重查找表
  const gaussian = (x, sigma) => Math.exp(-(x * x) / (2 * sigma * sigma))
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4
      
      let sumR = 0, sumG = 0, sumB = 0
      let weightSum = 0
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy
          const nidx = (ny * width + nx) * 4
          
          // 颜色差异
          const colorDist = Math.sqrt(
            Math.pow(data[idx] - data[nidx], 2) +
            Math.pow(data[idx + 1] - data[nidx + 1], 2) +
            Math.pow(data[idx + 2] - data[nidx + 2], 2)
          )
          
          // 空间距离
          const spaceDist = Math.sqrt(dx * dx + dy * dy)
          
          // 权重
          const weight = gaussian(colorDist, sigmaColor) * gaussian(spaceDist, sigmaSpace)
          
          sumR += data[nidx] * weight
          sumG += data[nidx + 1] * weight
          sumB += data[nidx + 2] * weight
          weightSum += weight
        }
      }
      
      if (weightSum > 0) {
        output[idx] = Math.round(sumR / weightSum)
        output[idx + 1] = Math.round(sumG / weightSum)
        output[idx + 2] = Math.round(sumB / weightSum)
      }
    }
  }
  
  return createImageData(output, width, height)
}

/**
 * USM锐化（Unsharp Mask）
 * @param {object} imageData - 输入图像数据
 * @param {number} amount - 锐化强度 (1-5)
 * @param {number} radius - 半径
 * @param {number} threshold - 阈值
 * @returns {object} 锐化后的图像数据
 */
export function unsharpMask(imageData, amount = 1.5, radius = 1, threshold = 0) {
  const { data, width, height } = imageData
  const output = new Uint8ClampedArray(data)
  
  // 创建模糊版本
  const blurred = new Uint8ClampedArray(data)
  const r = Math.ceil(radius)
  const size = r * 2 + 1
  
  // 简单均值模糊
  for (let y = r; y < height - r; y++) {
    for (let x = r; x < width - r; x++) {
      const idx = (y * width + x) * 4
      
      let sumR = 0, sumG = 0, sumB = 0
      
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nidx = ((y + dy) * width + (x + dx)) * 4
          sumR += data[nidx]
          sumG += data[nidx + 1]
          sumB += data[nidx + 2]
        }
      }
      
      const total = size * size
      blurred[idx] = sumR / total
      blurred[idx + 1] = sumG / total
      blurred[idx + 2] = sumB / total
    }
  }
  
  // 锐化
  for (let i = 0; i < data.length; i += 4) {
    const diffR = data[i] - blurred[i]
    const diffG = data[i + 1] - blurred[i + 1]
    const diffB = data[i + 2] - blurred[i + 2]
    
    if (Math.abs(diffR) > threshold) {
      output[i] = Math.min(255, Math.max(0, data[i] + diffR * amount))
    }
    if (Math.abs(diffG) > threshold) {
      output[i + 1] = Math.min(255, Math.max(0, data[i + 1] + diffG * amount))
    }
    if (Math.abs(diffB) > threshold) {
      output[i + 2] = Math.min(255, Math.max(0, data[i + 2] + diffB * amount))
    }
  }
  
  return createImageData(output, width, height)
}

/**
 * 调整对比度
 * @param {object} imageData - 输入图像数据
 * @param {number} contrast - 对比度值 (-100 to 100)
 * @returns {object} 调整后的图像数据
 */
export function adjustContrast(imageData, contrast = 0) {
  const { data } = imageData
  const output = new Uint8ClampedArray(data)
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  
  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(factor * (data[i] - 128) + 128)
    output[i + 1] = clamp(factor * (data[i + 1] - 128) + 128)
    output[i + 2] = clamp(factor * (data[i + 2] - 128) + 128)
    output[i + 3] = data[i + 3]
  }
  
  return createImageData(output, imageData.width, imageData.height)
}

/**
 * 调整亮度
 * @param {object} imageData - 输入图像数据
 * @param {number} brightness - 亮度值 (-100 to 100)
 * @returns {object} 调整后的图像数据
 */
export function adjustBrightness(imageData, brightness = 0) {
  const { data } = imageData
  const output = new Uint8ClampedArray(data)
  
  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(data[i] + brightness)
    output[i + 1] = clamp(data[i + 1] + brightness)
    output[i + 2] = clamp(data[i + 2] + brightness)
    output[i + 3] = data[i + 3]
  }
  
  return createImageData(output, imageData.width, imageData.height)
}

/**
 * 灰度转换（用于边缘检测）
 * @param {object} imageData - 输入图像数据
 * @returns {Uint8Array} 灰度数据
 */
export function convertToGrayscale(imageData) {
  const { data, width, height } = imageData
  const gray = new Uint8Array(width * height)
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    gray[i] = Math.round(
      data[idx] * 0.299 + 
      data[idx + 1] * 0.587 + 
      data[idx + 2] * 0.114
    )
  }
  
  return gray
}

/**
 * Sobel 边缘检测
 * @param {object} imageData - 输入图像数据
 * @returns {Uint8Array} 边缘强度图
 */
export function detectEdges(imageData, threshold = 50) {
  const { width, height } = imageData
  const gray = convertToGrayscale(imageData)
  const edges = new Uint8Array(width * height)
  
  // Sobel 算子
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx)
          const pixel = gray[idx]
          gx += pixel * sobelX[ky + 1][kx + 1]
          gy += pixel * sobelY[ky + 1][kx + 1]
        }
      }
      
      const edgeStrength = Math.sqrt(gx * gx + gy * gy)
      edges[y * width + x] = edgeStrength > threshold ? 255 : 0
    }
  }
  
  return edges
}

/**
 * 综合图像预处理
 * @param {object} imageData - 输入图像数据
 * @param {object} options - 预处理选项
 * @returns {object} 处理后的图像数据
 */
export function preprocessImage(imageData, options = {}) {
  const {
    denoise = true,
    denoiseRadius = 3,
    sharpness = 1,
    contrast = 0,
    brightness = 0
  } = options
  
  let processed = imageData
  
  // 1. 降噪
  if (denoise && denoiseRadius > 0) {
    processed = bilateralFilter(processed, denoiseRadius, 25, 25)
  }
  
  // 2. 锐化
  if (sharpness > 1) {
    processed = unsharpMask(processed, sharpness - 0.5)
  }
  
  // 3. 对比度
  if (contrast !== 0) {
    processed = adjustContrast(processed, contrast)
  }
  
  // 4. 亮度
  if (brightness !== 0) {
    processed = adjustBrightness(processed, brightness)
  }
  
  return processed
}

// 辅助函数
function clamp(value, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value))
}

// 导出边缘检测相关函数
export default {
  preprocessImage,
  bilateralFilter,
  unsharpMask,
  adjustContrast,
  adjustBrightness,
  convertToGrayscale,
  detectEdges,
  createImageData
}