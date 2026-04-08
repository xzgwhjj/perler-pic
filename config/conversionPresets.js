/**
 * 拼豆转换预设配置
 * 专业级参数配置系统
 */

// 转换精度配置
export const ACCURACY_PRESETS = {
  low: {
    name: '低精度',
    description: '适合卡通/简单图案，颜色少，合并度高',
    maxColors: 15,
    mergeThreshold: 50,
    beadSize: 8,
    sharpness: 1,
    contrast: 5,
    algorithm: 'hybrid',
    preserveLines: false
  },
  medium: {
    name: '中精度',
    description: '适合大部分图案，平衡颜色数和细节',
    maxColors: 25,
    mergeThreshold: 30,
    beadSize: 5,
    sharpness: 1.3,
    contrast: 10,
    algorithm: 'hybrid',
    preserveLines: true
  },
  high: {
    name: '高精度',
    description: '适合复杂图案，颜色丰富，细节保留',
    maxColors: 40,
    mergeThreshold: 15,
    beadSize: 3,
    sharpness: 1.5,
    contrast: 15,
    algorithm: 'delta_e',
    preserveLines: true
  },
  ultra: {
    name: '超高清',
    description: '适合照片/精细图案，最大颜色数',
    maxColors: 60,
    mergeThreshold: 10,
    beadSize: 2,
    sharpness: 2.0,
    contrast: 20,
    algorithm: 'delta_e',
    preserveLines: true
  }
}

// 图像类型配置
export const IMAGE_TYPE_PRESETS = {
  cartoon: {
    name: '卡通/动漫',
    description: '线条清晰，色块明显',
    denoise: true,
    sharpness: 1.5,
    contrast: 10,
    preserveLines: true,
    colorHint: true,
    maxColors: 25
  },
  photo: {
    name: '照片',
    description: '颜色渐变丰富，细节多',
    denoise: true,
    sharpness: 1.2,
    contrast: 5,
    preserveLines: false,
    colorHint: false,
    maxColors: 40
  },
  icon: {
    name: '图标/Logo',
    description: '简单图形，颜色少',
    denoise: false,
    sharpness: 1.8,
    contrast: 20,
    preserveLines: true,
    colorHint: true,
    maxColors: 15,
    binalize: true,  // 二值化处理，去除抗锯齿
    binalizeThreshold: 128  // 二值化阈值
  },
  illustration: {
    name: '插画',
    description: '艺术风格，中等复杂度',
    denoise: true,
    sharpness: 1.3,
    contrast: 15,
    preserveLines: true,
    colorHint: true,
    maxColors: 30
  }
}

// 颜色系列权重配置（Mard品牌）
export const COLOR_SERIES_WEIGHTS = {
  // 轮廓和线条（高重要性）
  'H': { weight: 1.0, description: '黑白灰系列' },
  'G': { weight: 0.9, description: '棕色/肤色系列' },
  
  // 常用主色
  'B': { weight: 0.7, description: '绿色系列' },
  'C': { weight: 0.7, description: '蓝色系列' },
  'F': { weight: 0.7, description: '红色系列' },
  'E': { weight: 0.7, description: '粉色系列' },
  'A': { weight: 0.6, description: '黄色/橙色系列' },
  'D': { weight: 0.6, description: '紫色系列' },
  
  // 特殊系列
  'M': { weight: 0.5, description: '特殊混合色' }
}

// 流行色号配置（基于实际使用频率）
export const POPULAR_COLORS = {
  // 高频使用色（轮廓、常用色）
  high: ['H1', 'H7', 'H6', 'H5', 'G1', 'G2', 'G3', 'G7', 'G8', 'B2', 'C3', 'C5', 'E5', 'F6'],
  
  // 中频使用色
  medium: ['A1', 'A3', 'A5', 'B4', 'B5', 'C4', 'C7', 'D4', 'E3', 'E4', 'F3', 'F4', 'G4', 'G5'],
  
  // 低频使用色（特殊场景）
  low: ['A10', 'A15', 'B10', 'C10', 'D10', 'E10', 'F10', 'G10', 'M1', 'M5', 'M10']
}

// 颜色重要性评分
export const COLOR_IMPORTANCE_MAP = {
  // 轮廓色
  'H7': 0.95,  // 纯黑（轮廓、线条）
  'H6': 0.85,  // 深灰
  'H5': 0.75,  // 中灰
  'H4': 0.65,  // 浅灰
  
  // 肤色系
  'A1': 0.75, 'A2': 0.75,  // 浅肤色
  'G1': 0.75, 'G2': 0.75, 'G3': 0.75,  // 肤色
  'G4': 0.70,  // 深肤色
  
  // 常用主色
  'B2': 0.65,  // 草绿
  'C3': 0.65,  // 天蓝
  'C5': 0.65,  // 深蓝
  'E5': 0.65,  // 粉红
  'F6': 0.65,  // 深红
  
  // 基础色
  'H1': 0.60,  // 白色
  'H2': 0.55,  // 极浅灰
  
  // 默认
  default: 0.30
}

// 精度滑块映射配置（1-10级）
export const ACCURACY_CONFIG = {
  1: { name: '极简', mergeThreshold: 75, maxColors: 10, clusterCount: 10 },
  2: { name: '极简+', mergeThreshold: 60, maxColors: 12, clusterCount: 12 },
  3: { name: '简单', mergeThreshold: 45, maxColors: 15, clusterCount: 15 },
  4: { name: '简单+', mergeThreshold: 30, maxColors: 18, clusterCount: 18 },
  5: { name: '平衡', mergeThreshold: 15, maxColors: 20, clusterCount: 20 },
  6: { name: '平衡+', mergeThreshold: 10, maxColors: 25, clusterCount: 23 },
  7: { name: '精细', mergeThreshold: 5, maxColors: 30, clusterCount: 26 },
  8: { name: '精细+', mergeThreshold: 0, maxColors: 35, clusterCount: 28 },
  9: { name: '高清', mergeThreshold: 0, maxColors: 40, clusterCount: 30 },
  10: { name: '超清', mergeThreshold: 0, maxColors: 50, clusterCount: 35 }
}

// 自适应网格配置
export const GRID_CONFIG = {
  minBeadSize: 2,
  maxBeadSize: 8,
  defaultSize: 29,
  
  // 根据图片复杂度自动调整
  complexityRules: {
    simple: { threshold: 0.3, beadSizeBonus: 1 },
    normal: { threshold: 0.7, beadSizeBonus: 0 },
    complex: { threshold: 1.0, beadSizeBonus: -1 }
  }
}

// 边缘检测配置
export const EDGE_DETECTION_CONFIG = {
  threshold: 50,
  sobel: {
	matrixX: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
	matrixY: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
  },
  
  // 边缘保护强度
  preserveStrength: {
	none: 1.0,
	light: 1.2,
	medium: 1.5,
	strong: 2.0,
	veryStrong: 2.5
  }
}

// 导出默认配置
export default {
  ACCURACY_PRESETS,
  IMAGE_TYPE_PRESETS,
  COLOR_SERIES_WEIGHTS,
  POPULAR_COLORS,
  COLOR_IMPORTANCE_MAP,
  ACCURACY_CONFIG,
  GRID_CONFIG,
  EDGE_DETECTION_CONFIG
}