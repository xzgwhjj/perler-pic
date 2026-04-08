/**
 * 专业级拼豆转换核心
 * 整合预处理、颜色匹配、边缘检测等高级功能
 */

import { ACCURACY_CONFIG, EDGE_DETECTION_CONFIG, IMAGE_TYPE_PRESETS } from '@/config/conversionPresets.js'
import { findClosestColorPro, isEdgeColor, optimizeColorCount } from '@/utils/colorMatcher.js'
import { deltaE, euclideanDistance, rgbToLab } from '@/utils/colorUtils.js'
import { createImageData, detectEdges, preprocessImage } from '@/utils/imageProcessor.js'
import { kMeansColorCluster, mapPixelToCluster } from '@/utils/kMeansCluster.js'

/**
 * 分析图片复杂度
 * @param {object} imageData - 图像数据
 * @returns {number} 复杂度分数 (0-1)
 */
export function analyzeComplexity(imageData) {
	const { data, width, height } = imageData
	let edgeCount = 0
	let colorVariety = new Set()

	const sampleRate = 4
	for (let y = 0; y < height; y += sampleRate) {
		for (let x = 0; x < width; x += sampleRate) {
			const idx = (y * width + x) * 4
			const colorKey = `${data[idx] >> 4},${data[idx + 1] >> 4},${data[idx + 2] >> 4}`
			colorVariety.add(colorKey)

			if (x > 0 && y > 0) {
				const leftIdx = (y * width + (x - 1)) * 4
				const topIdx = ((y - 1) * width + x) * 4
				const diffX = Math.abs(data[idx] - data[leftIdx])
				const diffY = Math.abs(data[idx] - data[topIdx])
				if (diffX > 30 || diffY > 30) edgeCount++
			}
		}
	}

	const totalSamples = (width / sampleRate) * (height / sampleRate)
	const edgeRatio = edgeCount / totalSamples
	const colorComplexity = Math.min(colorVariety.size / 50, 1.0)
	return Math.min((edgeRatio + colorComplexity) / 2, 1.0)
}

function applyBinalize(imageData, threshold = 128) {
	const { data, width, height } = imageData
	const output = new Uint8ClampedArray(data)
	for (let i = 0; i < data.length; i += 4) {
		const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
		const value = gray > threshold ? 255 : 0
		output[i] = output[i + 1] = output[i + 2] = value
	}
	return createImageData(output, width, height)
}

function mergeSimilarColors(colors, threshold = 2.0) {
	if (colors.length <= 1) return colors
	colors.sort((a, b) => b.count - a.count)
	const merged = []
	const used = new Set()

	for (let i = 0; i < colors.length; i++) {
		if (used.has(i)) continue
		const baseColor = colors[i]
		const group = [baseColor]
		used.add(i)
		const baseLab = rgbToLab(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2])

		for (let j = i + 1; j < colors.length; j++) {
			if (used.has(j)) continue
			const compareColor = colors[j]
			const compareLab = rgbToLab(compareColor.rgb[0], compareColor.rgb[1], compareColor.rgb[2])
			const deltaEValue = deltaE(baseLab, compareLab)
			if (deltaEValue < threshold) {
				group.push(compareColor)
				used.add(j)
			}
		}

		const representative = group.reduce((max, color) => color.count > max.count ? color : max)
		representative.count = group.reduce((sum, color) => sum + color.count, 0)
		merged.push(representative)
	}
	return merged
}

export function optimizeGrid(imageData, maxGridSize = 29) {
	const { width, height } = imageData
	const complexity = analyzeComplexity(imageData)
	const aspectRatio = width / height
	let cols, rows

	if (width >= height) {
		cols = maxGridSize
		rows = Math.round(cols / aspectRatio)
	} else {
		rows = maxGridSize
		cols = Math.round(rows * aspectRatio)
	}

	if (cols < 10 || cols > 100 || rows < 10 || rows > 100) {
		if (aspectRatio >= 1) {
			cols = Math.min(100, maxGridSize)
			rows = Math.max(10, Math.min(100, Math.round(cols / aspectRatio)))
		} else {
			rows = Math.min(100, maxGridSize)
			cols = Math.max(10, Math.min(100, Math.round(rows * aspectRatio)))
		}
	}

	cols = Math.max(10, Math.min(100, cols))
	rows = Math.max(10, Math.min(100, rows))
	const actualAspectRatio = cols / rows
	const ratioDiff = Math.abs(actualAspectRatio - aspectRatio) / aspectRatio

	let recommendedAccuracy = 6
	if (complexity > 0.7) recommendedAccuracy = 8
	else if (complexity > 0.5) recommendedAccuracy = 7
	else if (complexity < 0.3) recommendedAccuracy = 5

	return { cols, rows, beadSize: maxGridSize, complexity, originalSize: { width, height }, aspectRatio, actualAspectRatio, ratioDiff, recommendedAccuracy }
}

