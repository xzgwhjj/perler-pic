<template>
	<view class="design-workshop">
		<!-- 顶部导航栏 -->
		<view class="navbar">
			<text class="title">设计工坊</text>
			<view class="nav-actions">
				<text class="icon" @click="handleUndo">↩</text>
				<text class="icon" @click="handleRedo">↪</text>
				<text class="icon" @click="handleDelete">🗑</text>
			</view>
		</view>

		<!-- 拼豆板画布区域 -->
		<view class="board-section">
			<view class="board-header">
				<text class="board-title">拼豆板</text>
				<text class="board-size">29×29</text>
			</view>
			<view class="grid-container">
				<view v-for="(row, rowIndex) in gridData" :key="rowIndex" class="grid-row">
					<view v-for="(cell, colIndex) in row" :key="colIndex" class="grid-cell"
						:style="{ backgroundColor: cell }" @click="handleCellClick(rowIndex, colIndex)"></view>
				</view>
			</view>
		</view>

		<!-- 开始创作弹窗 -->
		<view v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
			<view class="modal create-modal">
				<text class="modal-title">开始创作</text>
				<text class="modal-subtitle">选择您的创作方式</text>
				<button class="modal-btn primary" @click="handleNewDesign">
          <image src="/static/svg/new.svg" class="btn-icon"></image> 
          <text>新建设计</text>
				</button>
				<button class="modal-btn secondary" @click="openHistoryModal">
					<text class="btn-icon">↦</text> 选择历史
				</button>
			</view>
		</view>

		<!-- 历史记录弹窗 -->
		<view v-if="showHistoryModal" class="modal-overlay" @click.self="closeHistoryModal">
			<view class="modal history-modal">
				<view class="modal-header">
					<text class="modal-title">选择历史记录</text>
					<text class="close-btn" @click="closeHistoryModal">×</text>
				</view>
				<scroll-view class="history-list" scroll-y>
					<view v-for="item in historyList" :key="item.id" class="history-item"
						@click="selectHistoryItem(item)">
						<view class="item-thumb" :style="{ backgroundColor: item.thumbColor }"></view>
						<view class="item-info">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-date">{{ item.date }}</text>
						</view>
						<text class="item-arrow">></text>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 底部工具栏 -->
		<view class="toolbar-section">
			<!-- 工具按钮组 -->
			<view class="tools-group">
				<text class="group-title">工具</text>
				<view class="tools-list">
					<view v-for="tool in tools" :key="tool.id" class="tool-item"
						:class="{ active: selectedTool === tool.id }" @click="selectTool(tool.id)">
						<text class="tool-icon">{{ tool.icon }}</text>
					</view>
				</view>
			</view>

			<!-- 颜色选择区 -->
			<view class="color-group">
				<view class="color-header">
					<text class="group-title">颜色</text>
					<view class="color-tabs">
						<text class="tab-item active">Mard</text>
						<text class="tab-item">Coco</text>
					</view>
				</view>
				<view class="colors-list">
					<view v-for="color in colors" :key="color" class="color-item"
						:class="{ active: selectedColor === color }" :style="{ backgroundColor: color }"
						@click="selectColor(color)"></view>
				</view>
			</view>
		</view>
		<!-- 自定义TabBar -->
		<tabbar :current="1"></tabbar>
	</view>
</template>

<script setup>
import { onMounted, ref } from 'vue'

// -------------------------- 弹窗状态控制 --------------------------
const showCreateModal = ref(true)  // 默认显示「开始创作」弹窗
const showHistoryModal = ref(false)

// -------------------------- 工具配置 --------------------------
const tools = ref([
  { id: 'pen', icon: '✏️' },     // 画笔
  { id: 'eraser', icon: '◇' },   // 橡皮
  { id: 'fill', icon: 'Y' },     // 填充（可替换为油漆桶图标）
  { id: 'line', icon: '✎' },     // 直线工具
  { id: 'shape', icon: 'S' },    // 形状工具
])
const selectedTool = ref('pen')   // 默认选中画笔

// -------------------------- 颜色配置 --------------------------
const colors = ref([
  '#8FB9E6', '#FFFFFF', '#666666', '#7393B3', 
  '#D3D3D3', '#4A7BA7', '#7CCD7C', '#FF99CC'
])
const selectedColor = ref('#8FB9E6')  // 默认选中第一个颜色

// -------------------------- 历史记录数据 --------------------------
const historyList = ref([
  { id: 1, name: '可爱小猫', date: '2024-01-15', thumbColor: '#B8D8FF' },
  { id: 2, name: '星空图案', date: '2024-01-12', thumbColor: '#8FB9E6' },
  { id: 3, name: '简约花朵', date: '2024-01-10', thumbColor: '#FF69B4' },
  { id: 4, name: '像素笑脸', date: '2024-01-08', thumbColor: '#FFC125' },
])

// -------------------------- 画布网格数据（29×29） --------------------------
const gridData = ref([])

// 初始化网格（默认全部为白色）
const initGrid = () => {
  const grid = []
  for (let i = 0; i < 29; i++) {
    const row = []
    for (let j = 0; j < 29; j++) {
      row.push('#FFFFFF')
    }
    grid.push(row)
  }
  gridData.value = grid
}

// -------------------------- 交互方法 --------------------------
// 关闭「开始创作」弹窗
const closeCreateModal = () => {
  showCreateModal.value = false
}

// 新建设计（重置画布）
const handleNewDesign = () => {
  closeCreateModal()
  initGrid()
}

