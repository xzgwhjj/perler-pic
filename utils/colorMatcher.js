/**
 * 专业级颜色匹配器
 * 提供高精度、智能化的颜色匹配算法
 */

import {
	rgbToLab,
	deltaE,
	euclideanDistance
} from './colorUtils.js'

/**
 * 颜色特征提取
 * @param {Array} rgb - RGB颜色值 [r, g, b]
 * @returns {object} 颜色特征对象
 */
export function extractColorFeature(rgb) {
	const [r, g, b] = rgb
	const brightness = 0.299 * r + 0.587 * g + 0.114 * b
	const saturation = Math.max(r, g, b) - Math.min(r, g, b)
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	
	// 色相计算
	let hue = 0
	if (saturation !== 0) {
		if (max === r) hue = ((g - b) / saturation + (g < b ? 6 : 0)) * 60
		else if (max === g) hue = ((b - r) / saturation + 2) * 60
		else hue = ((r - g) / saturation + 4) * 60
	}
	
	return {
		rgb,
		brightness,
		saturation,
		hue,
		isDark: brightness < 128,
		isVibrant: saturation > 100,
		colorFamily: getColorFamily(hue, saturation, brightness)
	}
}

/**
 * 判断颜色所属色系
 * @param {number} hue - 色相
 * @param {number} saturation - 饱和度
 * @param {number} brightness - 亮度
 * @returns {string} 色系类别
 */
function getColorFamily(hue, saturation, brightness) {
	// 低饱和度：灰色/棕色系
	if (saturation < 20) {
		if (brightness > 200) return 'white'
		if (brightness > 150) return 'light-gray'
		if (brightness > 100) return 'gray'
		if (brightness > 50) return 'dark-gray'
		return 'black'
	}
	
	// 高饱和度：彩色系
	if (hue >= 0 && hue < 15 || hue >= 345) return 'red'
	if (hue >= 15 && hue < 45) return 'orange'
	if (hue >= 45 && hue < 75) return 'yellow'
	if (hue >= 75 && hue < 165) return 'green'
	if (hue >= 165 && hue < 255) return 'blue'
	if (hue >= 255 && hue < 315) return 'purple'
	if (hue >= 315 && hue < 345) return 'pink'
	
	return 'other'
}

/**
 * 智能颜色筛选
 * @param {Array} targetRgb - 目标RGB
 * @param {Array} colorPalette - 颜色板
 * @param {object} options - 选项
 * @returns {Array} 筛选后的颜色板
 */
export function filterByColorFamily(targetRgb, colorPalette, options = {}) {
	const { strictness = 0.7 } = options
	const targetFeature = extractColorFeature(targetRgb)
	
	// 计算每个颜色的匹配分数
	const scored = colorPalette.map(color => {
		const colorFeature = extractColorFeature(color.rgb)
		
		// 色系匹配权重
		let familyScore = targetFeature.colorFamily === colorFeature.colorFamily ? 1 : 0
		
		// 亮度接近度
		const brightnessDiff = Math.abs(targetFeature.brightness - colorFeature.brightness) / 255
		const brightnessScore = 1 - brightnessDiff
		
		// 饱和度接近度
		const saturationDiff = Math.abs(targetFeature.saturation - colorFeature.saturation) / 255
		const saturationScore = 1 - saturationDiff
		
		// 综合分数
		const totalScore = familyScore * 0.5 + brightnessScore * 0.3 + saturationScore * 0.2
		
		return { color, score: totalScore }
	})
	
	// 排序并筛选
	scored.sort((a, b) => b.score - a.score)
	
	// 动态确定保留数量
	const keepCount = Math.max(
		10,
		Math.min(colorPalette.length * 0.3, scored.filter(s => s.score > strictness).length)
	)
	
	return scored.slice(0, keepCount).map(s => s.color)
}

/**
 * 专业级颜色匹配（混合算法）
 * @param {Array} rgb - 目标RGB
 * @param {Array} colorPalette - 颜色板
 * @param {object} options - 匹配选项
 * @returns {object} 最佳匹配颜色
 */
export function findClosestColorPro(rgb, colorPalette, options = {}) {
	const {
		algorithm = 'hybrid',
		preserveDetail = false,
		useColorHint = true,
		edgeWeight = 1.0
	} = options
	
	if (!colorPalette || colorPalette.length === 0) return null
	
	let candidates = colorPalette
	
	// 1. 智能筛选（可选）
	if (useColorHint && colorPalette.length > 20) {
		candidates = filterByColorFamily(rgb, colorPalette, { strictness: 0.6 })
	}
	
	let bestMatch = null
	let minScore = Infinity
	
		// 2. 根据算法选择匹配方式
		if (algorithm === 'hybrid') {
			// 混合算法：Delta E + 自定义权重
			const targetLab = rgbToLab(rgb[0], rgb[1], rgb[2])
			const targetFeature = extractColorFeature(rgb)
			
			for (const color of candidates) {
				const colorLab = rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2])
				const deltaEValue = deltaE(targetLab, colorLab)
				
				// 基础分数
				let finalScore = deltaEValue
				
				// 如果是边缘像素，降低亮度权重（保留轮廓）
				if (preserveDetail) {
					finalScore *= 0.8 // 降低整体差异权重
				}
				
				// 颜色重要性加权
				const importance = calculateColorImportance(color)
				finalScore *= (1 - importance * 0.1)
				
				// 饱和度保护（对于高饱和颜色）
				const colorFeature = extractColorFeature(color.rgb)
				if (targetFeature.saturation > 100 && colorFeature.saturation > 100) {
					finalScore *= 0.9 // 优先匹配高饱和色
				}
				
				if (finalScore < minScore) {
					minScore = finalScore
					bestMatch = color
				}
			}
	} else if (algorithm === 'delta_e') {
		// 纯 Delta E 2000
		const targetLab = rgbToLab(rgb[0], rgb[1], rgb[2])
		
		for (const color of candidates) {
			const colorLab = rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2])
			const deltaEValue = deltaE(targetLab, colorLab)
			
			if (deltaEValue < minScore) {
				minScore = deltaEValue
				bestMatch = color
			}
		}
	} else {
		// 欧氏距离（快速模式）
		for (const color of candidates) {
			const dist = euclideanDistance(rgb, color.rgb)
			
			if (dist < minScore) {
				minScore = dist
				bestMatch = color
			}
		}
	}
	
	return bestMatch
}

