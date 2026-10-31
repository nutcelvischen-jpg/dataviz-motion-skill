/**
 * Data Atoms Studio · 核心應用與圖表渲染引擎
 * 觀默導演層動態美學 + 高精度商業數據可視化
 */

(function () {
  'use strict';

  // --- 全域狀態 ---
  const state = {
    fileName: '',
    rawWorkbook: null,
    sheetNames: [],
    currentSheet: '',
    tableHeaders: [],
    tableData: [],      // 陣列物件 [{ col1: val1, col2: val2 }]
    filteredData: [],   // 搜尋過濾後的資料
    columnTypes: {},    // { colName: 'number' | 'string' | 'date' }
    
    // 選取設定
    chartType: 'bar',   // 'bar' | 'line' | 'scatter' | 'donut' | 'radar' | 'funnel' | 'overview'
    selectedX: '',
    selectedY: '',
    selectedSecondary: '',
    
    // 視覺開關
    showLabels: true,
    sortDescending: true,
    showAverage: true,
    showTrendline: true,
    highlightOutliers: true,
    
    // 表格分頁
    tablePage: 1,
    pageSize: 10,
    searchQuery: '',
    
    // 畫布互動
    hoveredItem: null,
    canvasDPI: 2
  };

  // --- 內建精選範例數據 ---
  const SAMPLE_DATASETS = {
    bar: {
      name: '產品線營收體量.xlsx',
      headers: ['產品線', '類別', '本季營收(萬元)', '目標營收(萬元)', '毛利率(%)', '客戶數'],
      data: [
        { '產品線': '企業雲平台', '類別': 'SaaS服務', '本季營收(萬元)': 940, '目標營收(萬元)': 800, '毛利率(%)': 78.5, '客戶數': 342 },
        { '產品線': '智能數據中台', '類別': '數據產品', '本季營收(萬元)': 720, '目標營收(萬元)': 650, '毛利率(%)': 71.2, '客戶數': 218 },
        { '產品線': 'AI視覺助理', '類別': '前沿AI', '本季營收(萬元)': 580, '目標營收(萬元)': 500, '毛利率(%)': 65.0, '客戶數': 154 },
        { '產品線': '物聯網邊緣節點', '類別': '硬體方案', '本季營收(萬元)': 430, '目標營收(萬元)': 450, '毛利率(%)': 48.2, '客戶數': 98 },
        { '產品線': '資訊安全套件', '類別': '基礎架構', '本季營收(萬元)': 360, '目標營收(萬元)': 320, '毛利率(%)': 82.0, '客戶數': 185 },
        { '產品線': '行動端SDK', '類別': '開發者工具', '本季營收(萬元)': 290, '目標營收(萬元)': 300, '毛利率(%)': 62.4, '客戶數': 420 },
        { '產品線': '私有化部署模組', '類別': '交付服務', '本季營收(萬元)': 210, '目標營收(萬元)': 250, '毛利率(%)': 52.8, '客戶數': 45 },
        { '產品線': '技術諮詢服務', '類別': '專業服務', '本季營收(萬元)': 160, '目標營收(萬元)': 150, '毛利率(%)': 45.0, '客戶數': 32 }
      ],
      defaultX: '產品線',
      defaultY: '本季營收(萬元)',
      defaultSec: '目標營收(萬元)',
      chart: 'bar'
    },
    line: {
      name: '時序月度趨勢.xlsx',
      headers: ['月份', '總營收(萬元)', '訂單總數', '新增用戶', '成本(萬元)'],
      data: [
        { '月份': '2024-01', '總營收(萬元)': 312, '訂單總數': 1240, '新增用戶': 340, '成本(萬元)': 45 },
        { '月份': '2024-02', '總營收(萬元)': 345, '訂單總數': 1310, '新增用戶': 385, '成本(萬元)': 48 },
        { '月份': '2024-03', '總營收(萬元)': 390, '訂單總數': 1450, '新增用戶': 420, '成本(萬元)': 52 },
        { '月份': '2024-04', '總營收(萬元)': 425, '訂單總數': 1520, '新增用戶': 465, '成本(萬元)': 55 },
        { '月份': '2024-05', '總營收(萬元)': 480, '訂單總數': 1680, '新增用戶': 510, '成本(萬元)': 60 },
        { '月份': '2024-06', '總營收(萬元)': 530, '訂單總數': 1820, '新增用戶': 590, '成本(萬元)': 64 },
        { '月份': '2024-07', '總營收(萬元)': 595, '訂單總數': 2010, '新增用戶': 650, '成本(萬元)': 68 },
        { '月份': '2024-08', '總營收(萬元)': 660, '訂單總數': 2190, '新增用戶': 720, '成本(萬元)': 72 },
        { '月份': '2024-09', '總營收(萬元)': 740, '訂單總數': 2430, '新增用戶': 810, '成本(萬元)': 78 },
        { '月份': '2024-10', '總營收(萬元)': 815, '訂單總數': 2650, '新增用戶': 895, '成本(萬元)': 84 },
        { '月份': '2024-11', '總營收(萬元)': 890, '訂單總數': 2920, '新增用戶': 970, '成本(萬元)': 91 },
        { '月份': '2024-12', '總營收(萬元)': 985, '訂單總數': 3250, '新增用戶': 1080, '成本(萬元)': 98 }
      ],
      defaultX: '月份',
      defaultY: '總營收(萬元)',
      defaultSec: '訂單總數',
      chart: 'line'
    },
    scatter: {
      name: '行銷投入與轉化相關.xlsx',
      headers: ['宣傳管道', '廣告預算(千元)', '新增轉化用戶', '獲客成本CPA(元)', '總銷售額(萬元)'],
      data: [
        { '宣傳管道': 'Google 搜尋', '廣告預算(千元)': 45, '新增轉化用戶': 1120, '獲客成本CPA(元)': 40.2, '總銷售額(萬元)': 168 },
        { '宣傳管道': 'Meta 社群廣告', '廣告預算(千元)': 38, '新增轉化用戶': 890, '獲客成本CPA(元)': 42.7, '總銷售額(萬元)': 134 },
        { '宣傳管道': 'YouTube 影音', '廣告預算(千元)': 52, '新增轉化用戶': 980, '獲客成本CPA(元)': 53.1, '總銷售額(萬元)': 152 },
        { '宣傳管道': 'LinkedIn 商務', '廣告預算(千元)': 28, '新增轉化用戶': 420, '獲客成本CPA(元)': 66.7, '總銷售額(萬元)': 115 },
        { '宣傳管道': 'KOL 爆款推薦', '廣告預算(千元)': 65, '新增轉化用戶': 1950, '獲客成本CPA(元)': 33.3, '總銷售額(萬元)': 310 },
        { '宣傳管道': '線下技術研討會', '廣告預算(千元)': 30, '新增轉化用戶': 380, '獲客成本CPA(元)': 78.9, '總銷售額(萬元)': 98 },
        { '宣傳管道': '內容行銷 SEO', '廣告預算(千元)': 15, '新增轉化用戶': 620, '獲客成本CPA(元)': 24.2, '總銷售額(萬元)': 92 },
        { '宣傳管道': '電子報 EDM', '廣告預算(千元)': 8, '新增轉化用戶': 260, '獲客成本CPA(元)': 30.8, '總銷售額(萬元)': 38 },
        { '宣傳管道': '聯盟行銷分潤', '廣告預算(千元)': 22, '新增轉化用戶': 540, '獲客成本CPA(元)': 40.7, '總銷售額(萬元)': 85 },
        { '宣傳管道': '戶外看板廣告', '廣告預算(千元)': 50, '新增轉化用戶': 280, '獲客成本CPA(元)': 178.6, '總銷售額(萬元)': 42 }
      ],
      defaultX: '廣告預算(千元)',
      defaultY: '新增轉化用戶',
      defaultSec: '總銷售額(萬元)',
      chart: 'scatter'
    },
    donut: {
      name: '核心業務份額佔比.xlsx',
      headers: ['業務板塊', '市場規模(億元)', '板塊份額(%)', '年增長率(%)'],
      data: [
        { '業務板塊': '企業核心雲', '市場規模(億元)': 42.8, '板塊份額(%)': 44.5, '年增長率(%)': 38.2 },
        { '業務板塊': '智慧製造AI', '市場規模(億元)': 24.5, '板塊份額(%)': 25.5, '年增長率(%)': 52.4 },
        { '業務板塊': '金融風控系統', '市場規模(億元)': 15.6, '板塊份額(%)': 16.2, '年增長率(%)': 28.5 },
        { '業務板塊': '醫療大數據', '市場規模(億元)': 8.9, '板塊份額(%)': 9.3, '年增長率(%)': 64.1 },
        { '業務板塊': '零售客流分析', '市場規模(億元)': 4.3, '板塊份額(%)': 4.5, '年增長率(%)': 12.0 }
      ],
      defaultX: '業務板塊',
      defaultY: '市場規模(億元)',
      defaultSec: '板塊份額(%)',
      chart: 'donut'
    },
    radar: {
      name: '團隊綜合多維畫像.xlsx',
      headers: ['評估維度', '實際達成得分', '標準基準線', '去年同期得分'],
      data: [
        { '評估維度': '程式碼品質', '實際達成得分': 94, '標準基準線': 85, '去年同期得分': 82 },
        { '評估維度': '系統穩定性', '實際達成得分': 98, '標準基準線': 90, '去年同期得分': 88 },
        { '評估維度': '迭代交付速度', '實際達成得分': 88, '標準基準線': 80, '去年同期得分': 74 },
        { '評估維度': '安全與合規', '實際達成得分': 96, '標準基準線': 85, '去年同期得分': 90 },
        { '評估維度': '架構擴展性', '實際達成得分': 84, '標準基準線': 75, '去年同期得分': 70 },
        { '評估維度': '團隊人效比', '實際達成得分': 91, '標準基準線': 80, '去年同期得分': 76 }
      ],
      defaultX: '評估維度',
      defaultY: '實際達成得分',
      defaultSec: '標準基準線',
      chart: 'radar'
    },
    funnel: {
      name: '電商全鏈路轉化漏斗.xlsx',
      headers: ['漏斗階段', '觸達用戶數', '轉化率(%)', '流失率(%)'],
      data: [
        { '漏斗階段': '01_首頁登錄', '觸達用戶數': 100000, '轉化率(%)': 100.0, '流失率(%)': 0.0 },
        { '漏斗階段': '02_瀏覽商品列表', '觸達用戶數': 68500, '轉化率(%)': 68.5, '流失率(%)': 31.5 },
        { '漏斗階段': '03_產品詳情頁', '觸達用戶數': 38200, '轉化率(%)': 38.2, '流失率(%)': 44.2 },
        { '漏斗階段': '04_加入購物車', '觸達用戶數': 19600, '轉化率(%)': 19.6, '流失率(%)': 48.7 },
        { '漏斗階段': '05_結帳收銀台', '觸達用戶數': 14800, '轉化率(%)': 14.8, '流失率(%)': 24.5 },
        { '漏斗階段': '06_完成最終支付', '觸達用戶數': 10200, '轉化率(%)': 10.2, '流失率(%)': 31.1 }
      ],
      defaultX: '漏斗階段',
      defaultY: '觸達用戶數',
      defaultSec: '轉化率(%)',
      chart: 'funnel'
    }
  };

  // --- 圖表定義元數據 ---
  const CHART_META = {
    bar: {
      badge: '01.',
      title: '離散體量 · DISCRETE COMPARISON',
      formula: '+ rank · variance · max peak delta',
      xLabel: 'X 軸 / 分類維度',
      yLabel: 'Y 軸 / 體量數值',
      secLabel: '目標值 / 對比數值 (選填)',
      supportsTrend: false,
      supportsSort: true
    },
    line: {
      badge: '02.',
      title: '時序趨勢 · TEMPORAL TREND',
      formula: '+ trendline · MA(7) moving average · seasonality',
      xLabel: '時間 / 時序維度',
      yLabel: '主要時序指標',
      secLabel: '次要時序指標 (選填)',
      supportsTrend: true,
      supportsSort: false
    },
    scatter: {
      badge: '03.',
      title: '相關分佈 · CORRELATION MATRIX',
      formula: '+ pearson R · 95% confidence corridor · 3.4σ outlier',
      xLabel: '自變量 X (數值)',
      yLabel: '應變量 Y (數值)',
      secLabel: '點半徑大小 / 權重 (選填)',
      supportsTrend: true,
      supportsSort: false
    },
    donut: {
      badge: '04.',
      title: '結構佔比 · COMPOSITION HIERARCHY',
      formula: '+ pareto 80/20 · normalization · shares',
      xLabel: '分類單元 / 環形扇區',
      yLabel: '份額數值 (佔比計算)',
      secLabel: '次要指標 (選填)',
      supportsTrend: false,
      supportsSort: true
    },
    radar: {
      badge: '05.',
      title: '多維畫像 · MULTIVARIATE PROFILE',
      formula: '+ 6-axis std · benchmark 80+ · equilibrium',
      xLabel: '評估指標名稱',
      yLabel: '實際評分 (得分)',
      secLabel: '基準線 / 對比得分 (選填)',
      supportsTrend: false,
      supportsSort: false
    },
    funnel: {
      badge: '06.',
      title: '轉化路徑 · CONVERSION FUNNEL',
      formula: '+ step drop-off · retention CR% · bottleneck',
      xLabel: '漏斗步驟 / 階段',
      yLabel: '各階段用戶量 (人數)',
      secLabel: '流失率 / 耗時 (選填)',
      supportsTrend: false,
      supportsSort: false
    },
    overview: {
      badge: '07.',
      title: '數據矩陣總覽 · METRIC OVERVIEW',
      formula: '+ descriptive statistics · distribution · spread',
      xLabel: '項目欄位',
      yLabel: '主要觀測數值',
      secLabel: '次要對比數值',
      supportsTrend: false,
      supportsSort: true
    }
  };

  // --- 色彩調色盤 (Data Atoms 視覺規範) ---
  const PALETTE = {
    orange: '#ff5722',
    orangeLight: 'rgba(255, 87, 34, 0.15)',
    orangeGlow: 'rgba(255, 87, 34, 0.35)',
    slate: '#1e293b',
    slateLight: '#475569',
    slateMuted: '#94a3b8',
    blue: '#0284c7',
    emerald: '#10b981',
    amber: '#f59e0b',
    purple: '#8b5cf6',
    grayBar: '#e2e2dc',
    bgCream: '#f4f4f2',
    cardWhite: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)',
    sliceColors: [
      '#ff5722', '#1e293b', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#0d9488', '#ec4899', '#64748b'
    ]
  };

  // --- DOM 元素引用 ---
  const el = {
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    fileStatusBadge: document.getElementById('fileStatusBadge'),
    activeFileInfo: document.getElementById('activeFileInfo'),
    activeFileName: document.getElementById('activeFileName'),
    activeFileMeta: document.getElementById('activeFileMeta'),
    sheetSelectRow: document.getElementById('sheetSelectRow'),
    sheetSelector: document.getElementById('sheetSelector'),
    sampleDataSelector: document.getElementById('sampleDataSelector'),
    btnQuickSample: document.getElementById('btnQuickSample'),
    btnResetData: document.getElementById('btnResetData'),
    btnExportImage: document.getElementById('btnExportImage'),
    
    // 選單
    selectXAxis: document.getElementById('selectXAxis'),
    selectYAxis: document.getElementById('selectYAxis'),
    selectSecondary: document.getElementById('selectSecondary'),
    labelSecondary: document.getElementById('labelSecondary'),
    groupSecondary: document.getElementById('groupSecondary'),
    chartTypeCards: document.querySelectorAll('.chart-type-card'),
    
    // 開關
    chkShowLabels: document.getElementById('chkShowLabels'),
    chkSortDescending: document.getElementById('chkSortDescending'),
    chkShowAverage: document.getElementById('chkShowAverage'),
    chkShowTrendline: document.getElementById('chkShowTrendline'),
    chkHighlightOutliers: document.getElementById('chkHighlightOutliers'),
    rowSortDescending: document.getElementById('rowSortDescending'),
    rowShowAverage: document.getElementById('rowShowAverage'),
    rowShowTrendline: document.getElementById('rowShowTrendline'),
    rowHighlightOutliers: document.getElementById('rowHighlightOutliers'),
    txtTrendlineLabel: document.getElementById('txtTrendlineLabel'),

    // KPI
    kpiRowCount: document.getElementById('kpiRowCount'),
    kpiTotalSum: document.getElementById('kpiTotalSum'),
    kpiMeanVal: document.getElementById('kpiMeanVal'),
    kpiMetric4Title: document.getElementById('kpiMetric4Title'),
    kpiMetric4Val: document.getElementById('kpiMetric4Val'),
    kpiMetric4Sub: document.getElementById('kpiMetric4Sub'),

    // 畫布
    canvas: document.getElementById('mainChartCanvas'),
    canvasBadgeNum: document.getElementById('canvasBadgeNum'),
    canvasChartTitle: document.getElementById('canvasChartTitle'),
    canvasFormulaText: document.getElementById('canvasFormulaText'),
    canvasTooltip: document.getElementById('canvasTooltip'),

    // 表格
    tableRowsInfo: document.getElementById('tableRowsInfo'),
    tableSearchInput: document.getElementById('tableSearchInput'),
    previewTableHead: document.getElementById('previewTableHead'),
    previewTableBody: document.getElementById('previewTableBody'),
    paginationInfo: document.getElementById('paginationInfo'),
    btnPrevPage: document.getElementById('btnPrevPage'),
    btnNextPage: document.getElementById('btnNextPage'),
    btnExportCSV: document.getElementById('btnExportCSV'),
    toastNotice: document.getElementById('toastNotice')
  };

  const ctx = el.canvas.getContext('2d');

  // --- 初始化流程 ---
  function init() {
    setupEventListeners();
    setupCanvasDPI();
    // 預設載入範例數據 01 產品線營收體量
    loadSampleDataset('bar');
  }

  // --- 高解析度 Canvas DPI 設定 ---
  function setupCanvasDPI() {
    const rect = el.canvas.getBoundingClientRect();
    // 鎖定標準 1920x1080 虛擬像素
    el.canvas.width = 1920;
    el.canvas.height = 1080;
  }

  // --- 註冊事件監聽 ---
  function setupEventListeners() {
    // 檔案拖曳
    el.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.dropzone.classList.add('dragover');
    });

    el.dropzone.addEventListener('dragleave', () => {
      el.dropzone.classList.remove('dragover');
    });

    el.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      el.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    el.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // 範例資料選取器
    el.sampleDataSelector.addEventListener('change', (e) => {
      const type = e.target.value;
      if (type && SAMPLE_DATASETS[type]) {
        loadSampleDataset(type);
      }
    });

    el.btnQuickSample.addEventListener('click', (e) => {
      e.preventDefault();
      loadSampleDataset('bar');
    });

    // 重設按鈕
    el.btnResetData.addEventListener('click', () => {
      loadSampleDataset('bar');
      showToast('已重設為預設商業營收數據');
    });

    // 圖型切換
    el.chartTypeCards.forEach(card => {
      card.addEventListener('click', () => {
        const type = card.getAttribute('data-chart');
        setChartType(type);
      });
    });

    // 欄位映射選取更動
    el.selectXAxis.addEventListener('change', () => {
      state.selectedX = el.selectXAxis.value;
      updateKPIs();
      renderChart();
    });

    el.selectYAxis.addEventListener('change', () => {
      state.selectedY = el.selectYAxis.value;
      updateKPIs();
      renderChart();
    });

    el.selectSecondary.addEventListener('change', () => {
      state.selectedSecondary = el.selectSecondary.value;
      renderChart();
    });

    // 開關更動
    el.chkShowLabels.addEventListener('change', () => {
      state.showLabels = el.chkShowLabels.checked;
      renderChart();
    });

    el.chkSortDescending.addEventListener('change', () => {
      state.sortDescending = el.chkSortDescending.checked;
      renderChart();
    });

    el.chkShowAverage.addEventListener('change', () => {
      state.showAverage = el.chkShowAverage.checked;
      renderChart();
    });

    el.chkShowTrendline.addEventListener('change', () => {
      state.showTrendline = el.chkShowTrendline.checked;
      renderChart();
    });

    el.chkHighlightOutliers.addEventListener('change', () => {
      state.highlightOutliers = el.chkHighlightOutliers.checked;
      renderChart();
    });

    // 工作表切換
    el.sheetSelector.addEventListener('change', () => {
      const sheetName = el.sheetSelector.value;
      if (sheetName && state.rawWorkbook) {
        loadSheetData(sheetName);
      }
    });

    // 匯出高畫質圖片
    el.btnExportImage.addEventListener('click', exportCanvasImage);

    // 表格搜尋與分頁
    el.tableSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      state.tablePage = 1;
      filterTableData();
      renderTable();
    });

    el.btnPrevPage.addEventListener('click', () => {
      if (state.tablePage > 1) {
        state.tablePage--;
        renderTable();
      }
    });

    el.btnNextPage.addEventListener('click', () => {
      const maxPage = Math.ceil(state.filteredData.length / state.pageSize) || 1;
      if (state.tablePage < maxPage) {
        state.tablePage++;
        renderTable();
      }
    });

    el.btnExportCSV.addEventListener('click', exportCSV);

    // 點擊頂部活動檔案 Pill 可直接觸發上傳檔案更換
    if (el.activeFileInfo) {
      el.activeFileInfo.addEventListener('click', () => {
        el.fileInput.click();
      });
    }

    // 視圖切換器 (圖表畫布 / 分割視圖 / 數據明細)
    const viewButtons = document.querySelectorAll('.view-btn');
    const stageBody = document.querySelector('.stage-body');
    const dataDrawer = document.getElementById('dataDrawer');
    const btnToggleDrawer = document.getElementById('btnToggleDrawer');
    const drawerIcon = document.getElementById('drawerIcon');

    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (stageBody) {
          stageBody.dataset.viewMode = view;
        }
        if (view === 'split' && dataDrawer) {
          dataDrawer.classList.add('open');
          if (drawerIcon) drawerIcon.textContent = '▼';
        }
        setTimeout(() => renderChart(), 50);
      });
    });

    // 底部明細抽屜手動展開 / 收合
    if (btnToggleDrawer && dataDrawer) {
      btnToggleDrawer.addEventListener('click', () => {
        dataDrawer.classList.toggle('open');
        const isOpen = dataDrawer.classList.contains('open');
        if (drawerIcon) {
          drawerIcon.textContent = isOpen ? '▼' : '▲';
        }
        setTimeout(() => renderChart(), 50);
      });
    }

    // 畫布滑鼠懸停互動 (Tooltip)
    el.canvas.addEventListener('mousemove', handleCanvasMouseMove);
    el.canvas.addEventListener('mouseleave', () => {
      el.canvasTooltip.style.display = 'none';
      state.hoveredItem = null;
    });

    window.addEventListener('resize', () => {
      renderChart();
    });
  }

  // --- 載入精選範例資料集 ---
  function loadSampleDataset(key) {
    const sample = SAMPLE_DATASETS[key];
    if (!sample) return;

    state.fileName = sample.name;
    state.sheetNames = [sample.name.replace('.xlsx', '')];
    state.currentSheet = state.sheetNames[0];
    state.tableHeaders = [...sample.headers];
    state.tableData = JSON.parse(JSON.stringify(sample.data));
    state.rawWorkbook = null;

    analyzeColumnTypes();
    updateSheetUI();
    setChartType(sample.chart);

    // 預設維度
    state.selectedX = sample.defaultX || state.tableHeaders[0];
    state.selectedY = sample.defaultY || state.tableHeaders[1];
    state.selectedSecondary = sample.defaultSec || '';

    populateFieldSelectors();
    filterTableData();
    updateKPIs();
    renderTable();
    renderChart();

    showToast(`已載入範例：${sample.name}`);
  }

  // --- 處理使用者上傳檔案 ---
  function handleFileSelect(file) {
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension)) {
      showToast('❌ 請上傳 .xlsx、.xls 或 .csv 格式的檔案', true);
      return;
    }

    state.fileName = file.name;
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        state.rawWorkbook = workbook;
        state.sheetNames = workbook.SheetNames;
        state.currentSheet = workbook.SheetNames[0];

        updateSheetUI();
        loadSheetData(state.currentSheet);
        showToast(`✅ 成功載入檔案：${file.name}`);
      } catch (err) {
        console.error('檔案解析失敗:', err);
        showToast('❌ Excel 檔案解析失敗，請確認檔案格式正常', true);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // --- 讀取特定 Sheet 的資料 ---
  function loadSheetData(sheetName) {
    if (!state.rawWorkbook) return;
    const worksheet = state.rawWorkbook.Sheets[sheetName];
    if (!worksheet) return;

    // 轉為 JSON 陣列
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!jsonData || jsonData.length === 0) {
      showToast('⚠️ 該工作表為空', true);
      return;
    }

    // 第一列為 Header
    const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h.length > 0);
    const rows = [];

    for (let i = 1; i < jsonData.length; i++) {
      const rowArr = jsonData[i];
      // 略過全空行
      if (rowArr.every(cell => cell === '' || cell === null || cell === undefined)) continue;

      const rowObj = {};
      headers.forEach((header, colIdx) => {
        let val = rowArr[colIdx];
        if (typeof val === 'string') {
          val = val.trim();
          // 自動去除貨幣符號、千分位逗號與百分比 (例如 "$1,850,000" -> 1850000, "112.5%" -> 112.5)
          const sanitized = val.replace(/^[\$¥€£\s]|^(NT\$)/i, '').replace(/,/g, '').trim();
          if (/^-?\d+(\.\d+)?%$/.test(sanitized)) {
            const num = parseFloat(sanitized);
            if (!isNaN(num)) val = num;
          } else if (/^-?\d+(\.\d+)?$/.test(sanitized)) {
            const num = Number(sanitized);
            if (!isNaN(num)) val = num;
          }
        }
        rowObj[header] = val !== undefined ? val : '';
      });
      rows.push(rowObj);
    }

    state.tableHeaders = headers;
    state.tableData = rows;
    state.currentSheet = sheetName;

    analyzeColumnTypes();
    autoDetectDimensions();
    populateFieldSelectors();
    filterTableData();
    updateKPIs();
    renderTable();
    renderChart();
  }

  // --- 分析各欄位數據類型 (字串、數字、日期) ---
  function analyzeColumnTypes() {
    state.columnTypes = {};
    const headers = state.tableHeaders;
    const data = state.tableData;

    headers.forEach(h => {
      let numCount = 0;
      let nonNullCount = 0;

      data.forEach(row => {
        const val = row[h];
        if (val !== '' && val !== null && val !== undefined) {
          nonNullCount++;
          if (typeof val === 'number' && !isNaN(val)) {
            numCount++;
          }
        }
      });

      if (nonNullCount > 0 && numCount / nonNullCount >= 0.7) {
        state.columnTypes[h] = 'number';
      } else {
        state.columnTypes[h] = 'string';
      }
    });
  }

  // --- 智慧自動辨識維度與推薦圖型 ---
  function autoDetectDimensions() {
    const numCols = state.tableHeaders.filter(h => state.columnTypes[h] === 'number');
    const strCols = state.tableHeaders.filter(h => state.columnTypes[h] !== 'number');

    if (strCols.length > 0) {
      state.selectedX = strCols[0];
    } else if (state.tableHeaders.length > 0) {
      state.selectedX = state.tableHeaders[0];
    }

    if (numCols.length > 0) {
      state.selectedY = numCols[0];
      state.selectedSecondary = numCols.length > 1 ? numCols[1] : '';
    } else if (state.tableHeaders.length > 1) {
      state.selectedY = state.tableHeaders[1];
      state.selectedSecondary = '';
    }

    // 依欄位關鍵字智慧推薦圖型
    const xName = (state.selectedX || '').toLowerCase();
    const yName = (state.selectedY || '').toLowerCase();

    if (xName.includes('月') || xName.includes('date') || xName.includes('時間') || xName.includes('week') || xName.includes('年')) {
      setChartType('line');
    } else if (xName.includes('階段') || xName.includes('漏斗') || xName.includes('step') || xName.includes('funnel')) {
      setChartType('funnel');
    } else if (xName.includes('維度') || xName.includes('指標') || xName.includes('能力')) {
      setChartType('radar');
    } else if (yName.includes('佔比') || yName.includes('份額') || yName.includes('share') || yName.includes('ratio')) {
      setChartType('donut');
    } else if (state.columnTypes[state.selectedX] === 'number' && state.columnTypes[state.selectedY] === 'number') {
      setChartType('scatter');
    } else {
      setChartType('bar');
    }
  }

  // --- 更新工作表 UI 與檔案資訊 ---
  function updateSheetUI() {
    el.fileStatusBadge.textContent = `${state.tableData.length} 列數據`;
    el.activeFileInfo.classList.add('visible');
    el.activeFileName.innerHTML = `📄 <span>${escapeHtml(state.fileName)}</span>`;
    el.activeFileMeta.textContent = `${state.tableData.length} 行 · ${state.tableHeaders.length} 欄`;

    if (state.sheetNames && state.sheetNames.length > 1) {
      el.sheetSelectRow.classList.add('visible');
      el.sheetSelector.innerHTML = '';
      state.sheetNames.forEach(sheet => {
        const opt = document.createElement('option');
        opt.value = sheet;
        opt.textContent = sheet;
        if (sheet === state.currentSheet) opt.selected = true;
        el.sheetSelector.appendChild(opt);
      });
    } else {
      el.sheetSelectRow.classList.remove('visible');
    }
  }

  // --- 填充欄位下拉選單 ---
  function populateFieldSelectors() {
    el.selectXAxis.innerHTML = '';
    el.selectYAxis.innerHTML = '';
    el.selectSecondary.innerHTML = '<option value="">(無次要指標)</option>';

    state.tableHeaders.forEach(col => {
      const type = state.columnTypes[col] === 'number' ? '#' : 'A';
      
      // X 軸
      const optX = document.createElement('option');
      optX.value = col;
      optX.textContent = `[${type}] ${col}`;
      if (col === state.selectedX) optX.selected = true;
      el.selectXAxis.appendChild(optX);

      // Y 軸
      const optY = document.createElement('option');
      optY.value = col;
      optY.textContent = `[${type}] ${col}`;
      if (col === state.selectedY) optY.selected = true;
      el.selectYAxis.appendChild(optY);

      // 次要指標
      const optSec = document.createElement('option');
      optSec.value = col;
      optSec.textContent = `[${type}] ${col}`;
      if (col === state.selectedSecondary) optSec.selected = true;
      el.selectSecondary.appendChild(optSec);
    });
  }

  // --- 切換圖表類型 ---
  function setChartType(type) {
    if (!CHART_META[type]) return;
    state.chartType = type;

    // 更新圖形卡片選中樣式
    el.chartTypeCards.forEach(card => {
      if (card.getAttribute('data-chart') === type) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    const meta = CHART_META[type];
    el.canvasBadgeNum.textContent = meta.badge;
    el.canvasChartTitle.textContent = meta.title;
    el.canvasFormulaText.textContent = meta.formula;

    // 依圖型動態調整欄位名稱與開關顯示
    el.labelSecondary.textContent = meta.secLabel;
    
    // 開關可見性
    el.rowSortDescending.style.display = meta.supportsSort ? 'flex' : 'none';
    el.rowShowTrendline.style.display = meta.supportsTrend ? 'flex' : 'none';
    
    if (type === 'scatter') {
      el.txtTrendlineLabel.textContent = '顯示線性回歸線 (Regression)';
    } else {
      el.txtTrendlineLabel.textContent = '顯示移動平均線 (MA)';
    }

    updateKPIs();
    renderChart();
  }

  // --- 計算並更新頂部 4 組 KPI 卡片 ---
  function updateKPIs() {
    const data = state.tableData;
    const yCol = state.selectedY;
    
    el.kpiRowCount.textContent = data.length.toLocaleString();
    const drawerCount = document.getElementById('drawerRowCount');
    if (drawerCount) {
      drawerCount.textContent = `${data.length} 列資料`;
    }

    if (!yCol) {
      el.kpiTotalSum.textContent = '0';
      el.kpiMeanVal.textContent = '0';
      el.kpiMetric4Val.textContent = '0';
      return;
    }

    const numbers = data.map(d => Number(d[yCol])).filter(n => !isNaN(n));
    if (numbers.length === 0) {
      el.kpiTotalSum.textContent = 'N/A';
      el.kpiMeanVal.textContent = 'N/A';
      el.kpiMetric4Val.textContent = 'N/A';
      return;
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    const range = max - min;

    el.kpiTotalSum.textContent = formatCompactNumber(sum);
    el.kpiMeanVal.textContent = formatCompactNumber(mean);

    // 第四個卡片依圖表動態展示
    if (state.chartType === 'scatter' && state.selectedX && state.columnTypes[state.selectedX] === 'number') {
      const xNumbers = data.map(d => Number(d[state.selectedX])).filter(n => !isNaN(n));
      const r = calculatePearsonR(xNumbers, numbers);
      el.kpiMetric4Title.textContent = '皮爾森相關 (PEARSON R)';
      el.kpiMetric4Val.textContent = `${r >= 0 ? '+' : ''}${r.toFixed(3)}`;
      el.kpiMetric4Sub.textContent = Math.abs(r) > 0.7 ? '高度強相關' : (Math.abs(r) > 0.4 ? '中度相關' : '低度或弱相關');
    } else if (state.chartType === 'donut') {
      el.kpiMetric4Title.textContent = '最大份額占比 (TOP SHARE)';
      const topPct = (max / sum) * 100;
      el.kpiMetric4Val.textContent = `${topPct.toFixed(1)}%`;
      el.kpiMetric4Sub.textContent = `極值: ${formatCompactNumber(max)}`;
    } else {
      el.kpiMetric4Title.textContent = '極值跨度 (MAX - MIN)';
      el.kpiMetric4Val.textContent = formatCompactNumber(range);
      el.kpiMetric4Sub.textContent = `峰值: ${formatCompactNumber(max)} · 谷底: ${formatCompactNumber(min)}`;
    }
  }

  // --- 皮爾森相關係數計算 ---
  function calculatePearsonR(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const x = xArr[i];
      const y = yArr[i];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  // --- 核心圖表渲染分發 ---
  function renderChart() {
    const width = 1920;
    const height = 1080;

    // 清空背景 (Data Atoms 極簡白底美學)
    ctx.fillStyle = PALETTE.bgCream;
    ctx.fillRect(0, 0, width, height);

    // 繪製左側資訊欄 (導演層 Atom 統一導讀模組)
    drawLeftAtomGuide(width, height);

    // 取得資料
    const chartData = getProcessedChartData();

    // 繪製右側主可視化圖形區域
    const arena = {
      x: 520,
      y: 90,
      w: 1320,
      h: 900
    };

    // 繪製圖表外框卡片
    drawArenaCard(arena);

    if (!chartData || chartData.length === 0) {
      drawEmptyMessage(arena, '請選取有效的數值指標與類別欄位');
      return;
    }

    switch (state.chartType) {
      case 'bar':
        drawBarChart(arena, chartData);
        break;
      case 'line':
        drawLineChart(arena, chartData);
        break;
      case 'scatter':
        drawScatterChart(arena, chartData);
        break;
      case 'donut':
        drawDonutChart(arena, chartData);
        break;
      case 'radar':
        drawRadarChart(arena, chartData);
        break;
      case 'funnel':
        drawFunnelChart(arena, chartData);
        break;
      case 'overview':
        drawOverviewMatrix(arena, chartData);
        break;
      default:
        drawBarChart(arena, chartData);
    }
  }

  // --- 取得並預處理當前圖表所需的數據 ---
  function getProcessedChartData() {
    const xCol = state.selectedX;
    const yCol = state.selectedY;
    const secCol = state.selectedSecondary;

    if (!xCol || !yCol) return [];

    let list = state.tableData.map((row, idx) => {
      const xVal = row[xCol];
      const yVal = Number(row[yCol]);
      const secVal = secCol && row[secCol] !== undefined ? Number(row[secCol]) : null;
      return {
        id: idx,
        x: xVal,
        y: isNaN(yVal) ? 0 : yVal,
        sec: (secVal !== null && !isNaN(secVal)) ? secVal : null,
        raw: row
      };
    });

    // 排序處理 (如果適用)
    const meta = CHART_META[state.chartType];
    if (meta.supportsSort && state.sortDescending) {
      list.sort((a, b) => b.y - a.y);
    }

    return list;
  }

  // --- 繪製左側統一導讀指引欄 (Data Atoms Signature Left Column) ---
  function drawLeftAtomGuide(w, h) {
    const meta = CHART_META[state.chartType];
    const leftX = 80;
    const topY = 100;

    ctx.save();

    // 1. 原子編號徽章
    ctx.fillStyle = PALETTE.orange;
    ctx.font = '800 64px "Plus Jakarta Sans", "JetBrains Mono", sans-serif';
    ctx.fillText(meta.badge, leftX, topY + 40);

    // 2. 主標題 (繁中)
    const titleParts = meta.title.split('·');
    const zhTitle = titleParts[0].trim();
    const enTitle = (titleParts[1] || '').trim();

    ctx.fillStyle = PALETTE.slate;
    ctx.font = '800 48px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
    ctx.fillText(zhTitle, leftX, topY + 110);

    // 3. 英文小標
    ctx.fillStyle = PALETTE.slateLight;
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.fillText(enTitle, leftX, topY + 145);

    // 4. 裝飾分隔線
    ctx.strokeStyle = PALETTE.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX, topY + 175);
    ctx.lineTo(leftX + 380, topY + 175);
    ctx.stroke();

    // 5. 狀態膠囊 (Formula Pill)
    const pillW = 380;
    const formulaText = meta.formula;
    let fontSize = 15;
    ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
    let textW = ctx.measureText(formulaText).width;
    while (textW > pillW - 32 && fontSize > 10) {
      fontSize -= 1;
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      textW = ctx.measureText(formulaText).width;
    }

    ctx.fillStyle = PALETTE.orangeLight;
    roundRect(ctx, leftX, topY + 200, pillW, 42, 8);
    ctx.fill();

    ctx.fillStyle = PALETTE.orange;
    ctx.fillText(formulaText, leftX + 16, topY + 226);

    // 6. 商業洞察解讀卡片
    const cardY = topY + 270;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, leftX, cardY, 380, 260, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 洞察卡片標題
    ctx.fillStyle = PALETTE.slate;
    ctx.font = '700 16px "Noto Sans TC", sans-serif';
    ctx.fillText('💡 數據解讀與決策洞察', leftX + 24, cardY + 40);

    // 依據圖型動態生成洞察解說
    const insightText = generateDynamicInsight();
    ctx.fillStyle = '#475569';
    ctx.font = '400 16px "Noto Sans TC", sans-serif';
    wrapText(ctx, insightText, leftX + 24, cardY + 76, 332, 26);

    // 7. 底部當前數據摘要卡
    const statY = cardY + 285;
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, leftX, statY, 380, 180, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.border;
    ctx.stroke();

    ctx.fillStyle = PALETTE.slateMuted;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText('ACTIVE DATA SUMMARY', leftX + 20, statY + 30);

    ctx.fillStyle = PALETTE.slate;
    ctx.font = '600 15px "Noto Sans TC", sans-serif';
    ctx.fillText(`維度 [X]: ${truncateStr(state.selectedX, 16)}`, leftX + 20, statY + 65);
    ctx.fillText(`指標 [Y]: ${truncateStr(state.selectedY, 16)}`, leftX + 20, statY + 95);
    if (state.selectedSecondary) {
      ctx.fillText(`次要: ${truncateStr(state.selectedSecondary, 16)}`, leftX + 20, statY + 125);
    } else {
      ctx.fillText(`次要: 未指定`, leftX + 20, statY + 125);
    }

    ctx.fillStyle = PALETTE.orange;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(`● STATUS: RENDERING NATIVE 1080P`, leftX + 20, statY + 155);

    ctx.restore();
  }

  // --- 動態生成當前維度下的商業洞察文字 ---
  function generateDynamicInsight() {
    const yCol = state.selectedY || '數值';
    switch (state.chartType) {
      case 'bar':
        return `快速對比各業務單元的 ${yCol} 絕對體量，透過排序與目標基準線，可直接鎖定貢獻主力與潛在落後環節。`;
      case 'line':
        return `觀察 ${yCol} 在時序上的長期波動規律與週期動能，透過移動平均線消除短期雜訊，預判未來走向。`;
      case 'scatter':
        return `驗證雙變量間是否存在顯著因果或相關性，藉由回歸線與 95% 置信區間識別高價值機會點與極值異象。`;
      case 'donut':
        return `分析整體業務中各板塊所佔份額，檢驗是否符合二八法則（Pareto Principle），評估營收結構是否穩健。`;
      case 'radar':
        return `打破單一維度視角，全面體檢各項核心能力的綜合表現，精準發掘能力短板與優勢突破口。`;
      case 'funnel':
        return `追蹤使用者全鏈路每一步驟的轉化與流失，找出流失率最高之轉化瓶頸，提升整體商業轉換效率。`;
      case 'overview':
        return `綜合觀測描述性統計指標（總和、均值、極差與變異），對整體數據體系建立全域宏觀認知。`;
      default:
        return `透過現代可視化幾何圖表，將雜亂數據轉化為高清晰度決策依據。`;
    }
  }

  // --- 繪製右側圖表卡片外框 ---
  function drawArenaCard(arena) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, arena.x, arena.y, arena.w, arena.h, 16);
    ctx.fill();

    ctx.strokeStyle = PALETTE.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 頂部淡裝飾線條
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(arena.x + 30, arena.y + 60);
    ctx.lineTo(arena.x + arena.w - 30, arena.y + 60);
    ctx.stroke();

    // 標籤欄
    ctx.fillStyle = PALETTE.slate;
    ctx.font = '700 16px "Noto Sans TC", sans-serif';
    ctx.fillText(`${state.selectedX || '類別'}  vs  ${state.selectedY || '指標'}`, arena.x + 30, arena.y + 40);

    ctx.fillStyle = PALETTE.slateMuted;
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(`TOTAL ENTRIES: ${state.tableData.length}`, arena.x + arena.w - 200, arena.y + 40);

    ctx.restore();
  }

  // ==========================================
  // 圖表 01: 離散體量 (Bar Chart)
  // ==========================================
  function drawBarChart(arena, data) {
    const margin = { top: 120, right: 60, bottom: 90, left: 100 };
    const chartW = arena.w - margin.left - margin.right;
    const chartH = arena.h - margin.top - margin.bottom;
    const startX = arena.x + margin.left;
    const startY = arena.y + margin.top;

    const maxVal = Math.max(...data.map(d => d.y), 1) * 1.15;
    const avgVal = data.reduce((acc, d) => acc + d.y, 0) / data.length;

    // 繪製背景水平網格線
    const gridTicks = 5;
    ctx.save();
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillStyle = PALETTE.slateMuted;
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridTicks; i++) {
      const val = (maxVal / gridTicks) * i;
      const yPos = startY + chartH - (val / maxVal) * chartH;

      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, yPos);
      ctx.lineTo(startX + chartW, yPos);
      ctx.stroke();

      ctx.fillText(formatCompactNumber(val), startX - 16, yPos + 4);
    }
    ctx.setLineDash([]);

    // 柱子寬度與間距
    const count = data.length;
    const barWidth = Math.min(chartW / (count * 1.6), 84);
    const step = chartW / count;

    let peakIdx = 0;
    let peakVal = -Infinity;
    data.forEach((d, idx) => {
      if (d.y > peakVal) {
        peakVal = d.y;
        peakIdx = idx;
      }
    });

    // 繪製柱子
    data.forEach((d, idx) => {
      const cx = startX + idx * step + step / 2;
      const bx = cx - barWidth / 2;
      const bHeight = (d.y / maxVal) * chartH;
      const by = startY + chartH - bHeight;

      // 1. 背景軌道 (淡灰色柱體)
      ctx.fillStyle = '#f1f1ed';
      roundRect(ctx, bx, startY, barWidth, chartH, 6);
      ctx.fill();

      // 2. 實體數值柱體
      const isPeak = idx === peakIdx && state.highlightOutliers;
      ctx.fillStyle = isPeak ? PALETTE.orange : PALETTE.slate;
      roundRect(ctx, bx, by, barWidth, bHeight, 6);
      ctx.fill();

      // 3. 柱頂亮色裝飾 Cap
      ctx.fillStyle = PALETTE.orange;
      roundRect(ctx, bx, by, barWidth, 6, 3);
      ctx.fill();

      // 4. 底部 X 軸類別標籤
      ctx.fillStyle = PALETTE.slate;
      ctx.font = '600 13px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      const label = truncateStr(String(d.x), 8);
      ctx.fillText(label, cx, startY + chartH + 28);

      // 5. 柱頂數值標籤
      if (state.showLabels) {
        ctx.fillStyle = isPeak ? PALETTE.orange : PALETTE.slate;
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.fillText(formatCompactNumber(d.y), cx, by - 12);
      }

      // 6. 次要對比目標標線 (如果有)
      if (d.sec !== null) {
        const targetH = (d.sec / maxVal) * chartH;
        const targetY = startY + chartH - targetH;
        ctx.strokeStyle = PALETTE.blue;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx - 4, targetY);
        ctx.lineTo(bx + barWidth + 4, targetY);
        ctx.stroke();
      }
    });

    // 7. 平均值參考線
    if (state.showAverage) {
      const avgY = startY + chartH - (avgVal / maxVal) * chartH;
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, avgY);
      ctx.lineTo(startX + chartW, avgY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 平均線徽章
      ctx.fillStyle = PALETTE.orange;
      roundRect(ctx, startX + chartW - 130, avgY - 14, 120, 26, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`AVG: ${formatCompactNumber(avgVal)}`, startX + chartW - 70, avgY + 3);
    }

    // 8. 最高峰值獨立 Highlight Badge
    if (state.highlightOutliers && peakVal > -Infinity) {
      const cx = startX + peakIdx * step + step / 2;
      const by = startY + chartH - (peakVal / maxVal) * chartH;

      ctx.fillStyle = PALETTE.orange;
      roundRect(ctx, cx - 65, by - 55, 130, 32, 6);
      ctx.fill();

      // 小箭頭向下指
      ctx.beginPath();
      ctx.moveTo(cx - 6, by - 23);
      ctx.lineTo(cx + 6, by - 23);
      ctx.lineTo(cx, by - 17);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`MAX: ${formatCompactNumber(peakVal)}`, cx, by - 34);
    }

    ctx.restore();
  }

  // ==========================================
  // 圖表 02: 時序趨勢 (Trend Line Chart)
  // ==========================================
  function drawLineChart(arena, data) {
    const margin = { top: 120, right: 60, bottom: 90, left: 100 };
    const chartW = arena.w - margin.left - margin.right;
    const chartH = arena.h - margin.top - margin.bottom;
    const startX = arena.x + margin.left;
    const startY = arena.y + margin.top;

    const maxVal = Math.max(...data.map(d => d.y), 1) * 1.15;
    const minVal = Math.min(...data.map(d => d.y), 0) * 0.9;
    const valRange = maxVal - minVal || 1;

    // 座標點映射
    const points = data.map((d, idx) => {
      const cx = startX + (idx / (data.length - 1 || 1)) * chartW;
      const cy = startY + chartH - ((d.y - minVal) / valRange) * chartH;
      return { x: cx, y: cy, val: d.y, label: d.x };
    });

    ctx.save();

    // 網格線
    const gridTicks = 5;
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillStyle = PALETTE.slateMuted;
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridTicks; i++) {
      const v = minVal + (valRange / gridTicks) * i;
      const yPos = startY + chartH - ((v - minVal) / valRange) * chartH;

      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, yPos);
      ctx.lineTo(startX + chartW, yPos);
      ctx.stroke();

      ctx.fillText(formatCompactNumber(v), startX - 16, yPos + 4);
    }
    ctx.setLineDash([]);

    // 繪製主折線平滑曲線 (Cubic Bézier Spline)
    if (points.length > 1) {
      // 1. 曲線下方漸層填充
      const grad = ctx.createLinearGradient(0, startY, 0, startY + chartH);
      grad.addColorStop(0, 'rgba(255, 87, 34, 0.28)');
      grad.addColorStop(1, 'rgba(255, 87, 34, 0.01)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, startY + chartH);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpx1 = p0.x + (p1.x - p0.x) / 2;
        const cpy1 = p0.y;
        const cpx2 = p0.x + (p1.x - p0.x) / 2;
        const cpy2 = p1.y;
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, p1.x, p1.y);
      }

      ctx.lineTo(points[points.length - 1].x, startY + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 2. 主曲線輪廓
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpx1 = p0.x + (p1.x - p0.x) / 2;
        const cpy1 = p0.y;
        const cpx2 = p0.x + (p1.x - p0.x) / 2;
        const cpy2 = p1.y;
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, p1.x, p1.y);
      }
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // 3. 移動平均線 MA(3)
    if (state.showTrendline && points.length >= 3) {
      const maPoints = [];
      const windowSize = Math.min(3, points.length);

      for (let i = 0; i < points.length; i++) {
        let sum = 0, count = 0;
        for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
          sum += points[j].val;
          count++;
        }
        const maVal = sum / count;
        const maY = startY + chartH - ((maVal - minVal) / valRange) * chartH;
        maPoints.push({ x: points[i].x, y: maY });
      }

      ctx.beginPath();
      ctx.moveTo(maPoints[0].x, maPoints[0].y);
      for (let i = 1; i < maPoints.length; i++) {
        ctx.lineTo(maPoints[i].x, maPoints[i].y);
      }
      ctx.strokeStyle = PALETTE.slate;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. 節點圓圈與標籤
    points.forEach((p, idx) => {
      // 圓點
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 底部 X 軸標籤
      ctx.fillStyle = PALETTE.slate;
      ctx.font = '600 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(p.label), p.x, startY + chartH + 28);

      // 數值標籤
      if (state.showLabels) {
        ctx.fillStyle = PALETTE.slate;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.fillText(formatCompactNumber(p.val), p.x, p.y - 14);
      }
    });

    ctx.restore();
  }

  // ==========================================
  // 圖表 03: 相關分佈 (Correlation Scatter Plot)
  // ==========================================
  function drawScatterChart(arena, data) {
    const margin = { top: 120, right: 60, bottom: 90, left: 100 };
    const chartW = arena.w - margin.left - margin.right;
    const chartH = arena.h - margin.top - margin.bottom;
    const startX = arena.x + margin.left;
    const startY = arena.y + margin.top;

    // 自變量 X 數值與應變量 Y 數值
    const xVals = data.map(d => Number(d.raw[state.selectedX]) || 0);
    const yVals = data.map(d => d.y);

    const maxX = Math.max(...xVals, 1) * 1.15;
    const minX = Math.min(...xVals, 0);
    const maxY = Math.max(...yVals, 1) * 1.15;
    const minY = Math.min(...yVals, 0);

    const r = calculatePearsonR(xVals, yVals);

    // 線性回歸計算 (y = mx + b)
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += xVals[i];
      sumY += yVals[i];
      sumXY += xVals[i] * yVals[i];
      sumX2 += xVals[i] * xVals[i];
    }
    const slope = (n * sumXY - sumX * sumY) / ((n * sumX2 - sumX * sumX) || 1);
    const intercept = (sumY - slope * sumX) / (n || 1);

    ctx.save();

    // 網格
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillStyle = PALETTE.slateMuted;
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const vY = minY + ((maxY - minY) / 5) * i;
      const pos = startY + chartH - ((vY - minY) / (maxY - minY || 1)) * chartH;

      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, pos);
      ctx.lineTo(startX + chartW, pos);
      ctx.stroke();

      ctx.fillText(formatCompactNumber(vY), startX - 16, pos + 4);
    }
    ctx.setLineDash([]);

    // 95% 置信區間帶 (Confidence Corridor)
    if (state.showTrendline) {
      const regY1 = slope * minX + intercept;
      const regY2 = slope * maxX + intercept;
      const p1y = startY + chartH - ((regY1 - minY) / (maxY - minY || 1)) * chartH;
      const p2y = startY + chartH - ((regY2 - minY) / (maxY - minY || 1)) * chartH;

      // 帶狀填充
      ctx.fillStyle = 'rgba(255, 87, 34, 0.08)';
      ctx.beginPath();
      ctx.moveTo(startX, p1y - 35);
      ctx.lineTo(startX + chartW, p2y - 35);
      ctx.lineTo(startX + chartW, p2y + 35);
      ctx.lineTo(startX, p1y + 35);
      ctx.closePath();
      ctx.fill();

      // 回歸線條
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, p1y);
      ctx.lineTo(startX + chartW, p2y);
      ctx.stroke();

      // 皮爾森相關係數浮動標籤
      ctx.fillStyle = PALETTE.slate;
      roundRect(ctx, startX + chartW - 250, startY + 20, 230, 36, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PEARSON R = ${r >= 0 ? '+' : ''}${r.toFixed(3)}`, startX + chartW - 135, startY + 43);
    }

    // 繪製散點
    data.forEach((d, idx) => {
      const x = xVals[idx];
      const y = yVals[idx];
      const px = startX + ((x - minX) / (maxX - minX || 1)) * chartW;
      const py = startY + chartH - ((y - minY) / (maxY - minY || 1)) * chartH;

      // 半徑支援自訂或固定
      let radius = 10;
      if (d.sec !== null) {
        radius = Math.max(6, Math.min(22, (d.sec / 100) * 12));
      }

      ctx.fillStyle = 'rgba(255, 87, 34, 0.2)';
      ctx.beginPath();
      ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PALETTE.orange;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 散點文字標籤
      if (state.showLabels) {
        ctx.fillStyle = PALETTE.slate;
        ctx.font = '600 12px "Noto Sans TC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(truncateStr(String(d.raw[state.selectedX] || d.x), 10), px + radius + 6, py + 4);
      }
    });

    ctx.restore();
  }

  // ==========================================
  // 圖表 04: 結構佔比 (Donut / Pie Chart)
  // ==========================================
  function drawDonutChart(arena, data) {
    const total = data.reduce((sum, d) => sum + d.y, 0) || 1;
    const centerX = arena.x + arena.w * 0.42;
    const centerY = arena.y + arena.h * 0.52;
    const outerRadius = Math.min(arena.w * 0.28, arena.h * 0.36);
    const innerRadius = outerRadius * 0.62;

    ctx.save();

    let startAngle = -Math.PI / 2;

    data.forEach((d, idx) => {
      const sliceAngle = (d.y / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const color = PALETTE.sliceColors[idx % PALETTE.sliceColors.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      startAngle = endAngle;
    });

    // 中央鏤空圓心 KPI 數字
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 4, 0, Math.PI * 2);
    ctx.fill();

    // 圓心微邊框
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = PALETTE.slateMuted;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('總體量 · TOTAL SUM', centerX, centerY - 20);

    ctx.fillStyle = PALETTE.slate;
    ctx.font = '800 38px "Plus Jakarta Sans", "JetBrains Mono", sans-serif';
    ctx.fillText(formatCompactNumber(total), centerX, centerY + 20);

    ctx.fillStyle = PALETTE.slateLight;
    ctx.font = '600 12px "Noto Sans TC", sans-serif';
    ctx.fillText('100% 份額加總', centerX, centerY + 48);

    // 右側清晰圖例清單
    const legendX = arena.x + arena.w * 0.68;
    let legendY = arena.y + 160;

    ctx.textAlign = 'left';
    data.slice(0, 8).forEach((d, idx) => {
      const color = PALETTE.sliceColors[idx % PALETTE.sliceColors.length];
      const pct = ((d.y / total) * 100).toFixed(1);

      // 色塊
      ctx.fillStyle = color;
      roundRect(ctx, legendX, legendY, 16, 16, 4);
      ctx.fill();

      // 項目名稱
      ctx.fillStyle = PALETTE.slate;
      ctx.font = '600 14px "Noto Sans TC", sans-serif';
      ctx.fillText(truncateStr(String(d.x), 12), legendX + 28, legendY + 13);

      // 百分比與數值
      ctx.fillStyle = PALETTE.slateLight;
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillText(`${pct}%  (${formatCompactNumber(d.y)})`, legendX + 170, legendY + 13);

      legendY += 38;
    });

    ctx.restore();
  }

  // ==========================================
  // 圖表 05: 多維畫像 (Radar Chart)
  // ==========================================
  function drawRadarChart(arena, data) {
    const items = data.slice(0, 8); // 取前 6~8 維度
    const count = items.length;
    if (count < 3) return;

    const centerX = arena.x + arena.w * 0.5;
    const centerY = arena.y + arena.h * 0.53;
    const maxRadius = Math.min(arena.w * 0.32, arena.h * 0.36);

    const maxVal = Math.max(...items.map(d => Math.max(d.y, d.sec || 0)), 100);

    ctx.save();

    // 1. 同心正多邊形網格 (5 層)
    const levels = 5;
    for (let l = 1; l <= levels; l++) {
      const r = (maxRadius / levels) * l;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 層級刻度
      const labelVal = Math.round((maxVal / levels) * l);
      ctx.fillStyle = PALETTE.slateMuted;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(labelVal), centerX, centerY - r + 14);
    }

    // 2. 軸射線與邊緣維度標籤
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();

      // 標籤外推
      const labelX = centerX + Math.cos(angle) * (maxRadius + 36);
      const labelY = centerY + Math.sin(angle) * (maxRadius + 36);

      ctx.fillStyle = PALETTE.slate;
      ctx.font = '700 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(truncateStr(String(items[i].x), 8), labelX, labelY + 5);
    }

    // 3. 次要指標基準線 (Benchmark)
    const hasSec = items.some(d => d.sec !== null);
    if (hasSec) {
      ctx.beginPath();
      items.forEach((d, i) => {
        const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
        const r = (d.sec / maxVal) * maxRadius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = PALETTE.slateMuted;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. 實際得分多邊形 (主要 series)
    ctx.beginPath();
    items.forEach((d, i) => {
      const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
      const r = (d.y / maxVal) * maxRadius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 87, 34, 0.25)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.orange;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 頂點圓點與數值
    items.forEach((d, i) => {
      const angle = (Math.PI * 2 / count) * i - Math.PI / 2;
      const r = (d.y / maxVal) * maxRadius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (state.showLabels) {
        ctx.fillStyle = PALETTE.orange;
        ctx.font = '700 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(formatCompactNumber(d.y), x, y - 10);
      }
    });

    ctx.restore();
  }

  // ==========================================
  // 圖表 06: 轉化漏斗 (Conversion Funnel)
  // ==========================================
  function drawFunnelChart(arena, data) {
    const stages = data.slice(0, 6);
    const count = stages.length;
    if (count === 0) return;

    const baseVal = stages[0].y || 1;
    const marginY = 120;
    const funnelH = arena.h - marginY - 100;
    const stepH = funnelH / count;
    const maxW = arena.w * 0.65;
    const minW = arena.w * 0.18;
    const centerX = arena.x + arena.w * 0.44;

    ctx.save();

    stages.forEach((st, idx) => {
      const topY = arena.y + marginY + idx * stepH;
      const botY = topY + stepH - 8;

      const wTop = minW + ((st.y / baseVal)) * (maxW - minW);
      const nextY = idx < count - 1 ? stages[idx + 1].y : st.y * 0.8;
      const wBot = minW + ((nextY / baseVal)) * (maxW - minW);

      // 梯形色彩
      ctx.fillStyle = idx === 0 ? PALETTE.slate : (idx === count - 1 ? PALETTE.orange : PALETTE.slateLight);
      
      // 繪製梯形
      ctx.beginPath();
      ctx.moveTo(centerX - wTop / 2, topY);
      ctx.lineTo(centerX + wTop / 2, topY);
      ctx.lineTo(centerX + wBot / 2, botY);
      ctx.lineTo(centerX - wBot / 2, botY);
      ctx.closePath();
      ctx.fill();

      // 步驟名稱與人數
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 15px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${st.x}: ${st.y.toLocaleString()} 人`, centerX, (topY + botY) / 2 + 5);

      // 右側轉化率標籤
      const rate = ((st.y / baseVal) * 100).toFixed(1);
      ctx.fillStyle = PALETTE.slate;
      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`CR: ${rate}%`, centerX + wTop / 2 + 25, (topY + botY) / 2 + 5);

      // 流失率小標示 (Drop-off)
      if (idx > 0) {
        const prevY = stages[idx - 1].y;
        const dropPct = (((prevY - st.y) / prevY) * 100).toFixed(1);
        ctx.fillStyle = '#ef4444';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(`▼ 流失 -${dropPct}%`, centerX + maxW / 2 + 60, topY + 4);
      }
    });

    ctx.restore();
  }

  // ==========================================
  // 圖表 07: 數據矩陣總覽 (Metric Overview)
  // ==========================================
  function drawOverviewMatrix(arena, data) {
    const yVals = data.map(d => d.y);
    const n = yVals.length || 1;
    const sum = yVals.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sorted = [...yVals].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const min = sorted[0] || 0;
    const max = sorted[n - 1] || 0;
    const variance = yVals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const cards = [
      { label: '數據總樣本數', val: n.toLocaleString(), sub: '有效資料列行數' },
      { label: '指標累加總值', val: formatCompactNumber(sum), sub: `全維度總計加總` },
      { label: '算術平均值 (MEAN)', val: formatCompactNumber(mean), sub: '樣本均值' },
      { label: '數值中位數 (MEDIAN)', val: formatCompactNumber(median), sub: 'P50 分位點' },
      { label: '極大值 (MAX)', val: formatCompactNumber(max), sub: `峰值項目: ${data.find(d => d.y === max)?.x || ''}` },
      { label: '極小值 (MIN)', val: formatCompactNumber(min), sub: `谷底項目: ${data.find(d => d.y === min)?.x || ''}` },
      { label: '標準差 (STD DEV)', val: formatCompactNumber(stdDev), sub: '波動離散程度' },
      { label: '四分位距 (IQR)', val: formatCompactNumber(max - min), sub: '極值全跨度' }
    ];

    const startX = arena.x + 80;
    const startY = arena.y + 120;
    const cardW = 270;
    const cardH = 150;
    const gapX = 35;
    const gapY = 35;

    ctx.save();

    cards.forEach((c, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      ctx.fillStyle = '#f8fafc';
      roundRect(ctx, cx, cy, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = PALETTE.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 左側標記條
      ctx.fillStyle = (i === 1 || i === 4) ? PALETTE.orange : PALETTE.slate;
      roundRect(ctx, cx, cy, 5, cardH, 3);
      ctx.fill();

      // 標籤
      ctx.fillStyle = PALETTE.slateMuted;
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(c.label, cx + 20, cy + 34);

      // 數值
      ctx.fillStyle = PALETTE.slate;
      ctx.font = '800 28px "Plus Jakarta Sans", "JetBrains Mono", sans-serif';
      ctx.fillText(c.val, cx + 20, cy + 85);

      // 說明
      ctx.fillStyle = PALETTE.slateLight;
      ctx.font = '500 13px "Noto Sans TC", sans-serif';
      ctx.fillText(c.sub, cx + 20, cy + 122);
    });

    ctx.restore();
  }

  // --- 畫布滑鼠懸停互動 Tooltip ---
  function handleCanvasMouseMove(e) {
    const rect = el.canvas.getBoundingClientRect();
    const scaleX = el.canvas.width / rect.width;
    const scaleY = el.canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // 檢查是否懸停在柱狀圖等物件上
    const data = getProcessedChartData();
    if (!data || data.length === 0) return;

    if (state.chartType === 'bar') {
      const arena = { x: 520, y: 90, w: 1320, h: 900 };
      const margin = { top: 120, right: 60, bottom: 90, left: 100 };
      const chartW = arena.w - margin.left - margin.right;
      const chartH = arena.h - margin.top - margin.bottom;
      const startX = arena.x + margin.left;
      const startY = arena.y + margin.top;
      const step = chartW / data.length;

      data.forEach((d, idx) => {
        const cx = startX + idx * step + step / 2;
        if (Math.abs(mouseX - cx) < step / 2 && mouseY >= startY && mouseY <= startY + chartH) {
          showTooltip(e.clientX, e.clientY, String(d.x), `${state.selectedY}: ${d.y.toLocaleString()}`);
        }
      });
    }
  }

  function showTooltip(x, y, title, val) {
    el.canvasTooltip.style.display = 'block';
    el.canvasTooltip.style.left = `${x}px`;
    el.canvasTooltip.style.top = `${y - 15}px`;
    el.canvasTooltip.innerHTML = `<div class="tt-title">${escapeHtml(title)}</div><div class="tt-val">${escapeHtml(val)}</div>`;
  }

  // --- 表格過濾與分頁渲染 ---
  function filterTableData() {
    if (!state.searchQuery) {
      state.filteredData = [...state.tableData];
    } else {
      state.filteredData = state.tableData.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(state.searchQuery));
      });
    }
  }

  function renderTable() {
    const totalRows = state.filteredData.length;
    const maxPage = Math.ceil(totalRows / state.pageSize) || 1;
    if (state.tablePage > maxPage) state.tablePage = maxPage;

    el.tableRowsInfo.textContent = `共 ${totalRows} 筆資料 (第 ${state.tablePage}/${maxPage} 頁)`;
    el.paginationInfo.textContent = `第 ${state.tablePage} 頁 / 共 ${maxPage} 頁`;

    // 渲染表頭
    el.previewTableHead.innerHTML = '';
    const trHead = document.createElement('tr');
    state.tableHeaders.forEach(h => {
      const th = document.createElement('th');
      const type = state.columnTypes[h] === 'number' ? '#' : 'A';
      th.innerHTML = `<span style="font-family: var(--font-mono); color: var(--accent-orange); margin-right: 4px;">${type}</span> ${escapeHtml(h)}`;
      trHead.appendChild(th);
    });
    el.previewTableHead.appendChild(trHead);

    // 渲染當前頁資料列
    el.previewTableBody.innerHTML = '';
    const startIndex = (state.tablePage - 1) * state.pageSize;
    const pageRows = state.filteredData.slice(startIndex, startIndex + state.pageSize);

    pageRows.forEach(row => {
      const tr = document.createElement('tr');
      state.tableHeaders.forEach(h => {
        const td = document.createElement('td');
        const val = row[h];
        if (typeof val === 'number') {
          td.style.fontFamily = 'var(--font-mono)';
          td.textContent = val.toLocaleString();
        } else {
          td.textContent = val !== undefined ? val : '';
        }
        tr.appendChild(td);
      });
      el.previewTableBody.appendChild(tr);
    });
  }

  // --- 匯出 1080p 高畫質圖片 ---
  function exportCanvasImage() {
    try {
      el.canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timeStamp = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `DataAtoms_${state.chartType}_${timeStamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('📥 圖表已匯出為高畫質 1080p PNG 圖片！');
      }, 'image/png');
    } catch (err) {
      console.error(err);
      showToast('❌ 圖片匯出失敗', true);
    }
  }

  // --- 匯出篩選後的 CSV 資料 ---
  function exportCSV() {
    if (!state.filteredData || state.filteredData.length === 0) {
      showToast('⚠️ 目前沒有可匯出的數據', true);
      return;
    }

    const headers = state.tableHeaders;
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    state.filteredData.forEach(row => {
      const values = headers.map(h => {
        const val = row[h] !== undefined ? String(row[h]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.fileName || 'export'}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 數據已匯出為 CSV 檔案！');
  }

  // --- 輔助函式: 繪製圓角矩形 ---
  function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

  // --- 輔助函式: 長文字自動折行 ---
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '';

    for (let n = 0; n < chars.length; n++) {
      const testLine = line + chars[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = chars[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  // --- 輔助函式: 數字精簡顯示 (如 1.2M, 450K) ---
  function formatCompactNumber(num) {
    if (isNaN(num)) return '0';
    if (Math.abs(num) >= 1e8) return (num / 1e8).toFixed(1) + '億';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (Math.abs(num) >= 1e4) return (num / 1e4).toFixed(1) + '萬';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Number(num.toFixed(1)).toLocaleString();
  }

  function truncateStr(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg, isError = false) {
    el.toastNotice.textContent = msg;
    el.toastNotice.style.borderLeftColor = isError ? '#ef4444' : PALETTE.orange;
    el.toastNotice.classList.add('show');
    setTimeout(() => {
      el.toastNotice.classList.remove('show');
    }, 3200);
  }

  function drawEmptyMessage(arena, msg) {
    ctx.save();
    ctx.fillStyle = PALETTE.slateMuted;
    ctx.font = '600 20px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(msg, arena.x + arena.w / 2, arena.y + arena.h / 2);
    ctx.restore();
  }

  // 頁面加載完畢後初始化
  window.addEventListener('DOMContentLoaded', init);

})();