// 打开「历史记录」弹窗
const openHistoryModal = () => {
  showCreateModal.value = false
  showHistoryModal.value = true
}

// 关闭「历史记录」弹窗
const closeHistoryModal = () => {
  showHistoryModal.value = false
}

// 选择历史记录（示例：将画布填充为历史设计的主色）
const selectHistoryItem = (item) => {
  // 这里可以扩展为加载完整的历史网格数据
  gridData.value.forEach(row => {
    row.forEach((_, index) => {
      row[index] = item.thumbColor
    })
  })
  closeHistoryModal()
}

// 选择工具
const selectTool = (toolId) => {
  selectedTool.value = toolId
}

// 选择颜色
const selectColor = (color) => {
  selectedColor.value = color
}

// 点击画布格子（画笔/橡皮核心逻辑）
const handleCellClick = (rowIndex, colIndex) => {
  if (selectedTool.value === 'pen') {
    // 画笔：设置为选中颜色
    gridData.value[rowIndex][colIndex] = selectedColor.value
  } else if (selectedTool.value === 'eraser') {
    // 橡皮：恢复为白色
    gridData.value[rowIndex][colIndex] = '#FFFFFF'
  }
  // 可扩展：填充、直线、形状工具的逻辑
}

// 顶部导航按钮（示例）
const handleUndo = () => console.log('撤销')
const handleRedo = () => console.log('重做')
const handleDelete = () => console.log('清空画布')

// 页面加载时初始化画布
onMounted(() => {
  initGrid()
})
</script>

<style scoped lang="scss">
	@import "@/styles/theme-modern.scss";
.design-workshop {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  font-size: 28rpx;
}

// 顶部导航栏
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  .title {
    font-size: 36rpx;
    font-weight: bold;
  }
  .nav-actions {
    display: flex;
    gap: 30rpx;
    .icon {
      font-size: 32rpx;
      color: #333;
    }
  }
}

// 拼豆板画布区域
.board-section {
  padding: 20rpx 30rpx;
  .board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    .board-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    .board-size {
      color: #666;
    }
  }
  .grid-container {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    .grid-row {
      display: flex;
      justify-content: center;
      .grid-cell {
        width: 20rpx;
        height: 20rpx;
        border: 1rpx solid #eee;
        background-color: #fff;
      }
    }
  }
}

// 弹窗通用样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-card-3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  width: 100%;
  .modal {
    background-color: #fff;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    padding: var(--space-xl);
    box-sizing: border-box;
    width: 672rpx;
    // max-width: 720rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

// 开始创作弹窗
.create-modal {
  .modal-title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16rpx;
  }
  .modal-subtitle {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-bottom: 48rpx;
  }
  .modal-btn {
    width: 100%;
    height: 112rpx;
    border-radius: 28rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32rpx;
    font-weight: 500;
    gap: var(--space-md);
    &:not(:last-child){
      margin-block-start:0rpx;
      margin-block-end:24rpx;
    }
    .btn-icon {
      margin-right: 10rpx;
      width: 38rpx;
      height: 38rpx;
    }
    &.primary {
      background-color: var(--text-primary);
      color: #fff;
      font-weight: 500;
      font-size: 30rpx;
    }
    &.secondary {
      background-color: #fff;
      color: #333;
      border: 1rpx solid #eee;
    }
  }
}

// 历史记录弹窗
.history-modal {
  width: 90%;
  max-width: 700rpx;
  .modal-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    .modal-title {
      font-size: 32rpx;
      font-weight: bold;
    }
    .close-btn {
      font-size: 36rpx;
      color: #666;
    }
  }
  .history-list {
    width: 100%;
    max-height: 600rpx;
    .history-item {
      display: flex;
      align-items: center;
      padding: 20rpx;
      border-bottom: 1rpx solid #eee;
      .item-thumb {
        width: 80rpx;
        height: 80rpx;
        border-radius: 12rpx;
        margin-right: 20rpx;
      }
      .item-info {
        flex: 1;
        .item-name {
          font-size: 30rpx;
          font-weight: bold;
          display: block;
          margin-bottom: 10rpx;
        }
        .item-date {
          font-size: 24rpx;
          color: #666;
        }
      }
      .item-arrow {
        font-size: 32rpx;
        color: #999;
      }
    }
  }
}

// 底部工具栏
.toolbar-section {
  padding: 20rpx 30rpx;
  background-color: #fff;
  margin-top: auto;
  .tools-group, .color-group {
    margin-bottom: 30rpx;
    .group-title {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 20rpx;
    }
  }
  .tools-list {
    display: flex;
    gap: 20rpx;
    .tool-item {
      width: 100rpx;
      height: 80rpx;
      border-radius: 12rpx;
      background-color: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      &.active {
        background-color: #1a1a2e;
        .tool-icon {
          color: #fff;
        }
      }
      .tool-icon {
        font-size: 32rpx;
        color: #333;
      }
    }
  }
  .color-group {
    .color-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      .color-tabs {
        display: flex;
        gap: 20rpx;
        .tab-item {
          padding: 10rpx 20rpx;
          border-radius: 12rpx;
          background-color: #f5f5f5;
          &.active {
            background-color: #e0e0e0;
            font-weight: bold;
          }
        }
      }
    }
    .colors-list {
      display: flex;
      gap: 20rpx;
      .color-item {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        border: 3rpx solid transparent;
        &.active {
          border-color: #333;
        }
      }
    }
  }
}
</style>