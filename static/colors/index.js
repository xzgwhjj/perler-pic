/**
 * 色号数据库索引
 * 用于加载不同品牌的拼豆色号数据
 */

// 品牌列表
export const BRANDS = {
  mard: {
    id: 'mard',
    name: 'Mard',
    totalColors: 291,
    series: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'M', 'P', 'Q', 'R', 'T', 'Y', 'ZG'],
    dataFile: '/static/colors/mard-colors.json'
  },
  coco: {
    id: 'coco',
    name: 'Coco',
    totalColors: 291,
    series: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'GB', 'H', 'J', 'K', 'L', 'M', 'N', 'S', 'W', 'Y', 'Z'],
    dataFile: '/static/colors/coco-colors.json'
  },
  mixiaowo: {
    id: 'mixiaowo',
    name: '咪小窝',
    totalColors: 291,
    series: ['M'],
    dataFile: '/static/colors/mixiaowo-colors.json'
  },
  manman: {
    id: 'manman',
    name: '漫漫',
    totalColors: 290,
    series: ['A', 'B', 'C', 'D', 'DH', 'E', 'F', 'G', 'H', 'IC', 'L', 'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'Y', 'YX', 'Z', 'ZG'],
    dataFile: '/static/colors/manman-colors.json'
  },
  panpan: {
    id: 'panpan',
    name: '盼盼',
    totalColors: 291,
    series: ['M'],
    dataFile: '/static/colors/panpan-colors.json'
  }
}

// 拼豆板尺寸（标准尺寸）
export const BOARD_SIZES = [
  { name: '29x29 小板', width: 29, height: 29, description: '小号拼豆板' },
  { name: '43x43 中板', width: 43, height: 43, description: '中号拼豆板' },
  { name: '58x58 大板', width: 58, height: 58, description: '大号拼豆板' },
  { name: '自定义', width: 0, height: 0, description: '自定义尺寸', custom: true }
]

// 获取品牌列表
export function getBrands() {
  return Object.values(BRANDS).filter(brand => !brand.comingSoon || brand.comingSoon)
}

// 获取可用品牌（有数据的）
export function getAvailableBrands() {
  return Object.values(BRANDS).filter(brand => !brand.comingSoon)
}

// 获取品牌信息
export function getBrandInfo(brandId) {
  return BRANDS[brandId] || null
}

// 获取板型尺寸
export function getBoardSizes() {
  return BOARD_SIZES
}

// 颜色匹配算法类型
export const MATCH_ALGORITHMS = {
  EUCLIDEAN: 'euclidean',
  DELTA_E: 'delta_e',
  LAB: 'lab'
}

export default {
  BRANDS,
  BOARD_SIZES,
  getBrands,
  getAvailableBrands,
  getBrandInfo,
  getBoardSizes,
  MATCH_ALGORITHMS
}
