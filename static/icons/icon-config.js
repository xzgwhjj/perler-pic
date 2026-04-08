// 图标配置 - 使用base64编码的SVG数据
const icons = {
  // 功能性图标
  camera: {
    name: 'camera',
    width: 24,
    height: 24,
    color: '#64748b',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDE1QzEzLjY1NjkgMTUgMTUgMTMuNjU2OSAxNSAxMkMxNSAxMC4zNDMxIDEzLjY1NjkgOSAxMiA5QzEwLjM0MzEgOSA5IDEwLjM0MzEgOSAxMkM5IDEzLjY1NjkgMTAuMzQzMSAxNSAxMiAxNVoiIGZpbGw9IiM2NDc0OGIiLz4KPHBhdGggZD0iTTE3IDdIMTdDMTcuNTUyMyA3IDE4IDcuNDQ3NzIgMTggOFYxOEMxOCAxOC41NTIzIDE3LjU1MjMgMTkgMTcgMTlIN0M2LjQ0NzcyIDE5IDYgMTguNTUyMyA2IDE4VjhDNiA3LjQ0NzcyIDYuNDQ3NzIgNyA3IDdIN1Y1QzcgNC40NDc3MiA3LjQ0NzcyIDQgOCA0SDE2QzE2LjU1MjMgNCAxNyA0LjQ0NzcyIDE3IDVWN1oiIGZpbGw9IiM2NDc0OGIiLz4KPC9zdmc+'
  },
  
  magic: {
    name: 'magic',
    width: 24,
    height: 24,
    color: '#60a5fa',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDRMMTAgOUw0IDE1TDkgMjBMMTUgMTVMMjAgMTBMMTUgNFoiIGZpbGw9IiM2MGE1ZmEiLz4KPHBhdGggZD0iTTkgNEw0IDlMMSAxMkw0IDE1TDkgMjBMMTIgMTdMMTUgMTVMMjAgMTBMMTcgN0wxNSA5TDEyIDEyTDkgNFoiIGZpbGw9IiM5M2M1ZmQiLz4KPC9zdmc+'
  },
  
  history: {
    name: 'history',
    width: 24,
    height: 24,
    color: '#10b981',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMGI5ODEiLz4KPHBhdGggZD0iTTEyIDZWMTJMMTYgMTQiIGZpbGw9IiNmZmZmZmYiLz4KPC9zdmc+'
  },
  
  palette: {
    name: 'palette',
    width: 24,
    height: 24,
    color: '#f59e0b',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNmNTllMGIiLz4KPGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSI4IiByPSIyIiBmaWxsPSIjZmZmZmZmIi8+CiA8Y2lyY2xlIGN4PSIxMiIgY3k9IjE2IiByPSIyIiBmaWxsPSIjZmZmZmZmIi8+CiA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIyIiBmaWxsPSIjZmZmZmZmIi8+CiA8Y2lyY2xlIGN4PSI4IiBjeT0iMTYiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz4KPC9zdmc+'
  },
  
  // 装饰性图标
  leaf: {
    name: 'leaf',
    width: 32,
    height: 32,
    color: '#10b981',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDZDMTAgMTIgOCAyMCA4IDI4QzE2IDI2IDIwIDIwIDI2IDE2QzIwIDEwIDE2IDggOCA4QzEwIDE2IDE2IDE2IDE2IDE2WiIgZmlsbD0iIzEwYjk4MSIvPgo8L3N2Zz4='
  },
  
  flower: {
    name: 'flower',
    width: 32,
    height: 32,
    color: '#f59e0b',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNCIgZmlsbD0iI2Y1OWUwYiIvPgo8Y2lyY2xlIGN4PSI4IiBjeT0iMTYiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz4KPGNpcmNsZSBjeD0iMjQiIGN5PSIxNiIgcj0iMiIgZmlsbD0iI2ZmZmZmZiIvPgo8Y2lyY2xlIGN4PSIxNiIgY3k9IjgiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz4KPGNpcmNsZSBjeD0iMTYiIGN5PSIyNCIgcj0iMiIgZmlsbD0iI2ZmZmZmZiIvPgo8L3N2Zz4='
  },
  
  sun: {
    name: 'sun',
    width: 32,
    height: 32,
    color: '#fee685',
    svg: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iNiIgZmlsbD0iI2ZlZTY4NSIvPgo8cGF0aCBkPSJNMTYgNlYyIiBmaWxsPSIjZmZmZmZmIi8+CjxwYXRoIGQ9Ik0xNiAyNlYzMCIgZmlsbD0iI2ZmZmZmZiIvPgo8cGF0aCBkPSJNNiAxNkgyIiBmaWxsPSIjZmZmZmZmIi8+CjxwYXRoIGQ9Ik0zMCAxNkgyNiIgZmlsbD0iI2ZmZmZmZiIvPgo8L3N2Zz4='
  }
}

export default icons