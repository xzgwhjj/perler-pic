<template>
	<view class="page-container">
		<!-- 搜索区域 -->
		<view class="search-section">
			<view class="search-box">
				<text class="search-icon">🔍</text>
				<input class="search-input" placeholder="搜索图纸..." placeholder-class="placeholder"
					@input="handleSearch" />
			</view>
			<button class="filter-btn" @click="showFilter = true">
				<text class="filter-icon">⚙️</text>
			</button>
		</view>

		<!-- 项目网格 -->
		<scroll-view class="project-content" scroll-y>
			<!-- 空状态 -->
			<view v-if="projectList.length === 0" class="empty-state">
				<text class="empty-icon">📁</text>
				<text class="empty-title">暂无图纸</text>
				<text class="empty-desc">去首页创建吧</text>
			</view>

			<!-- 项目网格 -->
			<view v-else class="project-grid">
				<view v-for="(project, index) in projectList" :key="project.id" class="project-card card"
					@click="viewProject(project)">
					<image :src="project.thumbnail" class="project-thumb" mode="aspectFill" />
					<view class="project-info">
						<text class="project-name">{{ project.name }}</text>
						<view class="project-meta">
							<text class="meta-item">{{ project.brand }}</text>
							<text class="meta-item">{{ project.size }}×{{ project.size }}</text>
						</view>
					</view>
					<button class="delete-btn" @click.stop="deleteProject(project, index)">
						<text class="delete-icon">🗑️</text>
					</button>
				</view>
			</view>

			<!-- 底部占位 -->
			<view class="bottom-placeholder"></view>
		</scroll-view>

		<!-- 筛选弹窗 -->
		<view v-if="showFilter" class="filter-modal" @click="showFilter = false">
			<view class="filter-content card" @click.stop>
				<view class="filter-header">
					<text class="filter-title">筛选</text>
					<text class="close-btn" @click="showFilter = false">✕</text>
				</view>

				<view class="filter-section">
					<text class="filter-label">品牌</text>
					<view class="filter-tags">
						<view v-for="brand in brands" :key="brand" class="filter-tag"
							:class="{ active: selectedBrand === brand }" @click="selectedBrand = brand">
							{{ brand }}
						</view>
					</view>
				</view>

				<view class="filter-section">
					<text class="filter-label">尺寸</text>
					<view class="filter-tags">
						<view v-for="size in sizes" :key="size" class="filter-tag"
							:class="{ active: selectedSize === size }" @click="selectedSize = size">
							{{ size }}
						</view>
					</view>
				</view>

				<view class="filter-actions">
					<button class="reset-btn" @click="resetFilter">重置</button>
					<button class="confirm-btn" @click="applyFilter">确定</button>
				</view>
			</view>
		</view>

		<!-- 自定义TabBar -->
		<custom :current="1"></custom>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue'
	const searchKeyword = ref('')
	const showFilter = ref(false)
	const selectedBrand = ref('全部')
	const selectedSize = ref('全部')
	const projectList = ref([])
	const allProjects = ref([])
	const brands = ref(['全部', 'Mard', 'Coco'])
	const sizes = ref(['全部', '29', '43', '58'])

	const loadProjects = () => {
		const projects = uni.getStorageSync('projectList') || []
		allProjects.value = projects
		projectList.value = projects

		if (projects.length === 0) {
			allProjects.value = getMockProjects()
			projectList.value = allProjects.value
		}
	}

	const getMockProjects = () => {
		return [{
				id: 1,
				name: '可爱小猫',
				thumbnail: '/static/logo.png',
				brand: 'Mard',
				size: 29,
				createTime: Date.now()
			},
			{
				id: 2,
				name: '樱花图案',
				thumbnail: '/static/logo.png',
				brand: 'Mard',
				size: 43,
				createTime: Date.now()
			},
			{
				id: 3,
				name: '爱心图案',
				thumbnail: '/static/logo.png',
				brand: 'Coco',
				size: 29,
				createTime: Date.now()
			},
			{
				id: 4,
				name: '太阳图案',
				thumbnail: '/static/logo.png',
				brand: 'Mard',
				size: 58,
				createTime: Date.now()
			}
		]
	}

	const handleSearch = (e) => {
		const keyword = e.detail.value.toLowerCase()
		searchKeyword.value = keyword
		filterProjects()
	}

	const resetFilter = () => {
		selectedBrand.value = '全部'
		selectedSize.value = '全部'
	}

	const applyFilter = () => {
		filterProjects()
		showFilter.value = false
	}

	const filterProjects = () => {
		let filtered = [...allProjects.value]

		if (searchKeyword.value) {
			filtered = filtered.filter(p => p.name.toLowerCase().includes(searchKeyword.value))
		}

		if (selectedBrand.value !== '全部') {
			filtered = filtered.filter(p => p.brand === selectedBrand.value)
		}

		if (selectedSize.value !== '全部') {
			const size = parseInt(selectedSize.value)
			filtered = filtered.filter(p => p.size === size)
		}

		projectList.value = filtered
	}

	const viewProject = (project) => {
		uni.navigateTo({
			url: `/pages/project-detail/project-detail?id=${project.id}`
		})
	}

	const deleteProject = (project, index) => {
		uni.showModal({
			title: '提示',
			content: '确定删除这个图纸吗？',
			success: (res) => {
				if (res.confirm) {
					const projects = uni.getStorageSync('projectList') || []
					const newProjects = projects.filter(p => p.id !== project.id)
					uni.setStorageSync('projectList', newProjects)
					projectList.value.splice(index, 1)
					uni.showToast({
						title: '已删除',
						icon: 'success'
					})
				}
			}
		})
	}

	onLoad(() => {
		loadProjects()
	})

	onShow(() => {
		loadProjects()
	})
