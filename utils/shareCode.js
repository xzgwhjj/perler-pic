/**
 * 分享码模块
 * 功能：生成、解析、嵌入分享码，实现图纸的分享与还原
 * 兼容微信小程序环境
 */

// 分享码版本号，用于未来兼容性
const SHARE_CODE_VERSION = '1.0'

// Base64编码兼容函数（支持浏览器和小程序）
const base64Encode = (str) => {
	// 微信小程序环境
	// #ifdef MP-WEIXIN
	try {
		return encodeURIComponent(str)
	} catch (e) {
		console.error('Base64 encode failed:', e)
		return null
	}
	// #endif

	// #ifndef MP-WEIXIN
	// 浏览器环境
	try {
		return btoa(encodeURIComponent(str))
	} catch (e) {
		console.error('Base64 encode failed:', e)
		return null
	}
	// #endif
}

// Base64解码兼容函数（支持浏览器和小程序）
const base64Decode = (encodedStr) => {
	// 微信小程序环境
	// #ifdef MP-WEIXIN
	try {
		return decodeURIComponent(encodedStr)
	} catch (e) {
		console.error('Base64 decode failed:', e)
		return null
	}
	// #endif

	// #ifndef MP-WEIXIN
	// 浏览器环境
	try {
		return decodeURIComponent(atob(encodedStr))
	} catch (e) {
		console.error('Base64 decode failed:', e)
		return null
	}
	// #endif
}

// 生成分享码唯一标识
const generateShareCodeId = () => {
	const timestamp = Date.now().toString(36)
	const random = Math.random().toString(36).substring(2, 8)
	return `PC_${SHARE_CODE_VERSION}_${timestamp}${random}`.toUpperCase()
}

// 将数据编码为分享码字符串
const encodeShareCode = (data) => {
	try {
		// 添加元数据
		const meta = {
			v: SHARE_CODE_VERSION,
			id: generateShareCodeId(),
			t: Date.now()
		}

		// 合并数据
		const fullData = { ...meta, ...data }

		// JSON序列化后进行base64编码
		const jsonStr = JSON.stringify(fullData)
		const encoded = base64Encode(jsonStr)

		return encoded
	} catch (error) {
		console.error('编码分享码失败:', error)
		return null
	}
}

// 解码分享码字符串
const decodeShareCode = (codeStr) => {
	try {
		// 移除空白字符
		codeStr = codeStr.trim()

		// 检查是否为有效格式
		if (!codeStr || codeStr.length < 20) {
			return { valid: false, error: '分享码格式不正确' }
		}

		// Base64解码
		const jsonStr = base64Decode(codeStr)
		if (!jsonStr) {
			return { valid: false, error: '分享码解析失败' }
		}

		const data = JSON.parse(jsonStr)

		// 验证版本
		if (!data.v) {
			return { valid: false, error: '分享码版本不支持' }
		}

		// 验证必要字段
		if (!data.id) {
			return { valid: false, error: '分享码数据不完整' }
		}

		return { valid: true, data }
	} catch (error) {
		console.error('解码分享码失败:', error)
		return { valid: false, error: '分享码解析失败' }
	}
}

// 创建完整的分享码数据
const createShareCodeData = (params) => {
	const {
		// 图片信息
		imagePath,
		imageAspectRatio,
		
		// 拼豆配置
		brand,
		boardSize,
		gridColumns,
		gridRows,
		pixelationMode,
		colorMergeThreshold,
		
		// 显示配置
		showBoard,
		showColorCode,
		
		// 颜色数据（核心）
		colorData,
		
		// 导出配置
		exportSettings,
		authorName,
		watermarkText
	} = params
	
	return {
		// 图片信息
		img: imagePath,
		ratio: imageAspectRatio,
		
		// 拼豆配置
		brand,
		size: boardSize,
		cols: gridColumns,
		rows: gridRows,
		mode: pixelationMode,
		threshold: colorMergeThreshold,
		
		// 显示配置
		board: showBoard,
		colorCode: showColorCode,
		
		// 颜色数据
		colors: colorData,
		
		// 导出配置
		export: exportSettings,
		author: authorName,
		watermark: watermarkText
	}
}

// 从分享码数据恢复所有参数
const restoreFromShareCode = (codeData) => {
	return {
		// 图片信息
		imagePath: codeData.img || '',
		imageAspectRatio: codeData.ratio || 1,
		
		// 拼豆配置
		brand: codeData.brand || 'mard',
		boardSize: codeData.size || 29,
		gridColumns: codeData.cols || 50,
		gridRows: codeData.rows || 50,
		pixelationMode: codeData.mode || 'dominant',
		colorMergeThreshold: codeData.threshold || 30,
		
		// 显示配置
		showBoard: codeData.board !== undefined ? codeData.board : true,
		showColorCode: codeData.colorCode !== undefined ? codeData.colorCode : true,
		
		// 颜色数据
		colorData: codeData.colors || [],
		
		// 导出配置
		exportSettings: codeData.export || null,
		authorName: codeData.author || '',
		watermarkText: codeData.watermark || ''
	}
}

// 生成分享码短链接（用于显示）
const generateShareCodeDisplay = (encodedCode) => {
	// 取前8位作为显示码
	const display = encodedCode.substring(0, 8).toUpperCase()
	return `分享码: ${display}...`
}

export {
	encodeShareCode,
	decodeShareCode,
	createShareCodeData,
	restoreFromShareCode,
	generateShareCodeId,
	generateShareCodeDisplay,
	SHARE_CODE_VERSION
}
