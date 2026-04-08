/**
 * 新版的拼豆转换核心（整合优化版）
 * 兼容原有接口，内部使用优化算法
 */

import { buildColorTree, clearColorCaches } from '../utils/colorMatcherOptimized.js'
import { releaseBuffers } from '../utils/imageProcessorOptimized.js'
import { clearCaches, convertToBeadPatternOptimized } from './beadConverterOptimized.js'

// 颜色树实例
let colorTreeBuilt = false

/**
 * 转换图像为拼豆图案（新接口，兼容旧版）
 * @param {ImageData} imageData - 图像数据
 * @param {Array} colorPalette - 颜色板
 * @param {Object} options - 选项
 * @param {Set} transparentMap - 透明区域映射
 * @returns {Promise<Object>} 转换结果
 */
async function convertToBeadPatternNew(imageData, colorPalette, options = {}, transparentMap = null) {
  // 首次调用时构建颜色树
  if (!colorTreeBuilt) {
    buildColorTree(colorPalette)
    colorTreeBuilt = true
  }
  
  try {
    const result = await convertToBeadPatternOptimized(imageData, colorPalette, options, transparentMap)
    return result
  } catch (error) {
    console.error('转换失败:', error)
    throw error
  }
}

/**
 * 清理所有缓存（内存管理）
 */
export function cleanupResources() {
  clearCaches()
  clearColorCaches()
  releaseBuffers()
  colorTreeBuilt = false
}

/**
 * 重新构建颜色树（当颜色板改变时调用）
 */
export function rebuildColorTree(colorPalette) {
  buildColorTree(colorPalette)
  colorTreeBuilt = true
}


export default {
  convertToBeadPattern: convertToBeadPatternNew,
  cleanupResources,
  rebuildColorTree
}