</script>

<style lang="scss" scoped>
	@import '@/styles/theme-modern.scss';

	.page-container {
		min-height: 100vh;
		background: var(--bg-primary);
		display: flex;
		flex-direction: column;
	}

	.search-section {
		padding: var(--space-lg);
		display: flex;
		gap: var(--space-md);
		border-bottom: 1rpx solid var(--border-light);
	}

	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		padding: 0 var(--space-md);

		.search-icon {
			font-size: var(--text-lg);
			margin-right: var(--space-sm);
		}

		.search-input {
			flex: 1;
			font-size: var(--text-base);
			color: var(--text-primary);
			height: 72rpx;
		}

		.placeholder {
			color: var(--text-muted);
		}
	}

	.filter-btn {
		width: 72rpx;
		height: 72rpx;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;

		.filter-icon {
			font-size: var(--text-xl);
		}
	}

	.project-content {
		flex: 1;
		padding: var(--space-lg);
	}

	.empty-state {
		text-align: center;
		padding: 120rpx 0;

		.empty-icon {
			font-size: 120rpx;
			display: block;
			margin-bottom: var(--space-md);
			opacity: 0.5;
		}

		.empty-title {
			font-size: var(--text-lg);
			color: var(--text-secondary);
			display: block;
			margin-bottom: var(--space-sm);
		}

		.empty-desc {
			font-size: var(--text-sm);
			color: var(--text-muted);
			display: block;
		}
	}

	.project-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-md);
	}

	.project-card {
		position: relative;
		overflow: hidden;

		.project-thumb {
			width: 100%;
			height: 280rpx;
			background: var(--bg-secondary);
		}

		.project-info {
			padding: var(--space-md);

			.project-name {
				font-size: var(--text-base);
				font-weight: 600;
				color: var(--text-primary);
				display: block;
				margin-bottom: var(--space-xs);
			}

			.project-meta {
				display: flex;
				gap: var(--space-xs);

				.meta-item {
					font-size: var(--text-xs);
					color: var(--text-muted);
					padding: 4rpx var(--space-sm);
					background: var(--bg-secondary);
					border-radius: var(--radius-sm);
				}
			}
		}

		.delete-btn {
			position: absolute;
			top: var(--space-sm);
			right: var(--space-sm);
			width: 56rpx;
			height: 56rpx;
			background: rgba(0, 0, 0, 0.5);
			border-radius: 50%;
			border: none;
			display: flex;
			align-items: center;
			justify-content: center;

			.delete-icon {
				font-size: var(--text-lg);
			}
		}
	}

	.filter-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		z-index: 999;
	}

	.filter-content {
		width: 100%;
		max-height: 60vh;
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		padding: var(--space-lg);
	}

	.filter-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-xl);

		.filter-title {
			font-size: var(--text-xl);
			font-weight: 600;
			color: var(--text-primary);
		}

		.close-btn {
			font-size: var(--text-xl);
			color: var(--text-muted);
			padding: var(--space-sm);
		}
	}

	.filter-section {
		margin-bottom: var(--space-xl);

		.filter-label {
			font-size: var(--text-base);
			font-weight: 600;
			color: var(--text-secondary);
			display: block;
			margin-bottom: var(--space-md);
		}
	}

	.filter-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);

		.filter-tag {
			padding: var(--space-sm) var(--space-md);
			background: var(--bg-secondary);
			border-radius: var(--radius-md);
			font-size: var(--text-base);

			&.active {
				background: var(--accent-light);
				color: var(--accent-primary);
			}
		}
	}

	.filter-actions {
		display: flex;
		gap: var(--space-md);
		margin-top: var(--space-xl);

		.reset-btn,
		.confirm-btn {
			flex: 1;
			height: 80rpx;
			border-radius: var(--radius-md);
			font-size: var(--text-base);
			font-weight: 500;
			border: none;
		}

		.reset-btn {
			background: var(--bg-secondary);
			color: var(--text-secondary);
		}

		.confirm-btn {
			background: var(--accent-primary);
			color: white;
		}
	}

	/* 底部占位 */
	.bottom-placeholder {
		height: 200rpx;
	}
</style>