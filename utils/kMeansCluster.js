/**
 * K-Means 聚类算法 - 专业级优化版
 * 用于颜色聚类和主色提取
 */

import { euclideanDistance } from './colorUtils.js'

/**
 * K-Means 颜色聚类
 * @param {object} pixelData - 像素数据
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 * @param {number} clusterCount - 聚类数量
 * @param {Set} transparentMap - 透明像素映射（可选）
 * @returns {Array} 聚类中心数组
 */
export function kMeansColorCluster(pixelData, width, height, clusterCount, transparentMap = null) {
	const pixels = []
	const data = pixelData.data
	const colorCount = {}
	const totalPixels = width * height

	// 1. 只收集不透明的有效像素，排除透明背景
	for (let i = 0; i < data.length; i += 4) {
		const x = (i / 4) % width
		const y = Math.floor((i / 4) / width)
		const a = data[i + 3]
		
		// 透明像素直接跳过，不参与聚类
		if (a < 128 || (transparentMap && transparentMap.has(`${x},${y}`))) continue

		const r = data[i]
		const g = data[i + 1]
		const b = data[i + 2]
		const key = `${r},${g},${b}`
		
		pixels.push([r, g, b])
		colorCount[key] = (colorCount[key] || 0) + 1
	}
	
	if (pixels.length === 0) return []

	// 2. 按「出现频率50% + 色彩饱和度50%」加权，优先保留高饱和关键色
	const colorList = Object.entries(colorCount).map(([key, count]) => {
		const [r, g, b] = key.split(',').map(Number)
		const saturation = Math.max(r, g, b) - Math.min(r, g, b)
		const weight = (count / totalPixels) * 0.5 + (saturation / 255) * 0.5
		return { rgb: [r, g, b], count, weight }
	}).sort((a, b) => b.weight - a.weight)

	// 3. 初始化聚类中心，优先保留关键色
	let centroids = colorList.slice(0, clusterCount).map(item => item.rgb)
	
	// 去重：确保聚类中心唯一
	centroids = [...new Map(centroids.map(c => [c.join(','), c])).values()]
	
	// 如果聚类中心不足，补充更多颜色
	while (centroids.length < clusterCount && centroids.length < colorList.length) {
		const nextColor = colorList[centroids.length]?.rgb
		if (!nextColor) break
		
		// 检查是否已存在
		const exists = centroids.some(c => c.join(',') === nextColor.join(','))
		if (!exists) {
			centroids.push(nextColor)
		} else {
			// 如果已存在，跳过并继续
			break
		}
	}

	// 4. 迭代聚类，温和收敛不强制合并
	let lastCentroids = []
	let iterations = 0
	const maxIterations = 50
	
	while (iterations < maxIterations && JSON.stringify(centroids) !== JSON.stringify(lastCentroids)) {
		lastCentroids = centroids.map(c => [...c])
		const clusters = Array.from({ length: clusterCount }, () => [])

		// 分配像素到最近的聚类
		for (const p of pixels) {
			let minDist = Infinity
			let clusterIndex = 0
			
			for (let i = 0; i < centroids.length; i++) {
				const dist = euclideanDistance(p, centroids[i])
				if (dist < minDist) {
					minDist = dist
					clusterIndex = i
				}
			}
			clusters[clusterIndex].push(p)
		}

		// 重新计算聚类中心
		const newCentroids = []
		for (let i = 0; i < centroids.length; i++) {
			if (clusters[i].length === 0) {
				// 空聚类：保留原中心
				newCentroids.push(centroids[i])
				continue
			}
			
			// 计算平均值
			const sum = clusters[i].reduce((acc, p) => [
				acc[0] + p[0], 
				acc[1] + p[1], 
				acc[2] + p[2]
			], [0, 0, 0])
			
			newCentroids.push([
				Math.round(sum[0] / clusters[i].length),
				Math.round(sum[1] / clusters[i].length),
				Math.round(sum[2] / clusters[i].length)
			])
		}
		
		centroids = newCentroids
		iterations++
	}
	
	return centroids
}

/**
 * 将像素映射到最近的聚类
 * @param {Array} pixelRgb - 像素RGB值 [r, g, b]
 * @param {Array} clusters - 聚类数组
 * @returns {Array} 最近的聚类RGB值
 */
export function mapPixelToCluster(pixelRgb, clusters) {
	// 边界检查
	if (!clusters || clusters.length === 0) {
		return pixelRgb
	}

	// 性能优化：只有一个聚类时直接返回
	if (clusters.length === 1) {
		return clusters[0]
	}

	// 验证pixelRgb格式
	if (!pixelRgb || pixelRgb.length !== 3) {
		return pixelRgb
	}

	let minDist = Infinity
	let bestRgb = clusters[0]

	// 遍历所有聚类，找到距离最近的颜色
	for (let i = 0; i < clusters.length; i++) {
		const cluster = clusters[i]
		
		// 验证聚类数据格式
		if (!cluster || cluster.length !== 3) {
			continue
		}

		const dist = euclideanDistance(pixelRgb, cluster)
		if (dist < minDist) {
			minDist = dist
			bestRgb = cluster
		}
	}

	return bestRgb
}
export default {
	kMeansColorCluster,
	mapPixelToCluster
}