export function createEdgeMap(imageData, width, height) {
	const edges = detectEdges(imageData, EDGE_DETECTION_CONFIG.threshold)
	return edges
}

export async function convertToBeadPattern(imageData, colorPalette, options = {}, transparentMap = null) {
	const {
		accuracy = 6,
		beadSize = 5,
		preserveLines = true,
		imageType = 'cartoon',
		maxColors = 30
	} = options

	const config = ACCURACY_CONFIG[accuracy] || ACCURACY_CONFIG[6]

	console.log('🎨 开始专业级拼豆转换...')
	let processedImage = preprocessImage(imageData, {
		denoise: true,
		sharpness: preserveLines ? 1.5 : 1.0,
		contrast: config.mergeThreshold > 30 ? 10 : 5,
		denoiseRadius: 3
	})

	let edgeMap = null
	if (preserveLines) {
		edgeMap = createEdgeMap(processedImage, imageData.width, imageData.height)
	}

	const grid = optimizeGrid(processedImage, beadSize)
	const imageTypeConfig = IMAGE_TYPE_PRESETS[imageType] || IMAGE_TYPE_PRESETS.cartoon
	const actualMaxColors = Math.min(maxColors, imageTypeConfig.maxColors)
	const actualAlgorithm = accuracy >= 7 ? 'delta_e' : 'hybrid'

	if (imageTypeConfig.binalize) {
		processedImage = applyBinalize(processedImage, imageTypeConfig.binalizeThreshold || 128)
	}

	// 🔥 全图纯色化（修复完成）
	console.log('🎨 步骤4.5：全图纯色化（锁定6主色）...')
	const pureColorClusters = kMeansColorCluster(processedImage, processedImage.width, processedImage.height, 6, transparentMap)
	const pureData = new Uint8ClampedArray(processedImage.data.length)
	for (let i = 0; i < processedImage.data.length; i += 4) {
		const x = (i / 4) % processedImage.width
		const y = Math.floor((i / 4) / processedImage.width)
		if (transparentMap?.has(`${x},${y}`)) {
			pureData[i] = pureData[i + 1] = pureData[i + 2] = 0
			pureData[i + 3] = 0
			continue
		}
		const rgb = [processedImage.data[i], processedImage.data[i + 1], processedImage.data[i + 2]]
		const closest = mapPixelToCluster(rgb, pureColorClusters)
		pureData[i] = closest[0]
		pureData[i + 1] = closest[1]
		pureData[i + 2] = closest[2]
		pureData[i + 3] = 255
	}
	processedImage = createImageData(pureData, processedImage.width, processedImage.height)

	const pixelGrid = []
	const colorStats = {}
	const colorCache = new Map()
	const DELTA_E_THRESHOLD = 2.0

	// 🔥 区域主色投票（修复完成，无报错+生效）
	const cellW = imageData.width / grid.cols
	const cellH = imageData.height / grid.rows
	for (let y = 0; y < grid.rows; y++) {
		pixelGrid[y] = []
		for (let x = 0; x < grid.cols; x++) {
			const sx = Math.floor(x * cellW)
			const ex = Math.floor((x + 1) * cellW)
			const sy = Math.floor(y * cellH)
			const ey = Math.floor((y + 1) * cellH)

			const vote = new Map()
			let hasValidPixel = false
			for (let py = sy; py < ey; py++) {
				for (let px = sx; px < ex; px++) {
					if (transparentMap?.has(`${px},${py}`)) continue
					const idx = (py * imageData.width + px) * 4
					const key = `${processedImage.data[idx]},${processedImage.data[idx + 1]},${processedImage.data[idx + 2]}`
					vote.set(key, (vote.get(key) || 0) + 1)
					hasValidPixel = true
				}
			}

			// ✅ 绑定投票结果（核心修复）
			let pixelRgb = null
			if (hasValidPixel && vote.size > 0) {
				const maxKey = Array.from(vote.entries()).sort((a, b) => b[1] - a[1])[0][0]
				pixelRgb = maxKey.split(',').map(Number)
			}

			// 空像素跳过
			if (!pixelRgb) {
				pixelGrid[y][x] = null
				continue
			}

			// 颜色缓存
			const cacheKey = pixelRgb.join(',')
			if (colorCache.has(cacheKey)) {
				pixelGrid[y][x] = colorCache.get(cacheKey)
				continue
			}

			// 边缘检测
			const isEdgePixel = edgeMap && edgeMap[Math.floor((sy + ey) / 2) * imageData.width + Math.floor((sx + ex) / 2)] > 0
			const pixelBrightness = 0.299 * pixelRgb[0] + 0.587 * pixelRgb[1] + 0.114 * pixelRgb[2]
			const isPureBlack = pixelBrightness < 50
			const isDarkLine = pixelBrightness < 80

			// ✅ 强化线条匹配
			let matchedColor
			if (isEdgePixel && preserveLines && (isPureBlack || isDarkLine)) {
				const lineColors = colorPalette.filter(c => ['G7', 'G8', 'H5', 'H6', 'H7'].includes(c.code))
				matchedColor = findClosestColorPro(pixelRgb, lineColors, { algorithm: 'delta_e', preserveDetail: true })
				if (!matchedColor) matchedColor = colorPalette.find(c => c.code === 'H7') || lineColors[0]
			} else if (isEdgePixel && preserveLines && isEdgeColor(pixelRgb)) {
				matchedColor = findClosestColorPro(pixelRgb, colorPalette.filter(c => {
					const brightness = 0.299 * c.rgb[0] + 0.587 * c.rgb[1] + 0.114 * c.rgb[2]
					return brightness < 100
				}), { algorithm: 'delta_e', preserveDetail: true })
			} else {
				matchedColor = findClosestColorPro(pixelRgb, colorPalette, {
					algorithm: actualAlgorithm,
					preserveDetail: imageTypeConfig.preserveLines
				})
			}

			pixelGrid[y][x] = matchedColor
			if (matchedColor) colorCache.set(cacheKey, matchedColor)

			// 颜色统计
			if (matchedColor) {
				if (!colorStats[matchedColor.code]) colorStats[matchedColor.code] = { ...matchedColor, count: 0 }
				colorStats[matchedColor.code].count++
			}
		}
	}

	// 颜色优化
	let colorList = Object.values(colorStats)
	colorList = mergeSimilarColors(colorList, DELTA_E_THRESHOLD)
	if (colorList.length > actualMaxColors) {
		colorList = optimizeColorCount(colorList, actualMaxColors)
		const optimizedColorMap = new Map()
		const colorCacheMap = new Map()
		colorList.forEach(color => {
			optimizedColorMap.set(color.code, color)
			colorCacheMap.set(color.rgb.join(','), color)
		})

		for (let y = 0; y < grid.rows; y++) {
			for (let x = 0; x < grid.cols; x++) {
				const color = pixelGrid[y][x]
				if (color && !optimizedColorMap.has(color.code)) {
					const cacheKey = color.rgb.join(',')
					let nearestColor = colorCacheMap.get(cacheKey) || findNearestColor(color.rgb, colorList)
					pixelGrid[y][x] = nearestColor
				}
			}
		}
	}

	// 🔥 碎色消除（修复完成，无报错）
	console.log('🧹 消除孤立碎色...')
	for (let y = 0; y < grid.rows; y++) {
		for (let x = 0; x < grid.cols; x++) {
			const curr = pixelGrid[y][x]
			if (!curr || !colorStats[curr.code]) continue

			const votes = new Map()
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const ny = y + dy, nx = x + dx
					if (ny < 0 || ny >= grid.rows || nx < 0 || nx >= grid.cols) continue
					const c = pixelGrid[ny][nx]
					if (c) votes.set(c.code, (votes.get(c.code) || 0) + 1)
				}
			}

			if (votes.get(curr.code) <= 1 && votes.size > 1) {
				const topCode = Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0][0]
				const newColor = colorList.find(c => c.code === topCode)
				if (newColor) {
					pixelGrid[y][x] = newColor
					colorStats[curr.code].count--
					colorStats[topCode] = colorStats[topCode] || { ...newColor, count: 0 }
					colorStats[topCode].count++
				}
			}
		}
	}

	colorList = Object.values(colorStats).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

	const result = {
		grid: pixelGrid,
		colors: colorList,
		stats: {
			totalBeads: grid.cols * grid.rows,
			colorCount: colorList.length,
			gridSize: { cols: grid.cols, rows: grid.rows },
			complexity: grid.complexity,
			accuracy: accuracy,
			preserveLines: preserveLines
		}
	}

	console.log('✅ 转换完成！')
	return result
}

function findClosestCluster(rgb, clusters) {
	let minDist = Infinity
	let closest = clusters[0]
	for (const cluster of clusters) {
		const dist = euclideanDistance(rgb, cluster)
		if (dist < minDist) {
			minDist = dist
			closest = cluster
		}
	}
	return closest
}

function findNearestColor(rgb, colorList) {
	let minDist = Infinity
	let nearest = colorList[0]
	for (const color of colorList) {
		const dist = euclideanDistance(rgb, color.rgb)
		if (dist < minDist) {
			minDist = dist
			nearest = color
		}
	}
	return nearest
}

export default {
	convertToBeadPattern,
	analyzeComplexity,
	optimizeGrid,
	createEdgeMap
}