/**
 * 计算颜色重要性分数
 * @param {object} color - 颜色对象
 * @returns {number} 重要性分数 (0-1)
 */
export function calculateColorImportance(color) {
	// 基于经验的颜色重要性评分
	const importanceMap = {
		// 轮廓色（高重要性）
		'H7': 0.95,  // 黑色
		'H6': 0.85,  // 深灰
		'H5': 0.75,  // 中灰
		'H4': 0.65,  // 灰
		
		// 肤色系
		'A1': 0.7, 'A2': 0.7, 'A3': 0.65,
		'G1': 0.7, 'G2': 0.7, 'G3': 0.65,
		
		// 常用色
		'B2': 0.6,  // 草绿
		'C3': 0.6,  // 浅蓝
		'E5': 0.6,  // 粉红
		'F6': 0.6,  // 深红
	}
	
	return importanceMap[color.code] || 0.3
}

/**
 * 智能颜色合并（针对低精度模式）
 * @param {Array} colors - 颜色统计数组
 * @param {number} maxColors - 最大颜色数
 * @returns {Array} 优化后的颜色数组
 */
export function optimizeColorCount(colors, maxColors = 30) {
	if (colors.length <= maxColors) return colors
	
	// 1. 计算每个颜色的重要性
	const scored = colors.map(color => ({
		...color,
		importance: calculateColorImportance(color)
	}))
	
	// 2. 按使用量和重要性排序
	scored.sort((a, b) => {
		const scoreA = a.count * 0.7 + a.importance * 1000 * 0.3
		const scoreB = b.count * 0.7 + b.importance * 1000 * 0.3
		return scoreB - scoreA
	})
	
	// 3. 保留核心颜色
	const coreColors = scored.slice(0, Math.floor(maxColors * 0.7))
	const remaining = scored.slice(Math.floor(maxColors * 0.7))
	
	// 4. 合并剩余颜色到最近的核心颜色
	const optimized = [...coreColors]
	
	for (const color of remaining) {
		let minDist = Infinity
		let closestIndex = 0
		
		for (let i = 0; i < coreColors.length; i++) {
			const dist = euclideanDistance(color.rgb, coreColors[i].rgb)
			if (dist < minDist) {
				minDist = dist
				closestIndex = i
			}
		}
		
		// 合并到最接近的核心颜色
		optimized[closestIndex].count += color.count
	}
	
	// 5. 重新排序
	return optimized.sort((a, b) => b.count - a.count)
}

/**
 * 检测颜色是否为边缘/轮廓色（优化版）
 * @param {Array} rgb - RGB颜色
 * @returns {boolean} 是否为边缘色
 */
export function isEdgeColor(rgb) {
	const [r, g, b] = rgb
	const brightness = 0.299 * r + 0.587 * g + 0.114 * b
	const saturation = Math.max(r, g, b) - Math.min(r, g, b)
	
	// 真正的黑色/线条：非常暗，饱和度低
	// 优化：提高阈值，只识别真正的深色线条
	return brightness < 60 && saturation < 40 // 更严格的条件
}

/**
 * 检测颜色是否为肤色（优化版）
 * @param {Array} rgb - RGB颜色
 * @returns {boolean} 是否为肤色
 */
export function isSkinTone(rgb) {
	const [r, g, b] = rgb
	const brightness = 0.299 * r + 0.587 * g + 0.114 * b
	const saturation = Math.max(r, g, b) - Math.min(r, g, b)
	
	// 肤色特征：红色成分高，绿色居中，蓝色低
	// 优化：放宽条件，提高识别率
	const isOrangeRed = r > g + 5 && g > b + 5 // 更宽松的条件
	const isMediumBrightness = brightness > 100 && brightness < 230 // 更广的范围
	const isMediumSaturation = saturation > 10 && saturation < 120 // 更宽松
	
	return isOrangeRed && isMediumBrightness && isMediumSaturation
}

export default {
	findClosestColorPro,
	extractColorFeature,
	filterByColorFamily,
	optimizeColorCount,
	isEdgeColor,
	isSkinTone,
	calculateColorImportance,
	euclideanDistance
}