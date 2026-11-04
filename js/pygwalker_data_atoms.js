/**
 * PyGWalker-inspired Interactive Visual Exploration Engine for Data Atoms Studio
 * 結合 Graphic Walker 視覺編碼槽架構與日本官方統計 e-Stat 大數據
 * 支援欄位拖曳、X/Y 軸即時自定義、自訂資料 (CSV/Excel/JSON) 上傳與雙圖表引擎
 */

(function () {
  'use strict';

  // --- 系統全域狀態 ---
  const state = {
    currentDatasetId: 'jp_prefectures',
    datasetName: '',
    customDatasets: {}, // 自訂資料集註冊表，避免切換後資料遺失
    rawRows: [],
    columns: [],
    dimensions: [],  // 文字 / 類別
    measures: [],    // 連續數值
    
    // Tableau 語意綱要設定 (Type, Role, Nature, Agg, Alias, Profiling)
    schemaConfig: {},
    autoInferredSchema: {},
    schemaFilter: 'all',
    schemaSearchQuery: '',
    
    // 視覺編碼槽 (Graphic Walker Shelves)
    shelf: {
      x: '都道府縣',
      y: '總人口(人)',
      yMulti: [], // 多指標並列對比陣列
      color: '地方分區',
      size: '65歲以上高齡人口(人)',
      secondary: '高齡化率(%)',
      facet: '',  // 小多圖分面維度 (Small Multiples Facet Dimension)
      agg: 'RAW'      // 'RAW' | 'SUM' | 'MEAN' | 'MAX' | 'MIN' | 'COUNT'
    },
    facetScaleMode: 'fixed', // 'fixed': 統一 Y 軸比例尺, 'free': 各子圖自適應
    
    // 篩選器字典 (Tableau-like Filters Shelf)
    // 支援類別篩選 (Categorical) 與 數值/年份區間 (Range)
    filters: {},
    
    chartType: 'bar', // 'bar' | 'line' | 'scatter' | 'donut' | 'radar' | 'funnel' | 'overview'
    engine: 'echarts', // 'echarts' | 'canvas'
    barStackMode: false, // false: 併排對比 (Grouped), true: 堆疊累計 (Stacked)
    
    // 視覺控制
    sortDescending: true,
    showLabels: true,
    showAverage: true,
    showTrendline: true,
    topN: 47,
    
    // 表格狀態
    tablePage: 1,
    pageSize: 10,
    searchQuery: '',
    sortColumn: '',
    sortOrder: 'desc'
  };

  let echartsInstance = null;

  // --- 地方色彩調色盤 (Graphic Walker & Bauhaus Inspired) ---
  const PALETTE = [
    '#2563eb', '#ea580c', '#10b981', '#8b5cf6', '#ec4899',
    '#06b6d4', '#f59e0b', '#6366f1', '#14b8a6', '#f43f5e',
    '#84cc16', '#a855f7', '#3b82f6', '#d97706', '#059669'
  ];

  const PALETTE_BAUHAUS = ['#1d4ed8', '#0284c7', '#0f766e', '#16a34a', '#eab308', '#ea580c', '#e11d48', '#7c3aed', '#475569'];

  // --- 數值與統計安全輔助函式 (防溢位、防 NaN、防髒資料) ---
  function safeParseNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === null || val === undefined) return 0;
    const str = String(val).replace(/[,%]/g, '').trim();
    if (str === '') return 0;
    const n = Number(str);
    return isNaN(n) ? 0 : n;
  }

  function safeMin(arr, defaultVal = 0) {
    if (!arr || !arr.length) return defaultVal;
    let min = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const v = Number(arr[i]);
      if (!isNaN(v) && v < min) min = v;
    }
    return min === Infinity ? defaultVal : min;
  }

  function safeMax(arr, defaultVal = 0) {
    if (!arr || !arr.length) return defaultVal;
    let max = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      const v = Number(arr[i]);
      if (!isNaN(v) && v > max) max = v;
    }
    return max === -Infinity ? defaultVal : max;
  }

  function safeExtent(arr, defaultMin = 0, defaultMax = 0) {
    if (!arr || !arr.length) return [defaultMin, defaultMax];
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      const v = Number(arr[i]);
      if (!isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return [
      min === Infinity ? defaultMin : min,
      max === -Infinity ? defaultMax : max
    ];
  }

  function debounce(fn, wait = 100) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, wait);
    };
  }

  // --- 真正的 Group-By 聚合計算引擎 ---
  function aggregateRows(rows, groupKeys, measureKeys, aggType) {
    if (!aggType || aggType === 'RAW' || !rows || rows.length === 0) {
      return rows;
    }
    const validGroupKeys = [...new Set((groupKeys || []).filter(k => k && typeof k === 'string'))];
    if (validGroupKeys.length === 0) return rows;

    const validMeasures = [...new Set((measureKeys || []).filter(m => m && typeof m === 'string'))];

    const groups = new Map();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const keyParts = validGroupKeys.map(k => String(r[k] !== undefined && r[k] !== null ? r[k] : ''));
      const groupKey = keyParts.join('___|||___');

      let entry = groups.get(groupKey);
      if (!entry) {
        entry = {
          protoRow: { ...r },
          count: 0,
          sum: {},
          min: {},
          max: {},
          values: {}
        };
        validMeasures.forEach(m => {
          entry.sum[m] = 0;
          entry.min[m] = Infinity;
          entry.max[m] = -Infinity;
          entry.values[m] = [];
        });
        groups.set(groupKey, entry);
      }
      entry.count++;
      validMeasures.forEach(m => {
        const rawVal = r[m];
        if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '') {
          const val = safeParseNumber(rawVal);
          if (!isNaN(val)) {
            entry.sum[m] += val;
            if (val < entry.min[m]) entry.min[m] = val;
            if (val > entry.max[m]) entry.max[m] = val;
            entry.values[m].push(val);
          }
        }
      });
    }

    const aggregated = [];
    groups.forEach((entry) => {
      const row = { ...entry.protoRow };
      validMeasures.forEach(m => {
        const hasValues = entry.values[m].length > 0;
        if (aggType === 'SUM') {
          row[m] = hasValues ? entry.sum[m] : 0;
        } else if (aggType === 'MEAN') {
          row[m] = hasValues ? entry.sum[m] / entry.values[m].length : 0;
        } else if (aggType === 'MAX') {
          row[m] = hasValues && entry.max[m] !== -Infinity ? entry.max[m] : 0;
        } else if (aggType === 'MIN') {
          row[m] = hasValues && entry.min[m] !== Infinity ? entry.min[m] : 0;
        } else if (aggType === 'COUNT') {
          row[m] = entry.count;
        }
        if (typeof row[m] === 'number' && row[m] % 1 !== 0) {
          row[m] = parseFloat(row[m].toFixed(2));
        }
      });
      if (aggType === 'COUNT' && validMeasures.length === 0) {
        row['計數'] = entry.count;
      }
      aggregated.push(row);
    });

    return aggregated;
  }

  function getVisualData(customRows = null) {
    const raw = customRows || getActiveRows();
    if (!state.shelf.agg || state.shelf.agg === 'RAW' || raw.length === 0) {
      return raw;
    }
    // 散點圖在無維度分組時保留原始數據點
    if (state.chartType === 'scatter' && !state.shelf.color && !state.shelf.facet) {
      return raw;
    }
    // 判斷是否為對調長條圖 (X 軸為度量，Y 軸為維度)
    const isSwapped = state.chartType === 'bar' && state.measures.includes(state.shelf.x) && !state.measures.includes(state.shelf.y);
    let groupKeys, measureKeys;
    if (isSwapped) {
      groupKeys = [state.shelf.y, state.shelf.color, state.shelf.facet].filter(Boolean);
      measureKeys = [state.shelf.x, state.shelf.secondary, state.shelf.size, ...(state.shelf.yMulti || [])].filter(Boolean);
    } else {
      groupKeys = [state.shelf.x, state.shelf.color, state.shelf.facet].filter(Boolean);
      measureKeys = [state.shelf.y, state.shelf.secondary, state.shelf.size, ...(state.shelf.yMulti || [])].filter(Boolean);
    }
    return aggregateRows(raw, groupKeys, measureKeys, state.shelf.agg);
  }

  const REGION_COLORS = {
    '關東地方': '#2563eb',
    '近畿地方': '#ea580c',
    '中部地方': '#10b981',
    '九州・沖繩': '#8b5cf6',
    '北海道・東北': '#06b6d4',
    '中國地方': '#f59e0b',
    '四國地方': '#ec4899',
    '其他地方': '#64748b',
    // 性別專用色彩 (兩組類別對比)
    '男性': '#2563eb',
    '女性': '#ec4899',
    '男': '#2563eb',
    '女': '#ec4899',
    // 年齡層專用色彩 (三組類別對比)
    '幼年人口(0-14歲)': '#10b981',
    '幼年人口': '#10b981',
    '勞動人口(15-64歲)': '#2563eb',
    '勞動人口': '#2563eb',
    '高齡人口(65歲以上)': '#ea580c',
    '高齡人口': '#ea580c'
  };

  // --- 內建商業資料集 (當使用者想看商業範例時) ---
  const BUSINESS_DATASETS = {
    biz_sales: {
      id: 'biz_sales',
      name: '📊 產品線營收與毛利體量 (商業範例)',
      defaultX: '產品線',
      defaultY: '本季營收(萬元)',
      defaultColor: '類別',
      defaultSize: '客戶數',
      defaultSecondary: '毛利率(%)',
      defaultChart: 'bar',
      data: [
        { '產品線': '企業雲平台', '類別': 'SaaS服務', '本季營收(萬元)': 940, '目標營收(萬元)': 800, '毛利率(%)': 78.5, '客戶數': 342 },
        { '產品線': '智能數據中台', '類別': '數據產品', '本季營收(萬元)': 720, '目標營收(萬元)': 650, '毛利率(%)': 71.2, '客戶數': 218 },
        { '產品線': 'AI視覺助理', '類別': '前沿AI', '本季營收(萬元)': 580, '目標營收(萬元)': 500, '毛利率(%)': 65.0, '客戶數': 154 },
        { '產品線': '物聯網邊緣節點', '類別': '硬體方案', '本季營收(萬元)': 430, '目標營收(萬元)': 450, '毛利率(%)': 48.2, '客戶數': 98 },
        { '產品線': '資訊安全套件', '類別': '基礎架構', '本季營收(萬元)': 360, '目標營收(萬元)': 320, '毛利率(%)': 82.0, '客戶數': 185 },
        { '產品線': '行動端SDK', '類別': '開發者工具', '本季營收(萬元)': 290, '目標營收(萬元)': 300, '毛利率(%)': 62.4, '客戶數': 420 },
        { '產品線': '私有化部署模組', '類別': '交付服務', '本季營收(萬元)': 210, '目標營收(萬元)': 250, '毛利率(%)': 52.8, '客戶數': 45 },
        { '產品線': '技術諮詢服務', '類別': '專業服務', '本季營收(萬元)': 160, '目標營收(萬元)': 150, '毛利率(%)': 45.0, '客戶數': 32 }
      ]
    },
    biz_trend: {
      id: 'biz_trend',
      name: '📈 12個月月度營收時序趨勢 (商業範例)',
      defaultX: '月份',
      defaultY: '總營收(萬元)',
      defaultColor: '',
      defaultSize: '訂單總數',
      defaultSecondary: '新增用戶',
      defaultChart: 'line',
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
      ]
    },
    biz_scatter: {
      id: 'biz_scatter',
      name: '🎯 行銷廣告與獲客相關矩陣 (商業範例)',
      defaultX: '廣告預算(千元)',
      defaultY: '新增轉化用戶',
      defaultColor: '宣傳管道',
      defaultSize: '總銷售額(萬元)',
      defaultSecondary: '獲客成本CPA(元)',
      defaultChart: 'scatter',
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
      ]
    }
  };

  // --- 初始化入口 ---
  function init() {
    setupEventListeners();
    setupDragAndDrop();
    init17DomainModal();
    loadDataset('jp_gender_facet');

    // 檢查 URL 參數是否指定了圖表 (如 ?chart=line, ?chart=geo)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedChart = urlParams.get('chart');
      if (requestedChart && ['bar', 'line', 'dual', 'geo', 'boxplot', 'treemap', 'scatter', 'donut', 'radar', 'funnel'].includes(requestedChart)) {
        state.chartType = requestedChart;
        renderChartTypeSelector();
        renderVisualization();
      }
    } catch (e) {
      console.warn('URL param chart error:', e);
    }
  }

  // --- 載入指定數據集 ---
  function loadDataset(datasetKey, customObj = null) {
    let target = null;
    if (customObj) {
      target = customObj;
      if (!state.customDatasets) state.customDatasets = {};
      state.customDatasets[target.id || datasetKey] = target;
    } else if (state.customDatasets && state.customDatasets[datasetKey]) {
      target = state.customDatasets[datasetKey];
    } else if (window.ESTAT_JP_DATASETS) {
      target = window.ESTAT_JP_DATASETS[datasetKey] || 
               Object.values(window.ESTAT_JP_DATASETS).find(d => d.id === datasetKey);
    }
    if (!target && BUSINESS_DATASETS[datasetKey]) {
      target = BUSINESS_DATASETS[datasetKey];
    }

    if (!target || !target.data || target.data.length === 0) {
      console.warn('Dataset not found or empty:', datasetKey);
      return;
    }

    state.currentDatasetId = target.id || datasetKey;
    state.datasetName = target.name || '自訂數據集';
    state.rawRows = JSON.parse(JSON.stringify(target.data));
    state.shelf.yMulti = []; // 徹底清空多指標殘留
    
    // 自動補齊標準化人口結構比率 (確保 47都道府縣 與 50年時序 皆可直接對比 幼年 vs 勞動人口占比)
    state.rawRows.forEach(r => {
      if (r['幼年人口占比(%)'] === undefined) {
        const val = r['幼年人口佔比(%)'] != null ? r['幼年人口佔比(%)']
          : (r['幼年人口率(%)'] != null ? r['幼年人口率(%)']
          : (r['0-14歲幼年人口(人)'] && r['總人口(人)'] ? parseFloat(((Number(r['0-14歲幼年人口(人)']) / Number(r['總人口(人)'])) * 100).toFixed(2)) : undefined));
        if (val !== undefined) r['幼年人口占比(%)'] = Number(val);
      }
      if (r['勞動人口占比(%)'] === undefined) {
        const val = r['勞動人口佔比(%)'] != null ? r['勞動人口佔比(%)']
          : (r['15-64歲勞動力人口(人)'] && r['總人口(人)'] ? parseFloat(((Number(r['15-64歲勞動力人口(人)']) / Number(r['總人口(人)'])) * 100).toFixed(2))
          : (r['15-64歲勞動人口(人)'] && r['全國總人口(人)'] ? parseFloat(((Number(r['15-64歲勞動人口(人)']) / Number(r['全國總人口(人)'])) * 100).toFixed(2)) : undefined));
        if (val !== undefined) r['勞動人口占比(%)'] = Number(val);
      }
      if (r['老年人口占比(%)'] === undefined) {
        const val = r['高齡化率(%)'] != null ? r['高齡化率(%)']
          : (r['65歲以上高齡人口(人)'] && r['總人口(人)'] ? parseFloat(((Number(r['65歲以上高齡人口(人)']) / Number(r['總人口(人)'])) * 100).toFixed(2)) : undefined);
        if (val !== undefined) r['老年人口占比(%)'] = Number(val);
      }
    });

    // 分析欄位綱要
    analyzeSchema(state.rawRows);

    // 智慧初始化常用篩選器 (地區分組 / 年份區間)
    initDefaultFilters();

    // 套用預設編碼槽
    state.shelf.x = target.defaultX || (state.dimensions[0] || state.columns[0]);
    state.shelf.y = target.defaultY || (state.measures[0] || state.columns[1]);
    state.shelf.color = target.defaultColor || '';
    state.shelf.size = target.defaultSize || '';
    state.shelf.secondary = target.defaultSecondary || '';
    state.shelf.facet = target.defaultFacet || '';
    if (target.defaultChart) {
      state.chartType = target.defaultChart;
    }

    // 重設表格分頁
    state.tablePage = 1;
    state.searchQuery = '';

    // 更新介面
    renderFieldLists();
    renderShelves();
    renderChartTypeSelector();
    renderKPIRibbon();
    renderVisualization();
    renderDataTable();

    // 更新 UI 狀態
    const dsSelect = document.getElementById('datasetQuickSelect');
    if (dsSelect) dsSelect.value = state.currentDatasetId;

    const fileStatus = document.getElementById('fileStatusBadge');
    if (fileStatus) fileStatus.textContent = `${state.rawRows.length} 列資料`;

    showToast(`⚡ 已載入「${state.datasetName}」！已對齊欄位與圖表。`);
  }

  // --- HTML 跳脫安全輔助函式 ---
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 單一欄位智慧語意深度判定 (Tableau Auto-Inference Engine) ---
  function autoInferColumnSchema(colName, rows) {
    const total = rows.length;
    let nonNullCount = 0;
    let numericCount = 0;
    let decimalCount = 0;
    const distinctSet = new Set();
    const sampleValues = [];

    // 取樣前 120 筆資料深入探查
    const scanLimit = Math.min(total, 120);
    for (let i = 0; i < scanLimit; i++) {
      const val = rows[i][colName];
      if (val !== null && val !== undefined && val !== '') {
        nonNullCount++;
        distinctSet.add(val);
        if (sampleValues.length < 10 && !sampleValues.includes(String(val))) {
          sampleValues.push(String(val));
        }

        const isActuallyNumeric = typeof val === 'number' || (
          typeof val === 'string' &&
          val.trim() !== '' &&
          !isNaN(Number(val.replace(/[,%]/g, '').trim()))
        );
        if (isActuallyNumeric) {
          numericCount++;
          const num = safeParseNumber(val);
          if (num % 1 !== 0 || String(val).includes('.')) {
            decimalCount++;
          }
        }
      }
    }

    const numericRatio = nonNullCount > 0 ? numericCount / nonNullCount : 0;
    const distinctCount = distinctSet.size;
    const isHighCardinality = distinctCount > 15;

    // 關鍵特徵正則比對
    const isGeo = /都道府縣|都道府県|県|縣|市|區|区|地方|地區|地域|国|國|country|prefecture|region|city|province|lat|lon|經度|緯度/i.test(colName) ||
                  Array.from(distinctSet).some(v => /東京|大阪|京都|北海道|愛知|福岡|神奈川|兵庫|廣島|沖繩|東北|關東|近畿|中部|中國|四國|九州/i.test(String(v)));
    const isDate = /年|月|日|date|time|year|month|day|時序|季度|quarter|period/i.test(colName);
    const isRateOrAvg = /率|%|ratio|rate|percent|pct|平均|均價|單價|坪價|所得/i.test(colName);
    const isCodeOrId = /id|code|代碼|代号|編號|序號/i.test(colName);
    const isBoolean = Array.from(distinctSet).every(v => /^(true|false|是|否|0|1|y|n)$/i.test(String(v))) && distinctCount <= 2;

    let role = 'dimension';
    let type = 'string';
    let nature = 'discrete';
    let agg = 'count';
    let reason = '定性字串類別維度';

    // 優先以資料數值佔比 (numericRatio) 作為第一判斷基準
    if (numericRatio >= 0.8) {
      // 數值欄位深入判定：是否為年度/年份維度
      const isYearOnly = /^(年份|年度|year|yr)$/i.test(colName.trim());
      if (isYearOnly) {
        type = 'date';
        role = 'dimension';
        nature = 'discrete';
        agg = 'count';
        reason = '歷史時序年度維度 (可切換為連續時間軸)';
      } else if (isCodeOrId || (distinctCount <= 4 && !isRateOrAvg && !isHighCardinality && decimalCount === 0)) {
        type = 'integer';
        role = 'dimension';
        nature = 'discrete';
        agg = 'count';
        reason = '離散整數分類代碼 (唯一下標少)';
      } else if (decimalCount > 0 || isRateOrAvg) {
        type = 'decimal';
        role = 'measure';
        nature = 'continuous';
        agg = isRateOrAvg ? 'avg' : 'sum';
        reason = isRateOrAvg ? '比率或平均數值指標，推薦連續 AVG 聚合' : '連續浮點數度量，推薦連續軸線';
      } else {
        type = 'integer';
        role = 'measure';
        nature = 'continuous';
        agg = isRateOrAvg ? 'avg' : 'sum';
        reason = isRateOrAvg ? '平均數值指標，推薦連續 AVG 聚合' : '體量計數整數指標，推薦連續 SUM 加總';
      }
    } else if (isGeo) {
      type = 'geo';
      role = 'dimension';
      nature = 'discrete';
      agg = 'count';
      reason = '地理空間維度 (日本行政區/地域特徵)';
    } else if (isDate) {
      type = 'date';
      role = 'dimension';
      nature = 'discrete';
      agg = 'count';
      reason = '日期時序維度 (定性分類)';
    } else if (isBoolean) {
      type = 'boolean';
      role = 'dimension';
      nature = 'discrete';
      agg = 'count';
      reason = '二元布林判斷標籤';
    } else {
      type = 'string';
      role = 'dimension';
      nature = 'discrete';
      agg = 'count';
      reason = '文字定性分類維度';
    }

    return {
      role,
      type,
      nature,
      agg,
      alias: colName,
      distinctCount,
      nullCount: total - nonNullCount,
      sampleValues,
      reason
    };
  }

  // --- 分析欄位綱要 (Tableau-like Schema Profiler) ---
  function analyzeSchema(rows) {
    if (!rows || rows.length === 0) return;
    const colSet = new Set();
    const scanRows = Math.min(rows.length, 10);
    for (let i = 0; i < scanRows; i++) {
      if (rows[i] && typeof rows[i] === 'object') {
        Object.keys(rows[i]).forEach(k => colSet.add(k));
      }
    }
    state.columns = Array.from(colSet);
    state.schemaConfig = {};
    state.autoInferredSchema = {};

    state.columns.forEach(col => {
      const config = autoInferColumnSchema(col, rows);
      state.schemaConfig[col] = config;
      state.autoInferredSchema[col] = JSON.parse(JSON.stringify(config));
    });

    syncSchemaToDimensionsAndMeasures();
  }

  // --- 同步 Schema 設定至維度與度量清單 ---
  function syncSchemaToDimensionsAndMeasures() {
    state.dimensions = [];
    state.measures = [];

    state.columns.forEach(col => {
      const cfg = state.schemaConfig[col] || {};
      if (cfg.role === 'measure') {
        state.measures.push(col);
      } else {
        state.dimensions.push(col);
      }
    });
  }

  // --- 渲染左側欄位清單 (PyGWalker Style Field Dock) ---
  function renderFieldLists() {
    const dimContainer = document.getElementById('dimensionsList');
    const meaContainer = document.getElementById('measuresList');
    if (!dimContainer || !meaContainer) return;

    dimContainer.innerHTML = '';
    meaContainer.innerHTML = '';

    // 1. 維度清單 (Dimensions)
    state.dimensions.forEach(dim => {
      const item = createFieldPill(dim, 'dimension');
      dimContainer.appendChild(item);
    });

    // 2. 度量清單 (Measures)
    state.measures.forEach(mea => {
      const item = createFieldPill(mea, 'measure');
      meaContainer.appendChild(item);
    });
  }

  // --- 建立單一欄位標籤 (支援拖曳、點擊快捷指派與 Tableau 語意圖標) ---
  function createFieldPill(fieldName, fieldType) {
    const div = document.createElement('div');
    div.className = `field-pill ${fieldType}`;
    div.setAttribute('draggable', 'true');
    div.dataset.field = fieldName;
    div.dataset.type = fieldType;

    const cfg = state.schemaConfig[fieldName] || {};
    let iconBadge = 'Abc';
    if (cfg.type === 'geo') iconBadge = '🌐';
    else if (cfg.type === 'date') iconBadge = '📅';
    else if (cfg.type === 'decimal') iconBadge = '#.0';
    else if (cfg.type === 'integer') iconBadge = '#';
    else if (cfg.type === 'boolean') iconBadge = 'T|F';
    else if (fieldType === 'measure') iconBadge = '#';

    const displayName = cfg.alias && cfg.alias !== fieldName ? `${cfg.alias} (${fieldName})` : fieldName;
    const tooltipText = `${displayName} · ${cfg.nature === 'continuous' ? '連續度量' : '離散維度'} · 預設聚合: ${(cfg.agg || 'RAW').toUpperCase()}`;

    const safeJsField = String(fieldName).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    div.innerHTML = `
      <span class="field-drag-handle">⋮⋮</span>
      <span class="field-type-badge" title="${cfg.type || fieldType}">${iconBadge}</span>
      <span class="field-name-text" title="${tooltipText}">${escapeHtml(cfg.alias || fieldName)}</span>
      <div class="field-quick-actions">
        <button type="button" class="field-quick-btn" title="指派至 X 軸 (Columns)" onclick="window.PyGWalker.assignToShelf('x', '${safeJsField}')">+X</button>
        <button type="button" class="field-quick-btn" title="指派至 Y 軸 (Rows)" onclick="window.PyGWalker.assignToShelf('y', '${safeJsField}')">+Y</button>
        <button type="button" class="field-quick-btn" title="指派至 顏色/大小" onclick="window.PyGWalker.assignToShelf('${fieldType === 'dimension' ? 'color' : 'size'}', '${safeJsField}')">${fieldType === 'dimension' ? '+色' : '+大'}</button>
        ${fieldType === 'dimension' ? `<button type="button" class="field-quick-btn facet-btn" title="指派至 分面小多圖 (Facet Small Multiples)" onclick="window.PyGWalker.assignToShelf('facet', '${safeJsField}')">+面</button>` : ''}
        <button type="button" class="field-quick-btn filter-btn" title="加入至篩選器 (Filters)" onclick="window.PyGWalker.addFilter('${safeJsField}')">+濾</button>
      </div>
    `;

    // 拖曳事件綁定
    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ field: fieldName, type: fieldType }));
      e.dataTransfer.effectAllowed = 'copyMove';
      div.classList.add('dragging');
    });

    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
    });

    return div;
  }

  // --- 渲染頂部視覺編碼槽 (Graphic Walker Shelves) ---
  function renderShelves() {
    renderSingleShelf('shelfX', 'x', state.shelf.x, 'Columns (X 軸 / 類別或時序)');
    renderSingleShelf('shelfY', 'y', state.shelf.y, 'Rows (Y 軸 / 主要數值指標)');
    renderSingleShelf('shelfColor', 'color', state.shelf.color, 'Color (顏色分組維度)');
    renderSingleShelf('shelfSize', 'size', state.shelf.size, 'Size (氣泡半徑大小指標)');
    renderSingleShelf('shelfSecondary', 'secondary', state.shelf.secondary, 'Secondary (次要指標 / 雙軸)');
    renderSingleShelf('shelfFacet', 'facet', state.shelf.facet, 'Facet (分面小多圖維度)');
    renderFiltersShelf();
    renderFilterControls();
  }

  // --- 智慧初始化常用篩選器 (地區分組 / 年份區間) ---
  function initDefaultFilters() {
    state.filters = {};

    // 1. 地區分區 / 洲別 / 分區 篩選器
    const regionField = state.columns.find(c => /地方分區|分區|洲別|地區|區域|地域/i.test(c));
    if (regionField) {
      const vals = [...new Set(state.rawRows.map(r => String(r[regionField] != null ? r[regionField] : '')).filter(Boolean))];
      if (vals.length > 1 && vals.length <= 15) {
        state.filters[regionField] = {
          field: regionField,
          type: 'categorical',
          allValues: vals,
          selected: new Set(vals)
        };
      }
    }

    // 2. 年份 / 時間 篩選器
    const yearField = state.columns.find(c => /年份|年度|year|時序/i.test(c));
    if (yearField) {
      const nums = state.rawRows.map(r => parseInt(String(r[yearField]), 10)).filter(v => !isNaN(v) && v >= 1800 && v <= 2100);
      if (nums.length > 1) {
        const [minY, maxY] = safeExtent(nums);
        if (minY !== maxY) {
          state.filters[yearField] = {
            field: yearField,
            type: 'range',
            isYear: true,
            min: minY,
            max: maxY,
            currentMin: minY,
            currentMax: maxY
          };
        }
      }
    }
  }

  // --- 取得當前作用中篩選條件過濾後的資料列 ---
  function getActiveRows() {
    if (!state.filters || Object.keys(state.filters).length === 0) {
      return state.rawRows;
    }
    return state.rawRows.filter(row => {
      for (const field in state.filters) {
        const f = state.filters[field];
        if (!f) continue;
        if (f.type === 'categorical') {
          const val = String(row[field] != null ? row[field] : '');
          if (f.selected && !f.selected.has(val)) {
            return false;
          }
        } else if (f.type === 'range') {
          let num = Number(row[field]);
          if (isNaN(num)) {
            num = parseInt(String(row[field]), 10);
          }
          if (!isNaN(num)) {
            if (f.currentMin != null && num < f.currentMin) return false;
            if (f.currentMax != null && num > f.currentMax) return false;
          }
        }
      }
      return true;
    });
  }

  // --- 篩選器管理函式 ---
  function addFilter(fieldName) {
    if (!fieldName || !state.columns.includes(fieldName)) return;
    if (state.filters[fieldName]) {
      showToast(`「${fieldName}」已在篩選器中`);
      return;
    }

    const isYear = /年份|年度|year|時序/i.test(fieldName);
    const isNumeric = state.measures.includes(fieldName) || isYear;
    if (isNumeric) {
      const nums = state.rawRows.map(r => isYear ? parseInt(String(r[fieldName]), 10) : Number(r[fieldName])).filter(v => !isNaN(v));
      if (nums.length > 0) {
        const [minVal, maxVal] = safeExtent(nums);
        state.filters[fieldName] = {
          field: fieldName,
          type: 'range',
          isYear: isYear,
          min: minVal,
          max: maxVal,
          currentMin: minVal,
          currentMax: maxVal
        };
      }
    } else {
      const vals = [...new Set(state.rawRows.map(r => String(r[fieldName] != null ? r[fieldName] : '')).filter(Boolean))];
      state.filters[fieldName] = {
        field: fieldName,
        type: 'categorical',
        allValues: vals,
        selected: new Set(vals)
      };
    }

    onFilterChanged();
    showToast(`✅ 已將「${fieldName}」加入篩選器！`);
  }

  function removeFilter(fieldName) {
    if (state.filters[fieldName]) {
      delete state.filters[fieldName];
      onFilterChanged();
      showToast(`已移除「${fieldName}」篩選器`);
    }
  }

  function toggleFilterValue(fieldName, val) {
    const f = state.filters[fieldName];
    if (!f || f.type !== 'categorical') return;
    if (f.selected.has(val)) {
      if (f.selected.size === 1) {
        showToast('⚠️ 至少保留一個選取項目');
        return;
      }
      f.selected.delete(val);
    } else {
      f.selected.add(val);
    }
    onFilterChanged();
  }

  function setAllFilterValues(fieldName, selectAll) {
    const f = state.filters[fieldName];
    if (!f || f.type !== 'categorical') return;
    if (selectAll) {
      f.selected = new Set(f.allValues);
    } else {
      f.selected.clear();
      if (f.allValues.length > 0) f.selected.add(f.allValues[0]);
    }
    onFilterChanged();
  }

  function setYearPreset(fieldName, preset) {
    const f = state.filters[fieldName];
    if (!f || f.type !== 'range') return;
    if (preset === 'all') {
      f.currentMin = f.min;
      f.currentMax = f.max;
    } else if (preset === 'latest') {
      f.currentMin = f.max;
      f.currentMax = f.max;
    } else if (typeof preset === 'number') {
      f.currentMin = Math.max(f.min, f.max - preset + 1);
      f.currentMax = f.max;
    }
    onFilterChanged();
  }

  function applyRangeFilter(fieldName) {
    const f = state.filters[fieldName];
    if (!f || f.type !== 'range') return;
    const minInput = document.getElementById(`rangeMin_${fieldName}`);
    const maxInput = document.getElementById(`rangeMax_${fieldName}`);
    if (minInput && maxInput) {
      const minV = Number(minInput.value);
      const maxV = Number(maxInput.value);
      if (!isNaN(minV) && !isNaN(maxV) && minV <= maxV) {
        f.currentMin = minV;
        f.currentMax = maxV;
        onFilterChanged();
        showToast(`已套用「${fieldName}」區間：${minV} ~ ${maxV}`);
      } else {
        alert('請輸入有效的數值範圍 (起始 <= 結束)！');
      }
    }
  }

  function resetAllFilters() {
    for (const field in state.filters) {
      const f = state.filters[field];
      if (f.type === 'categorical') {
        f.selected = new Set(f.allValues);
      } else if (f.type === 'range') {
        f.currentMin = f.min;
        f.currentMax = f.max;
      }
    }
    onFilterChanged();
    showToast('↺ 已重設所有篩選，恢復全量資料！');
  }

  function onFilterChanged() {
    renderShelves();
    renderFilterControls();
    renderVisualization();
    renderKPIRibbon();
    renderDataTable();
  }

  // --- 渲染 Filters 槽位中的標籤膠囊 ---
  function renderFiltersShelf() {
    const container = document.getElementById('shelfFilters');
    if (!container) return;

    const filterKeys = Object.keys(state.filters || {});
    if (filterKeys.length === 0) {
      container.innerHTML = `<span class="shelf-placeholder">拖曳欄位至此或點擊「+濾」</span>`;
      container.classList.remove('has-field');
    } else {
      container.classList.add('has-field');
      container.innerHTML = filterKeys.map(field => {
        const f = state.filters[field];
        let summary = '';
        if (f.type === 'categorical') {
          summary = `${f.selected.size}/${f.allValues.length}`;
        } else if (f.type === 'range') {
          summary = `${f.currentMin}~${f.currentMax}`;
        }
        return `
          <div class="shelf-pill dimension" style="margin: 2px 0;">
            <span class="field-type-badge" style="color: #2563eb;">▼</span>
            <span class="shelf-pill-name" title="${escapeHtml(field)} (${summary})">${escapeHtml(field)}: ${summary}</span>
            <button type="button" class="shelf-pill-remove" onclick="window.PyGWalker.removeFilter('${escapeHtml(field)}')" title="移除此篩選條件">✕</button>
          </div>
        `;
      }).join('');
    }
  }

  // --- 渲染動態地區分組與年份區間篩選控制列 (Active Filters Strip) ---
  function renderFilterControls() {
    const strip = document.getElementById('activeFiltersStrip');
    if (!strip) return;

    const filterKeys = Object.keys(state.filters || {});
    if (filterKeys.length === 0) {
      strip.innerHTML = `
        <span class="filter-strip-label">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          作用中篩選器：
        </span>
        <span style="font-size: 11px; color: #94a3b8; font-style: italic;">
          目前未設定篩選條件（可自左側欄位清單點擊「+濾」或拖曳欄位至頂部 Filters 槽，自選想聚焦的地區或年份區間）
        </span>
      `;
      return;
    }

    let html = `
      <span class="filter-strip-label">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        篩選控制 (${filterKeys.length})：
      </span>
    `;

    filterKeys.forEach(field => {
      const f = state.filters[field];
      if (!f) return;

      if (f.type === 'categorical') {
        const counts = {};
        state.rawRows.forEach(r => {
          const k = String(r[field] != null ? r[field] : '');
          counts[k] = (counts[k] || 0) + 1;
        });

        html += `
          <div class="filter-group-card">
            <span class="filter-group-header">📍 ${escapeHtml(field)}:</span>
            <button type="button" class="filter-quick-action" onclick="window.PyGWalker.setAllFilterValues('${escapeHtml(field)}', true)">全選</button>
            <button type="button" class="filter-quick-action" onclick="window.PyGWalker.setAllFilterValues('${escapeHtml(field)}', false)">全清</button>
            <div class="filter-chip-container">
              ${f.allValues.map(val => {
                const isAct = f.selected.has(val);
                const c = counts[val] || 0;
                return `<button type="button" class="filter-chip-btn ${isAct ? 'active' : ''}" onclick="window.PyGWalker.toggleFilterValue('${escapeHtml(field)}', '${escapeHtml(val)}')">
                  ${escapeHtml(val)} <span class="filter-count">(${c})</span>
                </button>`;
              }).join('')}
            </div>
          </div>
        `;
      } else if (f.type === 'range') {
        html += `
          <div class="filter-group-card">
            <span class="filter-group-header">📅 ${escapeHtml(field)}:</span>
            <div class="filter-range-wrap">
              <button type="button" class="filter-preset-btn" onclick="window.PyGWalker.setYearPreset('${escapeHtml(field)}', 'all')">全部 (${f.min}–${f.max})</button>
              <button type="button" class="filter-preset-btn" onclick="window.PyGWalker.setYearPreset('${escapeHtml(field)}', 30)">近30年</button>
              <button type="button" class="filter-preset-btn" onclick="window.PyGWalker.setYearPreset('${escapeHtml(field)}', 20)">近20年</button>
              <button type="button" class="filter-preset-btn" onclick="window.PyGWalker.setYearPreset('${escapeHtml(field)}', 10)">近10年</button>
              <button type="button" class="filter-preset-btn" onclick="window.PyGWalker.setYearPreset('${escapeHtml(field)}', 'latest')">最新 (${f.max})</button>
              <span>｜ 從</span>
              <input type="number" class="filter-range-input" id="rangeMin_${escapeHtml(field)}" value="${f.currentMin}" min="${f.min}" max="${f.max}">
              <span>至</span>
              <input type="number" class="filter-range-input" id="rangeMax_${escapeHtml(field)}" value="${f.currentMax}" min="${f.min}" max="${f.max}">
              <span>年</span>
              <button type="button" class="filter-range-btn" onclick="window.PyGWalker.applyRangeFilter('${escapeHtml(field)}')">套用</button>
            </div>
          </div>
        `;
      }
    });

    html += `
      <button type="button" class="filter-reset-btn" onclick="window.PyGWalker.resetAllFilters()" title="重設所有條件，恢復顯示全量數據">
        ✕ 重設所有篩選
      </button>
    `;

    strip.innerHTML = html;
    if (echartsInstance) {
      setTimeout(() => { try { echartsInstance.resize(); } catch(e){} }, 50);
    }
  }

  function renderSingleShelf(elemId, shelfKey, currentField, placeholderText) {
    const container = document.getElementById(elemId);
    if (!container) return;

    if (shelfKey === 'y' && state.shelf.yMulti && state.shelf.yMulti.length > 0) {
      container.classList.add('has-field');
      let pillsHtml = state.shelf.yMulti.map((f, idx) => {
        const color = PALETTE[idx % PALETTE.length];
        return `
          <div class="shelf-pill measure" style="border-left: 3px solid ${color};">
            <span class="field-type-badge">#</span>
            <span class="shelf-pill-name" style="font-weight: 600;">${escapeHtml(f)}</span>
            <button type="button" class="shelf-pill-remove" onclick="window.PyGWalker.removeMultiMeasure('${escapeHtml(f)}')" title="移除此對比指標">✕</button>
          </div>
        `;
      }).join('');

      pillsHtml += `
        <button type="button" class="btn btn-sm btn-outline btn-shelf-compare" onclick="window.PyGWalker.openMultiMeasureModal()" title="調整或增加對比指標" style="margin-left: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; border-color: #ea580c; color: #c2410c; background: #fff7ed; border-radius: 4px;">
          ⚡ 多指標對比 (${state.shelf.yMulti.length})
        </button>
      `;
      container.innerHTML = pillsHtml;
      return;
    }

    if (!currentField) {
      container.innerHTML = `<span class="shelf-placeholder">${placeholderText}</span>`;
      container.classList.remove('has-field');
    } else {
      container.classList.add('has-field');
      const isMeasure = state.measures.includes(currentField);
      const badge = isMeasure ? '#' : 'T';
      const pillClass = isMeasure ? 'measure' : 'dimension';
      
      let aggHtml = '';
      if (isMeasure && shelfKey === 'y') {
        aggHtml = `<span class="shelf-agg-badge" onclick="window.PyGWalker.cycleAgg(event)" title="點擊切換聚合方式 (RAW ➔ SUM ➔ MEAN ➔ MAX ➔ MIN ➔ COUNT)">[${state.shelf.agg}]</span>`;
      }

      let extraCompareBtn = '';
      if (shelfKey === 'y') {
        extraCompareBtn = `
          <button type="button" class="btn btn-sm btn-outline btn-shelf-compare" onclick="window.PyGWalker.openMultiMeasureModal()" title="開啟多數值指標並列比較 (幼年 vs 勞動占比等)" style="margin-left: 6px; padding: 2px 7px; font-size: 11px; font-weight: 600; border-color: #cbd5e1; color: #475569; background: #fff; border-radius: 4px;">
            ＋ 多指標比較
          </button>
        `;
      } else if (shelfKey === 'color') {
        const hasColorGrouping = state.dimensions.includes(currentField);
        if (hasColorGrouping && state.chartType === 'bar') {
          extraCompareBtn = `
            <div class="shelf-mode-toggle-group" title="切換柱狀圖：併排對比 (Grouped) 或 堆疊累計 (Stacked)">
              <button type="button" class="btn-stack-toggle ${!state.barStackMode ? 'active' : ''}" onclick="window.PyGWalker.setBarStackMode(false)" title="併排柱狀圖 (Grouped / Clustered Bars)">
                併排
              </button>
              <button type="button" class="btn-stack-toggle ${state.barStackMode ? 'active' : ''}" onclick="window.PyGWalker.setBarStackMode(true)" title="堆疊柱狀圖 (Stacked Bars)">
                堆疊
              </button>
            </div>
          `;
        }
      } else if (shelfKey === 'facet') {
        const hasFacet = state.dimensions.includes(currentField);
        if (hasFacet) {
          extraCompareBtn = `
            <button type="button" class="btn-facet-scale ${state.facetScaleMode === 'free' ? 'scale-free' : ''}" onclick="window.PyGWalker.toggleFacetScale()" title="切換 Y 軸比例尺：統一量表 (Fixed) 或 獨立自適應 (Free)">
              ${state.facetScaleMode === 'fixed' ? '🔒 統一量表' : '🔓 獨立量表'}
            </button>
          `;
        }
      }

      container.innerHTML = `
        <div class="shelf-pill ${pillClass}" draggable="true" data-field="${escapeHtml(currentField)}" data-shelf="${shelfKey}" title="可拖曳移動至其他編碼槽">
          <span class="field-drag-handle" style="font-size: 10px; cursor: grab; opacity: 0.6; margin-right: 2px;">⋮⋮</span>
          <span class="field-type-badge">${badge}</span>
          ${aggHtml}
          <span class="shelf-pill-name">${escapeHtml(currentField)}</span>
          <button type="button" class="shelf-pill-remove" onclick="window.PyGWalker.clearShelf('${shelfKey}')" title="移除此槽位欄位">✕</button>
        </div>
        ${extraCompareBtn}
      `;

      // 支援槽位間膠囊互相拖曳
      const pillEl = container.querySelector('.shelf-pill');
      if (pillEl) {
        pillEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ field: currentField, type: isMeasure ? 'measure' : 'dimension', fromShelf: shelfKey }));
          e.dataTransfer.effectAllowed = 'copyMove';
          pillEl.classList.add('dragging');
        });
        pillEl.addEventListener('dragend', () => {
          pillEl.classList.remove('dragging');
        });
      }
    }
  }

  // --- 拖拉事件掛載 (HTML5 Drag and Drop API) ---
  function setupDragAndDrop() {
    const shelfMappings = [
      { id: 'shelfX', key: 'x' },
      { id: 'shelfY', key: 'y' },
      { id: 'shelfColor', key: 'color' },
      { id: 'shelfSize', key: 'size' },
      { id: 'shelfSecondary', key: 'secondary' },
      { id: 'shelfFacet', key: 'facet' },
      { id: 'shelfFilters', key: 'filters' }
    ];

    shelfMappings.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const parentGroup = el.closest('.shelf-group') || el;

      const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        parentGroup.classList.add('drag-over');
        el.classList.add('drag-over');
      };

      const handleDragLeave = (e) => {
        if (parentGroup.contains(e.relatedTarget)) return;
        parentGroup.classList.remove('drag-over');
        el.classList.remove('drag-over');
      };

      const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        parentGroup.classList.remove('drag-over');
        el.classList.remove('drag-over');
        try {
          const raw = e.dataTransfer.getData('text/plain');
          if (!raw) return;
          const info = JSON.parse(raw);
          if (key === 'filters') {
            addFilter(info.field);
          } else {
            // 若從另一個視覺槽位拖曳過來，先清空原槽位，達成搬移效果
            if (info.fromShelf && info.fromShelf !== key && info.fromShelf !== 'filters') {
              state.shelf[info.fromShelf] = '';
              if (info.fromShelf === 'y') {
                state.shelf.yMulti = [];
              }
            }
            setShelfField(key, info.field);
          }
        } catch (err) {
          console.error('Drop error:', err);
        }
      };

      // 綁定至外層卡片與內層放置區，極大化點擊與放置熱區
      parentGroup.addEventListener('dragover', handleDragOver);
      parentGroup.addEventListener('dragleave', handleDragLeave);
      parentGroup.addEventListener('drop', handleDrop);
    });
  }

  // --- 設定指定槽位欄位 ---
  function setShelfField(shelfKey, fieldName) {
    state.shelf[shelfKey] = fieldName;
    if (shelfKey === 'y') {
      state.shelf.yMulti = [];
    }
    
    // 智慧偵測：若 X 與 Y 皆為連續數值，自動建議散點矩陣
    if (shelfKey === 'x' || shelfKey === 'y') {
      const isXNum = state.measures.includes(state.shelf.x);
      const isYNum = state.measures.includes(state.shelf.y);
      if (isXNum && isYNum && state.chartType !== 'scatter') {
        state.chartType = 'scatter';
        renderChartTypeSelector();
      }
    }

    renderShelves();
    renderVisualization();
    renderKPIRibbon();
    const shelfDescMap = {
      x: 'Columns (X 軸)',
      y: 'Rows (Y 軸)',
      color: 'Color (顏色分組)',
      size: 'Size (大小指標)',
      secondary: 'Secondary (雙軸次指標)',
      facet: 'Facet (分面小多圖)'
    };
    showToast(`已將「${fieldName}」套用至 ${shelfDescMap[shelfKey] || shelfKey.toUpperCase()} 編碼槽`);
  }

  // --- 圖表選擇器更新 ---
  function renderChartTypeSelector() {
    const btns = document.querySelectorAll('.chart-type-card');
    btns.forEach(b => {
      if (b.dataset.chart === state.chartType) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // --- 頂部 KPI Ribbon 數值計算 ---
  function renderKPIRibbon() {
    const kpiRows = document.getElementById('kpiRowCount');
    const kpiSum = document.getElementById('kpiTotalSum');
    const kpiMean = document.getElementById('kpiMeanVal');
    const kpiMaxMin = document.getElementById('kpiMetric4Val');
    const kpiMaxMinTitle = document.getElementById('kpiMetric4Title');

    if (!kpiRows || !kpiSum) return;

    const data = getActiveRows();
    const isFiltered = data.length < state.rawRows.length;
    if (isFiltered) {
      kpiRows.innerHTML = `${data.length.toLocaleString()} <span style="font-size: 11px; color: #2563eb; font-weight: 700;">(已篩選 / 原${state.rawRows.length})</span>`;
    } else {
      kpiRows.textContent = data.length.toLocaleString();
    }

    // 智慧偵測當前作用中的度量 (支援 Y 軸或對調後的 X 軸)
    const activeMeasure = (state.shelf.y && state.measures.includes(state.shelf.y))
      ? state.shelf.y
      : ((state.shelf.x && state.measures.includes(state.shelf.x)) ? state.shelf.x : null);

    if (activeMeasure) {
      const nums = data.map(d => safeParseNumber(d[activeMeasure])).filter(v => typeof v === 'number' && !isNaN(v));
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        const avg = sum / nums.length;
        const [min, max] = safeExtent(nums);

        kpiSum.textContent = formatCompactNumber(sum);
        kpiMean.textContent = avg >= 1000 ? formatCompactNumber(avg) : avg.toFixed(2);
        if (kpiMaxMinTitle) kpiMaxMinTitle.textContent = 'MAX / MIN';
        if (kpiMaxMin) kpiMaxMin.textContent = `${formatCompactNumber(max)} / ${formatCompactNumber(min)}`;
      } else {
        kpiSum.textContent = '0';
        kpiMean.textContent = '0';
        if (kpiMaxMin) kpiMaxMin.textContent = '0 / 0';
      }
    } else {
      kpiSum.textContent = '-';
      kpiMean.textContent = '-';
      if (kpiMaxMin) kpiMaxMin.textContent = '-';
    }
  }

  function formatCompactNumber(num) {
    if (num === null || num === undefined || (typeof num === 'number' && isNaN(num))) return '-';
    const n = Number(num);
    if (isNaN(n)) return String(num);
    const abs = Math.abs(n);
    if (abs >= 100000000) {
      return (n / 100000000).toFixed(2) + '億';
    }
    if (abs >= 10000) {
      return (n / 10000).toFixed(1) + '萬';
    }
    if (Number.isInteger(n)) {
      return n.toLocaleString();
    }
    return Number(n.toFixed(2)).toLocaleString();
  }

  // --- 核心視覺化渲染分流 (ECharts vs Native Canvas) ---
  function renderVisualization() {
    const canvasWrap = document.getElementById('canvasViewport');
    const echartsWrap = document.getElementById('echartsViewport');

    if (state.engine === 'echarts') {
      if (canvasWrap) canvasWrap.style.display = 'none';
      if (echartsWrap) {
        echartsWrap.style.display = 'block';
        renderECharts();
      }
    } else {
      if (echartsWrap) echartsWrap.style.display = 'none';
      if (canvasWrap) {
        canvasWrap.style.display = 'block';
        renderNativeCanvas();
      }
    }
  }

  // --- 雙維度分面小多圖渲染引擎 (Small Multiples / Multi-Grid Facet Engine) ---
  function renderSmallMultiplesECharts(data, xField, yField, secField, facetField, facetCategories) {
    const K = facetCategories.length;
    let numCols = 2;
    let numRows = 1;
    if (K === 2) {
      numCols = 2; numRows = 1;
    } else if (K === 3) {
      numCols = 3; numRows = 1;
    } else if (K === 4) {
      numCols = 2; numRows = 2;
    } else if (K <= 6) {
      numCols = 3; numRows = 2;
    } else if (K <= 8) {
      numCols = 4; numRows = 2;
    } else {
      numCols = Math.min(4, Math.ceil(Math.sqrt(K)));
      numRows = Math.ceil(K / numCols);
    }

    // 視圖自適應高度計算：確保多列 (2~3列) 小多圖具備充裕縱向空間，徹底杜絕上下標籤與刻度互相擠壓
    const container = document.getElementById('echartsViewport');
    if (container) {
      const neededHeight = numRows === 1 ? '100%' : (numRows === 2 ? '680px' : (numRows === 3 ? '920px' : `${Math.max(920, numRows * 300)}px`));
      if (container.style.height !== neededHeight) {
        container.style.height = neededHeight;
        container.style.minHeight = neededHeight;
        if (echartsInstance) echartsInstance.resize();
      }
    }

    // 計算 X 軸唯一分類 (保持一致排列順序)
    const xCategories = [...new Set(data.map(d => String(d[xField] != null ? d[xField] : '')).filter(Boolean))];
    if (state.sortDescending) {
      const xTotals = {};
      xCategories.forEach(x => { xTotals[x] = 0; });
      data.forEach(d => {
        const x = String(d[xField] != null ? d[xField] : '');
        if (xTotals[x] !== undefined) {
          xTotals[x] += safeParseNumber(d[yField]);
        }
      });
      xCategories.sort((a, b) => xTotals[b] - xTotals[a]);
    }

    // 計算全局 Y 軸最大值 (用於統一量表 Fixed Scale，預留 28% 頂部空間避免標籤與圖頂干涉)
    const allNums = data.map(d => safeParseNumber(d[yField])).filter(v => typeof v === 'number' && !isNaN(v));
    const globalMaxY = allNums.length > 0 ? safeMax(allNums, 100) : 100;
    const paddedMaxY = Math.ceil(globalMaxY * 1.28);

    // 次要指標雙軸支援 (預留 25% 空間)
    const hasSec = secField && state.measures.includes(secField);
    let globalMaxSec = 100;
    if (hasSec) {
      const secNums = data.map(d => safeParseNumber(d[secField])).filter(v => typeof v === 'number' && !isNaN(v));
      if (secNums.length > 0) globalMaxSec = Math.ceil(safeMax(secNums, 100) * 1.25);
    }

    // 計算子面板座標留白比例
    const totalLeft = 7.5;
    const totalRight = hasSec ? 7.5 : 4.5;
    const totalTop = numRows === 1 ? 14 : 12;
    const totalBottom = (xCategories.length > 6 || numCols >= 3) ? (numRows === 1 ? 15 : 17) : 11;
    const colGap = numCols > 2 ? 3.5 : 5.5;
    const rowGap = numRows > 1 ? 12 : 0;

    const availW = 100 - totalLeft - totalRight - (numCols - 1) * colGap;
    const panelW = availW / numCols;

    const availH = 100 - totalTop - totalBottom - (numRows - 1) * rowGap;
    const panelH = availH / numRows;

    const titles = [];
    const grids = [];
    const xAxes = [];
    const yAxes = [];
    const series = [];

    facetCategories.forEach((cat, idx) => {
      const r = Math.floor(idx / numCols);
      const c = idx % numCols;
      const pLeft = totalLeft + c * (panelW + colGap);
      const pTop = totalTop + r * (panelH + rowGap);
      const catColor = REGION_COLORS[cat] || PALETTE[idx % PALETTE.length];
      const catRows = data.filter(d => String(d[facetField]) === cat);
      const catSum = catRows.reduce((sum, d) => sum + safeParseNumber(d[yField]), 0);

      // 1. 子圖標題卡 (Tableau 簡潔面板標籤風格，去除冗長欄位前綴以防橫向超寬重疊)
      const titleTopOffset = numRows === 1 ? 6.5 : (numRows === 2 ? 5.5 : 4.6);
      titles.push({
        text: cat,
        left: `${pLeft + panelW / 2}%`,
        top: `${pTop - titleTopOffset}%`,
        textAlign: 'center',
        itemGap: 3,
        textStyle: {
          fontSize: numCols >= 4 ? 12 : 13.5,
          fontWeight: 700,
          color: catColor
        },
        subtext: `${facetField} · 樣本: ${catRows.length} 列 · 總計: ${formatCompactNumber(catSum)}`,
        subtextStyle: {
          fontSize: numCols >= 4 ? 9.5 : 10.5,
          color: '#64748b'
        }
      });

      // 2. 網格容器
      grids.push({
        left: `${pLeft}%`,
        top: `${pTop}%`,
        width: `${panelW}%`,
        height: `${panelH}%`,
        containLabel: true
      });

      // 根據量表模式決定 X 軸刻度：
      // 'fixed': 所有子圖共用全域 X 軸分類，維持同位置跨面板對齊
      // 'free': 各子圖自適應裁剪，只保留該子圖真正有資料的分類，避免無效空標籤擠壓
      const localXCategories = [...new Set(catRows.map(d => String(d[xField] != null ? d[xField] : '')).filter(Boolean))];
      const panelXCategories = (state.facetScaleMode === 'free' && localXCategories.length > 0)
        ? localXCategories
        : xCategories;

      const isPanelRotated = panelXCategories.length > 6 || (numCols >= 3 && panelXCategories.length > 2);

      // 3. X 軸
      xAxes.push({
        gridIndex: idx,
        type: 'category',
        data: panelXCategories,
        axisLabel: {
          interval: 0,
          rotate: isPanelRotated ? 32 : 0,
          color: '#475569',
          fontSize: numCols >= 4 ? 9.5 : 10.5,
          margin: 8,
          overflow: 'truncate',
          ellipsis: '...'
        },
        axisTick: { alignWithLabel: true }
      });

      // 4. Y 軸 (主軸 - 垂直居中放置名稱，徹底解決與上方標題重疊)
      const isLeftEdge = c === 0;
      const yAxisIndex = yAxes.length;
      yAxes.push({
        gridIndex: idx,
        type: 'value',
        name: isLeftEdge ? yField : '',
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 38,
        nameTextStyle: {
          fontSize: 10.5,
          fontWeight: 600,
          color: '#64748b'
        },
        max: state.facetScaleMode === 'fixed' ? paddedMaxY : (val) => Math.ceil(val.max * 1.28),
        axisLabel: {
          formatter: (v) => formatCompactNumber(v),
          fontSize: numCols >= 4 ? 9 : 10,
          color: '#64748b'
        },
        splitLine: {
          lineStyle: { color: '#f1f5f9' }
        }
      });

      // 5. 次軸 (若有 - 垂直居中放置名稱，徹底解決與右側上方標題重疊)
      let secYAxisIndex = null;
      if (hasSec) {
        secYAxisIndex = yAxes.length;
        const isRightEdge = c === numCols - 1;
        yAxes.push({
          gridIndex: idx,
          type: 'value',
          position: 'right',
          name: isRightEdge ? secField : '',
          nameLocation: 'middle',
          nameRotate: -90,
          nameGap: 38,
          nameTextStyle: {
            fontSize: 10.5,
            fontWeight: 600,
            color: '#ea580c'
          },
          max: state.facetScaleMode === 'fixed' ? globalMaxSec : (val) => Math.ceil(val.max * 1.25),
          axisLabel: {
            formatter: (v) => formatCompactNumber(v),
            fontSize: numCols >= 4 ? 9 : 10,
            color: '#ea580c'
          },
          splitLine: { show: false }
        });
      }

      // 6. 主系列 Series
      const rowMap = new Map();
      catRows.forEach(d => rowMap.set(String(d[xField]), safeParseNumber(d[yField])));

      const colorField = state.shelf.color;
      const colorMap = new Map();
      if (colorField && colorField !== facetField) {
        catRows.forEach(d => colorMap.set(String(d[xField]), String(d[colorField])));
      }

      const seriesVals = panelXCategories.map(x => {
        if (!rowMap.has(x)) return '-';
        const val = rowMap.get(x);
        if (colorField && colorField !== facetField && colorMap.has(x)) {
          const cVal = colorMap.get(x);
          const barColor = REGION_COLORS[cVal] || PALETTE[xCategories.indexOf(x) % PALETTE.length];
          return {
            value: val,
            itemStyle: { color: barColor }
          };
        }
        return val;
      });

      const chartType = state.chartType === 'line' ? 'line' : 'bar';
      series.push({
        name: cat,
        type: chartType,
        xAxisIndex: idx,
        yAxisIndex: yAxisIndex,
        data: seriesVals,
        smooth: chartType === 'line',
        symbolSize: 6,
        itemStyle: {
          color: catColor,
          borderRadius: chartType === 'bar' ? [4, 4, 0, 0] : undefined
        },
        lineStyle: chartType === 'line' ? { width: 3 } : undefined,
        // 精緻圓角膠囊式標註，永遠保留 28% 頭部空間，杜絕刺出網格與標題重疊
        markPoint: state.showLabels ? {
          symbol: 'roundRect',
          symbolSize: [40, 18],
          symbolOffset: [0, -10],
          itemStyle: {
            color: catColor,
            shadowBlur: 3,
            shadowColor: 'rgba(0,0,0,0.12)'
          },
          label: {
            fontSize: 9.5,
            fontWeight: 700,
            color: '#ffffff'
          },
          data: [{ type: 'max', name: '最高' }]
        } : undefined,
        markLine: state.showAverage ? {
          data: [{ type: 'average', name: '平均線' }]
        } : undefined
      });

      // 7. 次指標 Series (若有)
      if (hasSec && secYAxisIndex !== null) {
        const secMap = new Map();
        catRows.forEach(d => secMap.set(String(d[xField]), safeParseNumber(d[secField])));
        const secVals = panelXCategories.map(x => secMap.has(x) ? secMap.get(x) : '-');

        series.push({
          name: `${cat} · ${secField}`,
          type: 'line',
          xAxisIndex: idx,
          yAxisIndex: secYAxisIndex,
          data: secVals,
          smooth: true,
          symbolSize: 5,
          itemStyle: { color: '#ea580c' },
          lineStyle: { width: 2, type: 'dashed' }
        });
      }
    });

    const smallMultiplesOption = {
      backgroundColor: 'transparent',
      title: titles,
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      series: series,
      axisPointer: {
        link: [{ xAxisIndex: 'all' }]
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          let tip = `<div style="font-size:12px; line-height:1.6;"><strong style="font-size:13px; color:#0f172a;">${escapeHtml(params[0].axisValueLabel || params[0].name)}</strong><br/>`;
          params.forEach(p => {
            const val = (p.data && typeof p.data === 'object' && p.data.value !== undefined) ? p.data.value : p.value;
            if (val !== '-' && val !== null && val !== undefined) {
              const colorDot = `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:8px;height:8px;background-color:${p.color};"></span>`;
              tip += `${colorDot} ${escapeHtml(p.seriesName)}: <b>${formatCompactNumber(val)}</b><br/>`;
            }
          });
          tip += `</div>`;
          return tip;
        }
      }
    };

    echartsInstance.clear();
    echartsInstance.setOption(smallMultiplesOption);
  }

  // --- 渲染 Apache ECharts 圖表 (超流暢現代探索) ---
  function renderECharts() {
    const container = document.getElementById('echartsViewport');
    if (!container) return;

    if (!echartsInstance) {
      echartsInstance = echarts.init(container);
      const debouncedResize = debounce(() => {
        if (echartsInstance) echartsInstance.resize();
      }, 100);
      window.addEventListener('resize', debouncedResize);
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(debouncedResize);
        ro.observe(container);
      }
    }

    const xField = state.shelf.x;
    const yField = state.shelf.y;
    const colorField = state.shelf.color;
    const sizeField = state.shelf.size;
    const secField = state.shelf.secondary;
    const facetField = state.shelf.facet;
    let data = getVisualData();

    if (data.length === 0) {
      echartsInstance.clear();
      echartsInstance.setOption({
        title: {
          text: '目前篩選條件下無符合資料，請調整上方地區或年份篩選器',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#94a3b8', fontSize: 16 }
        }
      });
      return;
    }

    if (!xField || !yField) {
      echartsInstance.clear();
      echartsInstance.setOption({
        title: {
          text: '請自左側拖曳或點擊欄位指派 X 軸與 Y 軸',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#94a3b8', fontSize: 16 }
        }
      });
      return;
    }

    // 判斷是否啟用 Small Multiples (雙維度分面小多圖)
    const isFacetActive = facetField && state.dimensions.includes(facetField);
    const facetCategories = isFacetActive
      ? [...new Set(data.map(d => String(d[facetField] != null ? d[facetField] : '')).filter(Boolean))]
      : [];
    const hasSmallMultiples = facetCategories.length > 1;

    if (hasSmallMultiples) {
      renderSmallMultiplesECharts(data, xField, yField, secField, facetField, facetCategories);
      return;
    }

    if (container && container.style.height !== '100%') {
      container.style.height = '100%';
      container.style.minHeight = '200px';
    }

    // 排序處理
    if (state.sortDescending && state.chartType === 'bar') {
      if (state.measures.includes(yField)) {
        data.sort((a, b) => safeParseNumber(b[yField]) - safeParseNumber(a[yField]));
      } else if (state.measures.includes(xField)) {
        data.sort((a, b) => safeParseNumber(b[xField]) - safeParseNumber(a[xField]));
      }
    }

    const xVals = data.map(d => d[xField]);
    const yVals = data.map(d => safeParseNumber(d[yField]));

    // 計算底部邊距與 X 軸旋轉以保證 X 軸標籤與 DataZoom 滑桿絕對不重疊
    const isSwapped = state.chartType === 'bar' && state.measures.includes(xField) && !state.measures.includes(yField);
    const hasCategoryX = !isSwapped && ['bar', 'line', 'dual', 'boxplot'].includes(state.chartType);
    const needSlider = hasCategoryX && xVals.length > 12;
    const isRotated = hasCategoryX && xVals.length > 12;
    // 底部留白像素：有滑桿 + 旋轉標籤 = 82px；有滑桿 + 水平標籤 = 68px；無滑桿 + 旋轉 = 54px；無滑桿 + 水平 = 42px
    const dynamicBottomMargin = isSwapped ? 45 : (needSlider ? (isRotated ? 82 : 68) : (isRotated ? 54 : 42));

    let option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: state.chartType === 'scatter' ? 'item' : 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params) => {
          if (Array.isArray(params)) {
            if (params.length === 0) return '';
            let tip = `<div style="font-size:12px; line-height:1.6;"><strong style="font-size:13px; color:#0f172a;">${escapeHtml(params[0].axisValueLabel || params[0].name)}</strong><br/>`;
            let total = 0;
            let valCount = 0;
            params.forEach(p => {
              const val = (p.data && typeof p.data === 'object' && p.data.value !== undefined) ? p.data.value : p.value;
              if (val !== '-' && val !== null && val !== undefined) {
                const num = Number(val);
                if (!isNaN(num)) {
                  total += num;
                  valCount++;
                }
                const colorDot = `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:8px;height:8px;background-color:${p.color};"></span>`;
                tip += `${colorDot} ${escapeHtml(p.seriesName)}: <b>${formatCompactNumber(val)}</b><br/>`;
              }
            });
            if (valCount > 1) {
              tip += `<div style="border-top:1px dashed #cbd5e1; margin-top:4px; padding-top:4px; color:#475569;">合計: <b style="color:#2563eb;">${formatCompactNumber(Math.round(total * 100) / 100)}</b></div>`;
            }
            tip += `</div>`;
            return tip;
          }
          if (params && params.seriesType === 'scatter') {
            return undefined; // use scatter specific formatter
          }
          return `${escapeHtml(params.name)}: ${formatCompactNumber(params.value)}`;
        }
      },
      legend: {
        top: 10,
        textStyle: { color: '#334155' }
      },
      grid: {
        left: '5%',
        right: secField ? '7%' : '4%',
        bottom: dynamicBottomMargin,
        top: '12%',
        containLabel: true
      }
    };

    // 依 7 大數據原子組織 option
    if (state.chartType === 'bar') {
      const isSwapped = state.measures.includes(xField) && !state.measures.includes(yField);
      if (isSwapped) {
        // 水平長條圖：X 軸為數值 Measure，Y 軸為維度 Dimension
        const numVals = data.map(d => safeParseNumber(d[xField]));

        option.xAxis = {
          type: 'value',
          name: xField,
          axisLabel: {
            formatter: (v) => formatCompactNumber(v)
          }
        };

        const colorCategories = (colorField && state.dimensions.includes(colorField))
          ? [...new Set(data.map(d => String(d[colorField] != null ? d[colorField] : '')).filter(Boolean))]
          : [];
        const hasColorGrouping = colorCategories.length > 1;

        const yCategories = hasColorGrouping
          ? [...new Set(data.map(d => String(d[yField] != null ? d[yField] : '')).filter(Boolean))]
          : data.map(d => String(d[yField] ?? ''));

        if (hasColorGrouping && state.sortDescending) {
          const yTotals = {};
          yCategories.forEach(y => { yTotals[y] = 0; });
          data.forEach(d => {
            const y = String(d[yField] != null ? d[yField] : '');
            if (yTotals[y] !== undefined) {
              yTotals[y] += safeParseNumber(d[xField]);
            }
          });
          yCategories.sort((a, b) => yTotals[b] - yTotals[a]);
        }

        option.yAxis = [
          {
            type: 'category',
            data: yCategories,
            inverse: true,
            axisLabel: {
              interval: 0,
              color: '#475569',
              fontSize: 11
            }
          }
        ];

        let seriesList = [];
        if (hasColorGrouping) {
          const isSubPartition = data.length > yCategories.length;
          colorCategories.forEach((cat, catIdx) => {
            const color = REGION_COLORS[cat] || PALETTE[catIdx % PALETTE.length];
            let catVals;
            if (isSubPartition) {
              const rowMap = new Map();
              data.filter(d => String(d[colorField]) === cat).forEach(d => {
                rowMap.set(String(d[yField]), safeParseNumber(d[xField]));
              });
              catVals = yCategories.map(y => rowMap.has(y) ? rowMap.get(y) : 0);
            } else {
              catVals = yCategories.map(y => {
                const row = data.find(d => String(d[yField]) === y);
                return (row && String(row[colorField]) === cat) ? safeParseNumber(row[xField]) : '-';
              });
            }

            seriesList.push({
              name: cat,
              type: 'bar',
              barGap: '12%',
              stack: state.barStackMode ? 'total' : (isSubPartition ? undefined : 'single'),
              data: catVals,
              itemStyle: {
                color: color,
                borderRadius: [0, 4, 4, 0]
              },
              markPoint: (catIdx === 0 && state.showLabels) ? {
                data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }]
              } : undefined,
              markLine: (catIdx === 0 && state.showAverage) ? {
                data: [{ type: 'average', name: '平均線' }]
              } : undefined
            });
          });
        } else {
          let seriesData = numVals;
          if (colorField && state.dimensions.includes(colorField)) {
            const barColors = data.map(d => {
              const cat = d[colorField];
              return REGION_COLORS[cat] || PALETTE[Math.abs(hashCode(cat)) % PALETTE.length];
            });
            seriesData = numVals.map((v, i) => ({
              value: v,
              itemStyle: { color: barColors[i], borderRadius: [0, 4, 4, 0] }
            }));
          }

          seriesList = [
            {
              name: xField,
              type: 'bar',
              data: seriesData,
              itemStyle: {
                color: '#2563eb',
                borderRadius: [0, 4, 4, 0]
              },
              markPoint: state.showLabels ? {
                data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }]
              } : undefined,
              markLine: state.showAverage ? {
                data: [{ type: 'average', name: '平均線' }]
              } : undefined
            }
          ];
        }

        option.series = seriesList;
        option.dataZoom = [
          { type: 'inside', yAxisIndex: 0 },
          { type: 'slider', yAxisIndex: 0, right: 10, width: 18 }
        ];
      } else {
        const isMulti = state.shelf.yMulti && state.shelf.yMulti.length > 1;
        const activeMeasures = isMulti ? state.shelf.yMulti : [yField];

        const colorCategories = (!isMulti && colorField && state.dimensions.includes(colorField))
          ? [...new Set(data.map(d => String(d[colorField] != null ? d[colorField] : '')).filter(Boolean))]
          : [];
        const hasColorGrouping = !isMulti && colorCategories.length > 1;

        const xCategories = hasColorGrouping
          ? [...new Set(data.map(d => String(d[xField] != null ? d[xField] : '')).filter(Boolean))]
          : xVals;

        if (hasColorGrouping && state.sortDescending) {
          const xTotals = {};
          xCategories.forEach(x => { xTotals[x] = 0; });
          data.forEach(d => {
            const x = String(d[xField] != null ? d[xField] : '');
            if (xTotals[x] !== undefined) {
              xTotals[x] += safeParseNumber(d[yField]);
            }
          });
          xCategories.sort((a, b) => xTotals[b] - xTotals[a]);
        }

        option.xAxis = {
          type: 'category',
          data: xCategories,
          axisLabel: {
            interval: 0,
            rotate: isRotated ? 35 : 0,
            color: '#334155',
            fontSize: 11,
            margin: 10
          },
          axisTick: { alignWithLabel: true }
        };
        option.yAxis = [
          {
            type: 'value',
            name: isMulti ? activeMeasures.join(' / ') : yField,
            axisLabel: {
              formatter: (v) => formatCompactNumber(v)
            }
          }
        ];

        const seriesList = [];
        if (isMulti) {
          activeMeasures.forEach((m, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            seriesList.push({
              name: m,
              type: 'bar',
              barGap: '12%',
              data: data.map(d => Number(d[m] || 0)),
              itemStyle: {
                color: color,
                borderRadius: [4, 4, 0, 0]
              }
            });
          });
        } else if (hasColorGrouping) {
          const isSubPartition = data.length > xCategories.length;
          colorCategories.forEach((cat, catIdx) => {
            const color = REGION_COLORS[cat] || PALETTE[catIdx % PALETTE.length];
            const rowMap = new Map();
            data.filter(d => String(d[colorField]) === cat).forEach(d => {
              rowMap.set(String(d[xField]), safeParseNumber(d[yField]));
            });
            const catVals = xCategories.map(x => rowMap.has(x) ? rowMap.get(x) : '-');

            seriesList.push({
              name: cat,
              type: 'bar',
              barGap: '12%',
              stack: state.barStackMode ? 'total' : (isSubPartition ? undefined : 'single'),
              data: catVals,
              itemStyle: {
                color: color,
                borderRadius: state.barStackMode 
                  ? (catIdx === colorCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0])
                  : [4, 4, 0, 0]
              },
              markPoint: (catIdx === 0 && state.showLabels) ? {
                data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }]
              } : undefined,
              markLine: (catIdx === 0 && state.showAverage) ? {
                data: [{ type: 'average', name: '平均值' }]
              } : undefined
            });
          });
        } else if (colorField && state.dimensions.includes(colorField)) {
          const barColors = data.map(d => {
            const cat = d[colorField];
            return REGION_COLORS[cat] || PALETTE[Math.abs(hashCode(cat)) % PALETTE.length];
          });
          seriesList.push({
            name: yField,
            type: 'bar',
            data: yVals.map((v, i) => ({
              value: v,
              itemStyle: { color: barColors[i], borderRadius: [4, 4, 0, 0] }
            })),
            markPoint: state.showLabels ? {
              data: [{ type: 'max', name: '最大值' }, { type: 'min', name: '最小值' }]
            } : undefined,
            markLine: state.showAverage ? {
              data: [{ type: 'average', name: '平均值' }]
            } : undefined
          });
        } else {
          seriesList.push({
            name: yField,
            type: 'bar',
            data: yVals,
            itemStyle: {
              color: '#2563eb',
              borderRadius: [4, 4, 0, 0]
            },
            markLine: state.showAverage ? {
              data: [{ type: 'average', name: '平均線' }]
            } : undefined
          });
        }

        // 次要指標 (雙軸折線)
        if (!isMulti && secField && state.measures.includes(secField)) {
          option.yAxis.push({
            type: 'value',
            name: secField,
            position: 'right',
            nameLocation: 'middle',
            nameRotate: -90,
            nameGap: 42,
            nameTextStyle: { color: '#ea580c', fontSize: 11, fontWeight: 600 },
            axisLabel: { formatter: (v) => formatCompactNumber(v) }
          });
          seriesList.push({
            name: secField,
            type: 'line',
            yAxisIndex: 1,
            data: data.map(d => Number(d[secField] || 0)),
            itemStyle: { color: '#ea580c' },
            lineStyle: { width: 3 }
          });
        }

        option.series = seriesList;
        option.dataZoom = [
          { type: 'inside' },
          ...(needSlider ? [{
            type: 'slider',
            bottom: 8,
            height: 16,
            borderColor: '#cbd5e1',
            fillerColor: 'rgba(37, 99, 235, 0.15)',
            handleStyle: { color: '#2563eb' }
          }] : [])
        ];
      }

    } else if (state.chartType === 'line') {
      const isMulti = state.shelf.yMulti && state.shelf.yMulti.length > 1;
      const activeMeasures = isMulti ? state.shelf.yMulti : [yField];
      const colorCategories = (!isMulti && colorField && state.dimensions.includes(colorField))
        ? [...new Set(data.map(d => String(d[colorField] != null ? d[colorField] : '')).filter(Boolean))]
        : [];
      const hasColorGrouping = !isMulti && colorCategories.length > 1;

      const xCategories = hasColorGrouping 
        ? [...new Set(data.map(d => String(d[xField] != null ? d[xField] : '')).filter(Boolean))]
        : xVals;

      option.xAxis = {
        type: 'category',
        data: xCategories,
        boundaryGap: false,
        axisLabel: {
          interval: 0,
          rotate: isRotated ? 35 : 0,
          color: '#334155',
          fontSize: 11,
          margin: 10
        }
      };

      const allPercent = activeMeasures.every(m => m.includes('%'));
      option.yAxis = [
        {
          type: 'value',
          name: isMulti ? activeMeasures.join(' / ') : yField,
          axisLabel: {
            formatter: (v) => formatCompactNumber(v) + (allPercent ? '%' : '')
          }
        }
      ];

      let seriesList = [];
      if (isMulti) {
        seriesList = activeMeasures.map((m, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return {
            name: m,
            type: 'line',
            smooth: true,
            symbolSize: 6,
            data: data.map(d => Number(d[m] || 0)),
            itemStyle: { color: color },
            lineStyle: { width: 3 },
            markLine: (idx === 0 && state.showAverage) ? {
              data: [{ type: 'average', name: '平均線' }]
            } : undefined
          };
        });
      } else if (hasColorGrouping) {
        seriesList = colorCategories.map((cat, catIdx) => {
          const color = REGION_COLORS[cat] || PALETTE[catIdx % PALETTE.length];
          const rowMap = new Map();
          data.filter(d => String(d[colorField]) === cat).forEach(d => {
            rowMap.set(String(d[xField]), safeParseNumber(d[yField]));
          });
          const catVals = xCategories.map(x => rowMap.has(x) ? rowMap.get(x) : null);
          return {
            name: cat,
            type: 'line',
            smooth: true,
            symbolSize: 6,
            connectNulls: true,
            data: catVals,
            itemStyle: { color: color },
            lineStyle: { width: 3 },
            markPoint: (catIdx === 0 && state.showLabels) ? {
              data: [{ type: 'max', name: '最高' }]
            } : undefined,
            markLine: (catIdx === 0 && state.showAverage) ? {
              data: [{ type: 'average', name: '平均線' }]
            } : undefined
          };
        });
      } else {
        seriesList = [
          {
            name: yField,
            type: 'line',
            smooth: true,
            symbolSize: 6,
            data: yVals,
            itemStyle: { color: '#2563eb' },
            lineStyle: { width: 3 },
            markLine: state.showAverage ? {
              data: [{ type: 'average', name: '平均線' }]
            } : undefined
          }
        ];
      }

      if (!isMulti && secField && state.measures.includes(secField)) {
        option.yAxis.push({
          type: 'value',
          name: secField,
          position: 'right',
          nameLocation: 'middle',
          nameRotate: -90,
          nameGap: 42,
          nameTextStyle: { color: '#ea580c', fontSize: 11, fontWeight: 600 },
          axisLabel: { formatter: (v) => formatCompactNumber(v) }
        });
        seriesList.push({
          name: secField,
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: data.map(d => Number(d[secField] || 0)),
          itemStyle: { color: '#ea580c' },
          lineStyle: { width: 3 }
        });
      }

      option.series = seriesList;
      option.dataZoom = [
        { type: 'inside' },
        ...(needSlider ? [{
          type: 'slider',
          bottom: 8,
          height: 16,
          borderColor: '#cbd5e1',
          fillerColor: 'rgba(37, 99, 235, 0.15)',
          handleStyle: { color: '#2563eb' }
        }] : [])
      ];

    } else if (state.chartType === 'dual') {
      // 03. 雙軸複合圖 (Dual-Axis Bar + Line) - 體量柱狀與比率折線對比
      const activeSecField = secField && state.measures.includes(secField)
        ? secField 
        : (state.measures.find(m => m !== yField) || yField);

      option.xAxis = {
        type: 'category',
        data: xVals,
        axisLabel: {
          interval: 0,
          rotate: isRotated ? 35 : 0,
          color: '#334155',
          fontSize: 11,
          margin: 10
        },
        axisTick: { alignWithLabel: true }
      };
      option.yAxis = [
        {
          type: 'value',
          name: yField,
          nameLocation: 'middle',
          nameRotate: 90,
          nameGap: 42,
          nameTextStyle: { color: '#64748b', fontSize: 11, fontWeight: 600 },
          axisLabel: { formatter: (v) => formatCompactNumber(v) },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        {
          type: 'value',
          name: activeSecField,
          position: 'right',
          nameLocation: 'middle',
          nameRotate: -90,
          nameGap: 42,
          nameTextStyle: { color: '#ea580c', fontSize: 11, fontWeight: 600 },
          axisLabel: { formatter: (v) => formatCompactNumber(v) },
          splitLine: { show: false }
        }
      ];

      const secVals = data.map(d => Number(d[activeSecField] || 0));

      option.series = [
        {
          name: yField,
          type: 'bar',
          data: yVals,
          itemStyle: {
            color: '#2563eb',
            borderRadius: [4, 4, 0, 0]
          },
          markLine: state.showAverage ? {
            data: [{ type: 'average', name: '主軸平均線' }]
          } : undefined
        },
        {
          name: activeSecField,
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 7,
          data: secVals,
          itemStyle: { color: '#ea580c' },
          lineStyle: { width: 3, shadowColor: 'rgba(234, 88, 12, 0.25)', shadowBlur: 6 },
          markPoint: {
            symbol: 'roundRect',
            symbolSize: [44, 20],
            symbolOffset: [0, -10],
            itemStyle: {
              color: '#ea580c',
              shadowBlur: 3,
              shadowColor: 'rgba(0,0,0,0.12)'
            },
            label: { fontSize: 10, fontWeight: 700, color: '#ffffff' },
            data: [{ type: 'max', name: '次軸最高' }, { type: 'min', name: '次軸最低' }]
          }
        }
      ];

      option.dataZoom = [
        { type: 'inside' },
        ...(needSlider ? [{
          type: 'slider',
          bottom: 8,
          height: 16,
          borderColor: '#cbd5e1',
          fillerColor: 'rgba(37, 99, 235, 0.15)',
          handleStyle: { color: '#2563eb' }
        }] : [])
      ];

    } else if (state.chartType === 'geo') {
      // 04. 通用地理分佈圖 (Universal Geo Map) - 支援日本/台灣/全球/坐標通用
      const geoNames = data.map(d => d[xField]);
      const scope = window.UniversalGeoEngine 
        ? window.UniversalGeoEngine.detectGeoScope(geoNames)
        : 'japan';

      // 檢查是否有經緯度欄位
      const latCol = state.columns.find(c => /lat|緯度/i.test(c));
      const lngCol = state.columns.find(c => /lng|lon|經度/i.test(c));

      // 提取坐標與數值
      const geoPoints = [];
      let minVal = Infinity;
      let maxVal = -Infinity;
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

      data.forEach(d => {
        let coords = null;
        if (latCol && lngCol && !isNaN(Number(d[lngCol])) && !isNaN(Number(d[latCol]))) {
          coords = [Number(d[lngCol]), Number(d[latCol])];
        } else if (window.UniversalGeoEngine) {
          coords = window.UniversalGeoEngine.getCoordinatesForName(d[xField], scope);
        }

        if (coords) {
          const val = Number(d[yField] || 0);
          const sVal = sizeField ? Number(d[sizeField] || 0) : val;
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;

          if (coords[0] < minLng) minLng = coords[0];
          if (coords[0] > maxLng) maxLng = coords[0];
          if (coords[1] < minLat) minLat = coords[1];
          if (coords[1] > maxLat) maxLat = coords[1];

          geoPoints.push({
            name: String(d[xField]),
            value: [coords[0], coords[1], val, sVal],
            raw: d
          });
        }
      });

      if (minVal === Infinity) { minVal = 0; maxVal = 100; }
      if (minVal === maxVal) maxVal = minVal + 1;
      if (minLng === Infinity || maxLng === -Infinity) {
        minLng = 128; maxLng = 145; minLat = 30; maxLat = 45;
      }

      if (geoPoints.length === 0) {
        option.title = {
          text: '未偵測到相應地理空間坐標，請於 X 軸指派都道府縣、城市、或包含經緯度的欄位',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#94a3b8', fontSize: 14 }
        };
      }

      // 坐標邊界 padding
      const padLng = Math.max(1.0, (maxLng - minLng) * 0.12);
      const padLat = Math.max(1.0, (maxLat - minLat) * 0.12);

      option.xAxis = {
        type: 'value',
        name: '經度 (Longitude)',
        nameLocation: 'middle',
        nameGap: 28,
        min: parseFloat((minLng - padLng).toFixed(2)),
        max: parseFloat((maxLng + padLng).toFixed(2)),
        splitLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.06)', type: 'dashed' } },
        axisLabel: { formatter: '{value}°E', color: '#64748b' }
      };

      option.yAxis = {
        type: 'value',
        name: '緯度 (Latitude)',
        min: parseFloat((minLat - padLat).toFixed(2)),
        max: parseFloat((maxLat + padLat).toFixed(2)),
        splitLine: { lineStyle: { color: 'rgba(15, 23, 42, 0.06)', type: 'dashed' } },
        axisLabel: { formatter: '{value}°N', color: '#64748b' }
      };

      // 空間色階視覺映射 (VisualMap)
      option.visualMap = {
        min: minVal,
        max: maxVal,
        dimension: 2,
        calculable: true,
        orient: 'vertical',
        left: 20,
        bottom: 30,
        inRange: {
          color: ['#60a5fa', '#2563eb', '#1d4ed8', '#d97706', '#ea580c', '#e11d48']
        },
        text: ['高 (High)', '低 (Low)'],
        textStyle: { color: '#475569', fontSize: 11 }
      };

      const maxS = safeMax(geoPoints.map(p => p.value[3]), 1) || 1;
      const getRadius = (s) => Math.max(8, Math.min(36, 8 + (s / maxS) * 28));

      option.tooltip = {
        trigger: 'item',
        formatter: (params) => {
          const d = params.data.raw;
          const v = params.data.value;
          let tip = `<div style="font-size:12px; line-height:1.6;">
            <strong style="font-size:13px; color:#0f172a;">${escapeHtml(params.name)}</strong>
            <span style="font-size:10.5px; color:#2563eb; background:#eff6ff; padding:1px 5px; border-radius:3px; margin-left:4px;">${scope.toUpperCase()}</span><br/>
            坐標: ${v[0].toFixed(2)}°E, ${v[1].toFixed(2)}°N<br/>
            ${escapeHtml(yField)}: <b style="color:#ea580c;">${formatCompactNumber(v[2])}</b><br/>`;
          if (sizeField) {
            tip += `${escapeHtml(sizeField)}: <b>${formatCompactNumber(v[3])}</b><br/>`;
          }
          if (colorField && d[colorField]) {
            tip += `${escapeHtml(colorField)}: ${escapeHtml(d[colorField])}<br/>`;
          }
          tip += `</div>`;
          return tip;
        }
      };

      option.series = [
        {
          name: yField,
          type: 'scatter',
          data: geoPoints,
          symbolSize: (val) => getRadius(val[3]),
          label: {
            show: true,
            formatter: '{b}',
            position: 'top',
            color: '#1e293b',
            fontSize: 10.5,
            fontWeight: 600
          },
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0,0,0,0.2)',
            borderWidth: 1.5,
            borderColor: '#ffffff',
            opacity: 0.88
          }
        }
      ];

      option.grid = {
        left: '6%',
        right: '6%',
        bottom: 70,
        top: '12%',
        containLabel: true
      };

      option.dataZoom = [
        { type: 'inside' },
        { type: 'slider', bottom: 6, height: 16, borderColor: '#cbd5e1', fillerColor: 'rgba(37, 99, 235, 0.15)', handleStyle: { color: '#2563eb' } }
      ];

    } else if (state.chartType === 'boxplot') {
      // 05. 盒鬚分佈圖 (Box Plot) - 分組離散度、四分位數與極端值
      let groupDim = xField;
      let measureDim = yField;
      if (state.measures.includes(xField) && !state.measures.includes(yField)) {
        groupDim = yField;
        measureDim = xField;
      }
      if (colorField && state.dimensions.includes(colorField)) {
        groupDim = colorField;
      }

      const groupMap = {};

      data.forEach(d => {
        const grp = String(d[groupDim] || '全體');
        const num = safeParseNumber(d[measureDim]);
        if (d[measureDim] !== null && d[measureDim] !== '' && !isNaN(num)) {
          if (!groupMap[grp]) groupMap[grp] = [];
          groupMap[grp].push(num);
        }
      });

      const groupNames = Object.keys(groupMap);
      const boxData = [];
      const outlierData = [];

      groupNames.forEach((grp, grpIdx) => {
        const arr = groupMap[grp].sort((a, b) => a - b);
        const n = arr.length;
        if (n === 0) {
          boxData.push([0, 0, 0, 0, 0]);
          return;
        }

        const getPercentile = (p) => {
          const idx = (n - 1) * p;
          const lower = Math.floor(idx);
          const frac = idx - lower;
          if (lower + 1 < n) {
            return arr[lower] + frac * (arr[lower + 1] - arr[lower]);
          }
          return arr[lower];
        };

        const min = arr[0];
        const q1 = getPercentile(0.25);
        const median = getPercentile(0.5);
        const q3 = getPercentile(0.75);
        const max = arr[n - 1];
        const iqr = q3 - q1;
        const lowWhisker = Math.max(min, q1 - 1.5 * iqr);
        const highWhisker = Math.min(max, q3 + 1.5 * iqr);

        boxData.push([
          parseFloat(lowWhisker.toFixed(2)),
          parseFloat(q1.toFixed(2)),
          parseFloat(median.toFixed(2)),
          parseFloat(q3.toFixed(2)),
          parseFloat(highWhisker.toFixed(2))
        ]);

        arr.forEach(val => {
          if (val < lowWhisker || val > highWhisker) {
            outlierData.push([grpIdx, val]);
          }
        });
      });

      option.tooltip = {
        trigger: 'item',
        formatter: (params) => {
          if (params.seriesType === 'boxplot') {
            const raw = params.value || (params.data && params.data.value) || params.data;
            const v = Array.isArray(raw) ? (raw.length >= 6 ? raw.slice(raw.length - 5) : raw) : [];
            const grp = groupNames[params.dataIndex];
            const sampleCount = groupMap[grp] ? groupMap[grp].length : 0;
            return `<div style="font-size:12px; line-height:1.6;">
              <strong style="color:#0f172a; font-size:13px;">${escapeHtml(grp)}</strong> (樣本數: ${sampleCount})<br/>
              指標: <b>${escapeHtml(measureDim)}</b><br/>
              上邊界 (High Whisker): <b>${formatCompactNumber(v[4])}</b><br/>
              第 3 四分位數 (Q3 75%): <b>${formatCompactNumber(v[3])}</b><br/>
              中位數 (Median 50%): <b style="color:#2563eb;">${formatCompactNumber(v[2])}</b><br/>
              第 1 四分位數 (Q1 25%): <b>${formatCompactNumber(v[1])}</b><br/>
              下邊界 (Low Whisker): <b>${formatCompactNumber(v[0])}</b>
            </div>`;
          } else {
            const outlierVal = Array.isArray(params.data) ? params.data[1] : (params.value || params.data);
            const grpName = Array.isArray(params.data) && groupNames[params.data[0]] ? `${groupNames[params.data[0]]} · ` : '';
            return `<div style="font-size:12px; line-height:1.6;">
              <strong style="color:#0f172a;">${escapeHtml(grpName)}離群極值</strong><br/>
              指標: <b>${escapeHtml(measureDim)}</b>: <b style="color:#ea580c;">${formatCompactNumber(outlierVal)}</b>
            </div>`;
          }
        }
      };

      const isBoxRotated = groupNames.length > 8;
      const needBoxSlider = groupNames.length > 12;

      option.grid = {
        left: '5%',
        right: '5%',
        bottom: needBoxSlider ? (isBoxRotated ? 82 : 68) : (isBoxRotated ? 54 : 42),
        top: '12%',
        containLabel: true
      };

      option.xAxis = {
        type: 'category',
        data: groupNames,
        axisLabel: {
          interval: 0,
          rotate: isBoxRotated ? 30 : 0,
          color: '#334155',
          fontSize: 11,
          margin: 10
        },
        axisTick: { alignWithLabel: true }
      };
      option.yAxis = {
        type: 'value',
        name: measureDim,
        axisLabel: { formatter: (v) => formatCompactNumber(v) },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      };

      option.series = [
        {
          name: measureDim,
          type: 'boxplot',
          data: boxData,
          itemStyle: {
            color: '#eff6ff',
            borderColor: '#2563eb',
            borderWidth: 2
          }
        }
      ];

      if (outlierData.length > 0) {
        option.series.push({
          name: '離群值 (Outliers)',
          type: 'scatter',
          data: outlierData,
          itemStyle: { color: '#ea580c' },
          symbolSize: 8
        });
      }

      option.dataZoom = [
        { type: 'inside' },
        ...(needBoxSlider ? [{
          type: 'slider',
          bottom: 8,
          height: 16,
          borderColor: '#cbd5e1',
          fillerColor: 'rgba(37, 99, 235, 0.15)',
          handleStyle: { color: '#2563eb' }
        }] : [])
      ];

    } else if (state.chartType === 'treemap') {
      // 06. 矩形樹圖 (Treemap) - 多維層級結構佔比與面積權重
      const parentDim = (colorField && state.dimensions.includes(colorField) && colorField !== xField)
        ? colorField
        : null;

      let treeData = [];

      if (parentDim) {
        const groups = {};
        data.forEach(d => {
          const parentName = String(d[parentDim] || '其他群組');
          const childName = String(d[xField] || '');
          const val = Number(d[sizeField || yField] || 0);

          if (!groups[parentName]) {
            groups[parentName] = {
              name: parentName,
              children: []
            };
          }
          groups[parentName].children.push({
            name: childName,
            value: isNaN(val) ? 0 : val,
            raw: d
          });
        });
        treeData = Object.values(groups);
      } else {
        treeData = data.map((d, idx) => {
          const val = Number(d[sizeField || yField] || 0);
          return {
            name: String(d[xField] || `項 ${idx + 1}`),
            value: isNaN(val) ? 0 : val,
            raw: d
          };
        });
      }

      delete option.xAxis;
      delete option.yAxis;

      option.tooltip = {
        trigger: 'item',
        formatter: (params) => {
          const d = params.data.raw;
          let tip = `<strong style="font-size:13px; color:#0f172a;">${escapeHtml(params.name)}</strong><br/>`;
          tip += `體量 (${sizeField || yField}): <b style="color:#2563eb;">${formatCompactNumber(params.value)}</b><br/>`;
          if (d && secField && d[secField] !== undefined) {
            tip += `${secField}: <b>${formatCompactNumber(d[secField])}</b><br/>`;
          }
          if (d && parentDim && d[parentDim]) {
            tip += `所屬層級: ${escapeHtml(d[parentDim])}`;
          }
          return tip;
        }
      };

      option.series = [
        {
          name: sizeField || yField,
          type: 'treemap',
          roam: false,
          left: '4%',
          right: '4%',
          top: 30,
          bottom: 30,
          breadcrumb: { show: true, top: 4, height: 22 },
          label: {
            show: true,
            formatter: '{b}\n{c}',
            fontSize: 11
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 2,
            gapWidth: 2
          },
          levels: [
            {
              itemStyle: { borderWidth: 3, borderColor: '#ffffff', gapWidth: 3 },
              color: PALETTE
            },
            {
              itemStyle: { borderWidth: 1, borderColor: '#ffffff', gapWidth: 1 }
            }
          ],
          data: treeData
        }
      ];

    } else if (state.chartType === 'scatter') {
      // 散佈/氣泡矩陣 (支援多指標對比模式：指標1 vs 指標2)
      const isMulti = state.shelf.yMulti && state.shelf.yMulti.length >= 2;
      const actXField = isMulti ? state.shelf.yMulti[0] : xField;
      const actYField = isMulti ? state.shelf.yMulti[1] : yField;

      option.tooltip = {
        formatter: (params) => {
          const item = params.data.raw;
          let tip = `<strong>${item[state.dimensions[0] || xField] || ''}</strong><br/>`;
          tip += `${actXField}: ${Number(params.data.value[0]).toLocaleString()}<br/>`;
          tip += `${actYField}: ${Number(params.data.value[1]).toLocaleString()}<br/>`;
          if (sizeField) tip += `${sizeField}: ${Number(item[sizeField] || 0).toLocaleString()}<br/>`;
          if (colorField) tip += `${colorField}: ${item[colorField]}<br/>`;
          return tip;
        }
      };

      option.xAxis = {
        type: 'value',
        name: actXField,
        scale: true,
        axisLabel: { formatter: (v) => formatCompactNumber(v) }
      };
      option.yAxis = {
        type: 'value',
        name: actYField,
        scale: true,
        axisLabel: { formatter: (v) => formatCompactNumber(v) }
      };

      // 計算氣泡大小基準
      let maxVal = 1;
      if (sizeField && state.measures.includes(sizeField)) {
        maxVal = safeMax(data.map(d => Number(d[sizeField] || 0)), 1) || 1;
      }

      const colorCategories = (colorField && state.dimensions.includes(colorField))
        ? [...new Set(data.map(d => String(d[colorField] != null ? d[colorField] : '')).filter(Boolean))]
        : [];
      const hasColorGrouping = colorCategories.length > 1;

      if (hasColorGrouping) {
        option.series = colorCategories.map((cat, catIdx) => {
          const color = REGION_COLORS[cat] || PALETTE[catIdx % PALETTE.length];
          const catRows = data.filter(d => String(d[colorField]) === cat);
          const catScatterData = catRows.map(d => {
            const x = Number(d[actXField] || 0);
            const y = Number(d[actYField] || 0);
            const sVal = sizeField ? Number(d[sizeField] || 0) : 10;
            const radius = sizeField ? Math.max(6, Math.min(36, (sVal / maxVal) * 36)) : 10;
            return {
              value: [x, y],
              symbolSize: radius,
              itemStyle: {
                color: color,
                opacity: 0.85,
                borderColor: '#ffffff',
                borderWidth: 1.5
              },
              raw: d
            };
          });
          return {
            name: cat,
            type: 'scatter',
            data: catScatterData,
            markLine: (catIdx === 0 && state.showAverage) ? {
              lineStyle: { type: 'dashed', color: '#94a3b8' },
              data: [{ type: 'average', name: '平均線' }]
            } : undefined
          };
        });
      } else {
        const scatterData = data.map(d => {
          const x = Number(d[actXField] || 0);
          const y = Number(d[actYField] || 0);
          const sVal = sizeField ? Number(d[sizeField] || 0) : 10;
          const radius = sizeField ? Math.max(6, Math.min(36, (sVal / maxVal) * 36)) : 10;
          const color = colorField && REGION_COLORS[d[colorField]] ? REGION_COLORS[d[colorField]] : '#2563eb';
          return {
            value: [x, y],
            symbolSize: radius,
            itemStyle: {
              color: color,
              opacity: 0.82,
              borderColor: '#fff',
              borderWidth: 1.5
            },
            raw: d
          };
        });

        option.series = [
          {
            name: '分佈點',
            type: 'scatter',
            data: scatterData,
            markLine: state.showAverage ? {
              lineStyle: { type: 'dashed', color: '#94a3b8' },
              data: [{ type: 'average', name: '平均線' }]
            } : undefined
          }
        ];
      }

    } else if (state.chartType === 'donut') {
      // 結構佔比環形圖
      let pieData;
      if (colorField && state.dimensions.includes(colorField)) {
        // 若指定顏色槽維度，依顏色維度彙總該指標總量佔比
        const catSums = {};
        data.forEach(d => {
          const cat = String(d[colorField] || '其他');
          catSums[cat] = (catSums[cat] || 0) + safeParseNumber(d[yField]);
        });
        pieData = Object.entries(catSums).map(([name, val], idx) => ({
          name: name,
          value: Math.round(val * 100) / 100,
          itemStyle: { color: REGION_COLORS[name] || PALETTE[idx % PALETTE.length] }
        }));
      } else {
        pieData = data.slice(0, 15).map((d, idx) => ({
          name: d[xField],
          value: Number(d[yField] || 0),
          itemStyle: { color: PALETTE[idx % PALETTE.length] }
        }));
      }

      option.tooltip = { trigger: 'item', formatter: '{b}: {c} ({d}%)' };
      option.series = [
        {
          name: (colorField && state.dimensions.includes(colorField)) ? colorField : yField,
          type: 'pie',
          radius: ['42%', '72%'],
          center: ['50%', '52%'],
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          data: pieData
        }
      ];

    } else if (state.chartType === 'radar') {
      // 多維雷達圖
      const topItems = data.slice(0, 5);
      const metricFields = state.measures.slice(0, 6);
      const indicator = metricFields.map(m => {
        const max = safeMax(data.map(d => Number(d[m] || 0)), 100) || 100;
        return { name: m, max: max * 1.1 };
      });

      option.radar = {
        indicator: indicator,
        radius: '65%'
      };

      option.series = [
        {
          type: 'radar',
          data: topItems.map((item, idx) => ({
            name: item[xField],
            value: metricFields.map(m => Number(item[m] || 0)),
            itemStyle: { color: PALETTE[idx % PALETTE.length] }
          }))
        }
      ];

    } else if (state.chartType === 'funnel') {
      // 轉化漏斗
      const funnelData = data.slice(0, 8).map(d => ({
        name: d[xField],
        value: Number(d[yField] || 0)
      }));

      option.series = [
        {
          name: yField,
          type: 'funnel',
          left: '15%',
          top: 40,
          bottom: 40,
          width: '70%',
          sort: 'descending',
          gap: 3,
          label: { show: true, position: 'inside', formatter: '{b}: {c}' },
          data: funnelData
        }
      ];

    } else if (state.chartType === 'overview') {
      // 07. 指標矩陣總覽 (Treemap 面積矩陣與多維層次權重)
      const treeData = data.map((item, idx) => {
        const val = Number(item[yField] || 0);
        return {
          name: String(item[xField] || `Item ${idx + 1}`),
          value: isNaN(val) ? 0 : val
        };
      });

      option.tooltip = {
        trigger: 'item',
        formatter: (params) => {
          return `<div style="font-family:sans-serif;font-size:12px;padding:2px 4px;">
            <strong style="font-size:13px;color:#0f172a;">${params.name}</strong><br/>
            ${yField}: <b style="color:#2563eb;">${formatCompactNumber(params.value)}</b>
          </div>`;
        }
      };

      delete option.xAxis;
      delete option.yAxis;

      option.series = [
        {
          name: yField,
          type: 'treemap',
          roam: false,
          nodeClick: false,
          left: '4%',
          right: '4%',
          top: 30,
          bottom: 30,
          breadcrumb: { show: false },
          label: {
            show: true,
            formatter: '{b}\n{c}',
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace'
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 2,
            gapWidth: 2
          },
          levels: [
            {
              itemStyle: {
                borderColor: '#e2e8f0',
                borderWidth: 1,
                gapWidth: 2
              },
              color: PALETTE
            }
          ],
          data: treeData
        }
      ];
    }

    echartsInstance.clear();
    echartsInstance.setOption(option, true);
    echartsInstance.resize();
  }

  // --- 原生 1080p Bauhaus Canvas 渲染 (供 1920x1080 匯出與離線畫布) ---
  function renderNativeCanvas() {
    const canvas = document.getElementById('mainChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 繪製背景裝飾微網格
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 60; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, h - 60);
      ctx.stroke();
    }
    for (let y = 60; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(w - 60, y);
      ctx.stroke();
    }

    // 頂部標題與編碼資訊
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Data Atoms · ${state.datasetName || '視覺化圖表'}`, 80, 100);

    ctx.fillStyle = '#475569';
    ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillText(`ATOM: [${state.chartType.toUpperCase()}]  X=[${state.shelf.x || 'NONE'}]  Y=[${state.shelf.y || 'NONE'}]  COLOR=[${state.shelf.color || 'NONE'}]`, 80, 136);

    const chartW = w - 240;
    const chartH = h - 300;
    const startX = 120;
    const startY = h - 130;

    // 依圖表類型原生分派繪製
    if (state.chartType === 'line') {
      const data = getVisualData().slice(0, 30);
      const xVals = data.map(d => d[state.shelf.x]);
      const yVals = data.map(d => Number(d[state.shelf.y] || 0));
      const maxVal = Math.max(1, safeMax(yVals, 1));
      const minVal = Math.min(0, safeMin(yVals, 0));
      const range = maxVal - minVal || 1;
      const step = chartW / Math.max(1, data.length - 1);

      // 繪製軸線
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + chartW, startY);
      ctx.stroke();

      // 折線路徑
      ctx.beginPath();
      data.forEach((d, i) => {
        const px = startX + i * step;
        const py = startY - ((yVals[i] - minVal) / range) * chartH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 圓點與標籤
      data.forEach((d, i) => {
        const px = startX + i * step;
        const py = startY - ((yVals[i] - minVal) / range) * chartH;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '14px "Noto Sans TC", sans-serif';
        ctx.fillText(String(xVals[i]).substring(0, 6), px - 15, startY + 25);
      });
    } else if (state.chartType === 'dual') {
      // 雙軸複合圖 (柱狀 + 次軸折線)
      const data = getVisualData().slice(0, 20);
      const xVals = data.map(d => d[state.shelf.x]);
      const y1Vals = data.map(d => Number(d[state.shelf.y] || 0));
      const secField = state.shelf.secondary || state.measures.find(m => m !== state.shelf.y);
      const y2Vals = secField ? data.map(d => Number(d[secField] || 0)) : [];

      const max1 = Math.max(1, safeMax(y1Vals, 1));
      const max2 = y2Vals.length ? Math.max(1, safeMax(y2Vals, 1)) : 100;
      const gap = chartW / data.length;
      const barW = gap * 0.55;

      // 繪製柱體
      data.forEach((d, i) => {
        const h1 = (y1Vals[i] / max1) * chartH;
        const bx = startX + i * gap;
        const by = startY - h1;

        ctx.fillStyle = '#2563eb';
        ctx.fillRect(bx, by, barW, h1);

        ctx.fillStyle = '#475569';
        ctx.font = '14px "Noto Sans TC", sans-serif';
        ctx.fillText(String(xVals[i]).substring(0, 6), bx, startY + 25);
      });

      // 繪製次軸折線
      if (y2Vals.length) {
        ctx.beginPath();
        data.forEach((d, i) => {
          const px = startX + i * gap + barW / 2;
          const py = startY - (y2Vals[i] / max2) * chartH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.stroke();

        data.forEach((d, i) => {
          const px = startX + i * gap + barW / 2;
          const py = startY - (y2Vals[i] / max2) * chartH;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }
    } else if (state.chartType === 'geo') {
      // 通用地理投影地圖
      const geoData = (window.UniversalGeoEngine ? window.UniversalGeoEngine.buildGeoSeriesData(
        getVisualData(),
        state.shelf.x,
        state.shelf.y,
        state.shelf.size,
        state.shelf.color
      ) : []).filter(d => d.value && d.value[0] != null);

      if (geoData.length > 0) {
        const lngs = geoData.map(d => d.value[0]);
        const lats = geoData.map(d => d.value[1]);
        const [minLng, maxLng] = safeExtent(lngs);
        const [minLat, maxLat] = safeExtent(lats);
        const padLng = (maxLng - minLng) * 0.1 || 2;
        const padLat = (maxLat - minLat) * 0.1 || 2;

        const projX = (lng) => startX + ((lng - (minLng - padLng)) / ((maxLng - minLng) + 2 * padLng)) * chartW;
        const projY = (lat) => startY - ((lat - (minLat - padLat)) / ((maxLat - minLat) + 2 * padLat)) * chartH;

        // 經緯微網格
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY - chartH, chartW, chartH);

        geoData.forEach(d => {
          const cx = projX(d.value[0]);
          const cy = projY(d.value[1]);
          const radius = Math.max(6, Math.min(32, d.value[2] ? (d.value[2] / 50000) * 15 : 12));

          ctx.fillStyle = 'rgba(37, 99, 235, 0.45)';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
          ctx.fillText(d.name, cx + radius + 4, cy + 4);
        });
      }
    } else if (state.chartType === 'boxplot') {
      // 盒鬚分佈圖 (箱形圖)
      const groupCol = state.shelf.color || state.shelf.x;
      const measureCol = state.shelf.y;
      const groups = {};
      getActiveRows().forEach(r => {
        const k = String(r[groupCol] || '預設');
        if (!groups[k]) groups[k] = [];
        const v = Number(r[measureCol]);
        if (!isNaN(v)) groups[k].push(v);
      });

      const groupKeys = Object.keys(groups).slice(0, 10);
      const allVals = [].concat(...Object.values(groups));
      const minV = Math.min(0, safeMin(allVals, 0));
      const maxV = Math.max(1, safeMax(allVals, 1));
      const range = maxV - minV || 1;
      const gap = chartW / groupKeys.length;
      const boxW = gap * 0.45;

      groupKeys.forEach((k, i) => {
        const vals = groups[k].sort((a, b) => a - b);
        const q1 = vals[Math.floor(vals.length * 0.25)] || 0;
        const med = vals[Math.floor(vals.length * 0.5)] || 0;
        const q3 = vals[Math.floor(vals.length * 0.75)] || 0;
        const min = vals[0] || 0;
        const max = vals[vals.length - 1] || 0;

        const bx = startX + i * gap + (gap - boxW) / 2;
        const toY = (val) => startY - ((val - minV) / range) * chartH;

        // 鬚線
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + boxW / 2, toY(min));
        ctx.lineTo(bx + boxW / 2, toY(max));
        ctx.stroke();

        // 箱體 (Q1 到 Q3)
        const yQ3 = toY(q3);
        const yQ1 = toY(q1);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.15)';
        ctx.fillRect(bx, yQ3, boxW, yQ1 - yQ3);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, yQ3, boxW, yQ1 - yQ3);

        // 中位數線
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, toY(med));
        ctx.lineTo(bx + boxW, toY(med));
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '14px "Noto Sans TC", sans-serif';
        ctx.fillText(k.substring(0, 6), bx, startY + 25);
      });
    } else if (state.chartType === 'treemap') {
      // 矩形樹圖 (階層體量)
      const data = getVisualData().slice(0, 16);
      const totalVal = data.reduce((acc, r) => acc + (Number(r[state.shelf.y]) || 1), 0);
      let currX = startX;
      let currY = startY - chartH;
      let remainW = chartW;
      let remainH = chartH;

      data.forEach((r, idx) => {
        const val = Number(r[state.shelf.y]) || 1;
        const share = val / totalVal;
        const color = PALETTE_BAUHAUS[idx % PALETTE_BAUHAUS.length];

        const wRect = idx % 2 === 0 ? remainW * Math.min(0.9, Math.max(0.2, share * 3)) : remainW;
        const hRect = idx % 2 === 0 ? remainH : remainH * Math.min(0.9, Math.max(0.2, share * 3));

        ctx.fillStyle = color;
        ctx.fillRect(currX, currY, Math.min(remainW, wRect), Math.min(remainH, hRect));
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(currX, currY, Math.min(remainW, wRect), Math.min(remainH, hRect));

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Noto Sans TC", sans-serif';
        ctx.fillText(String(r[state.shelf.x] || '').substring(0, 8), currX + 8, currY + 24);

        if (idx % 2 === 0) {
          currX += wRect;
          remainW -= wRect;
        } else {
          currY += hRect;
          remainH -= hRect;
        }
      });
    } else {
      // 預設柱狀圖 (Bar) - 支援常規垂直與對調後水平長條圖
      const isSwapped = state.measures.includes(state.shelf.x) && !state.measures.includes(state.shelf.y);
      const data = getVisualData().slice(0, 24);

      if (isSwapped) {
        // 水平長條圖 (Horizontal Bar in Canvas)
        const catVals = data.map(d => String(d[state.shelf.y] || ''));
        const numVals = data.map(d => safeParseNumber(d[state.shelf.x]));
        const maxVal = safeMax(numVals, 1) || 1;
        const gap = chartH / data.length;
        const barH = gap * 0.65;
        const barStartX = startX + 130;
        const barMaxW = chartW - 200;

        // Y 軸基線
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(barStartX, startY - chartH - 10);
        ctx.lineTo(barStartX, startY + 10);
        ctx.stroke();

        data.forEach((d, i) => {
          const val = numVals[i];
          const barW = (val / maxVal) * barMaxW;
          const by = (startY - chartH) + i * gap + gap * 0.15;

          ctx.fillStyle = '#2563eb';
          if (state.shelf.color && REGION_COLORS[d[state.shelf.color]]) {
            ctx.fillStyle = REGION_COLORS[d[state.shelf.color]];
          }

          ctx.fillRect(barStartX, by, Math.max(2, barW), barH);

          // 類別標籤 (靠左對齊在 Y 軸前)
          ctx.fillStyle = '#334155';
          ctx.font = '16px "Noto Sans TC", sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(catVals[i].substring(0, 8), barStartX - 14, by + barH * 0.72);
          ctx.textAlign = 'left';

          // 數值標籤 (在長條右側)
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.fillText(formatCompactNumber(val), barStartX + barW + 10, by + barH * 0.72);
        });
      } else {
        // 常規垂直柱狀圖 (Vertical Bar)
        const catVals = data.map(d => String(d[state.shelf.x] || ''));
        const numVals = data.map(d => safeParseNumber(d[state.shelf.y]));
        const maxVal = safeMax(numVals, 1) || 1;

        const barW = (chartW / data.length) * 0.7;
        const gap = chartW / data.length;

        // 基線
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX - 20, startY);
        ctx.lineTo(startX + chartW + 20, startY);
        ctx.stroke();

        data.forEach((d, i) => {
          const val = numVals[i];
          const barH = (val / maxVal) * chartH;
          const bx = startX + i * gap;
          const by = startY - barH;

          ctx.fillStyle = '#2563eb';
          if (state.shelf.color && REGION_COLORS[d[state.shelf.color]]) {
            ctx.fillStyle = REGION_COLORS[d[state.shelf.color]];
          }

          ctx.fillRect(bx, by, barW, barH);

          // 標籤
          ctx.fillStyle = '#334155';
          ctx.font = '16px "Noto Sans TC", sans-serif';
          ctx.save();
          ctx.translate(bx + barW / 2, startY + 25);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(catVals[i].substring(0, 6), 0, 0);
          ctx.restore();

          // 數值
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.fillText(formatCompactNumber(val), bx, by - 8);
        });
      }
    }
  }

  // --- 數據明細表格渲染 (分頁、搜尋、排序) ---
  function renderDataTable() {
    const thead = document.getElementById('previewTableHead');
    const tbody = document.getElementById('previewTableBody');
    const rowCountBadge = document.getElementById('drawerRowCount');
    const pageInfo = document.getElementById('paginationInfo');
    const rowsInfo = document.getElementById('tableRowsInfo');

    if (!thead || !tbody) return;

    let filtered = [...getActiveRows()];

    // 關鍵字搜尋
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(q));
      });
    }

    // 欄位排序
    if (state.sortColumn) {
      filtered.sort((a, b) => {
        const valA = a[state.sortColumn];
        const valB = b[state.sortColumn];
        if (state.measures.includes(state.sortColumn)) {
          return state.sortOrder === 'desc' ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
        }
        return state.sortOrder === 'desc' 
          ? String(valB).localeCompare(String(valA)) 
          : String(valA).localeCompare(String(valB));
      });
    }

    if (rowCountBadge) {
      rowCountBadge.textContent = `${filtered.length} 列資料${filtered.length < state.rawRows.length ? ` (已篩選 / 原 ${state.rawRows.length} 列)` : ''}`;
    }

    // 構建表頭
    thead.innerHTML = `
      <tr>
        <th style="width: 46px;">#</th>
        ${state.columns.map(col => {
          const isSorted = state.sortColumn === col;
          const arrow = isSorted ? (state.sortOrder === 'desc' ? ' ▼' : ' ▲') : '';
          const typeBadge = state.measures.includes(col) ? '#' : 'T';
          const escCol = escapeHtml(col);
          const safeColArg = String(col).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          return `<th onclick="window.PyGWalker.sortTable('${safeColArg}')" style="cursor: pointer;" title="點擊依此欄位排序">
            <span style="opacity: 0.6; font-size: 10px;">${typeBadge}</span> ${escCol}${arrow}
          </th>`;
        }).join('')}
      </tr>
    `;

    // 分頁切片
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.tablePage > totalPages) state.tablePage = totalPages;
    const startIdx = (state.tablePage - 1) * state.pageSize;
    const pageRows = filtered.slice(startIdx, startIdx + state.pageSize);

    tbody.innerHTML = pageRows.map((row, idx) => {
      return `
        <tr>
          <td style="color: #94a3b8; font-family: monospace;">${startIdx + idx + 1}</td>
          ${state.columns.map(col => {
            const val = row[col];
            const isNum = typeof val === 'number' || (state.measures.includes(col) && !isNaN(Number(val)));
            const displayVal = isNum ? Number(val).toLocaleString() : (val !== null && val !== undefined ? String(val) : '-');
            const safeDisplayVal = escapeHtml(displayVal);
            return `<td style="${isNum ? 'text-align: right; font-family: monospace;' : ''}">${safeDisplayVal}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    if (pageInfo) pageInfo.textContent = `第 ${state.tablePage} 頁 / 共 ${totalPages} 頁`;
    if (rowsInfo) rowsInfo.textContent = `顯示第 ${startIdx + 1} 至 ${Math.min(startIdx + state.pageSize, filtered.length)} 筆 (共 ${filtered.length} 筆)`;
  }

  // --- 事件監聽配置 ---
  function setupEventListeners() {
    // 數據集快速切換
    const dsSelect = document.getElementById('datasetQuickSelect');
    if (dsSelect) {
      dsSelect.addEventListener('change', (e) => {
        if (e.target.value === 'open_17_domains') {
          open17DomainModal();
          dsSelect.value = state.currentDatasetId;
          return;
        }
        loadDataset(e.target.value);
      });
    }

    // 圖表類型點選 (7 Data Atoms)
    const chartBtns = document.querySelectorAll('.chart-type-card');
    chartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.chartType = btn.dataset.chart;
        renderChartTypeSelector();
        renderVisualization();
      });
    });

    // 引擎切換 (ECharts / Canvas)
    const btnToggleEngine = document.getElementById('btnToggleEngine');
    if (btnToggleEngine) {
      btnToggleEngine.addEventListener('click', () => {
        state.engine = state.engine === 'echarts' ? 'canvas' : 'echarts';
        btnToggleEngine.innerHTML = state.engine === 'echarts' 
          ? '<span>📊 ECharts 互動引擎</span>' 
          : '<span>📐 原生 1080p Canvas</span>';
        renderVisualization();
        showToast(`已切換為「${state.engine === 'echarts' ? 'ECharts 互動引擎' : '原生 1080p Canvas'}」模式`);
      });
    }

    // 快速對調 X/Y 軸 (Swap)
    const btnSwap = document.getElementById('btnSwapXY');
    if (btnSwap) {
      btnSwap.addEventListener('click', () => {
        const temp = state.shelf.x;
        state.shelf.x = state.shelf.y;
        state.shelf.y = temp;
        state.shelf.yMulti = [];
        renderShelves();
        renderVisualization();
        renderKPIRibbon();
        showToast('⇄ 已成功對調 X 軸與 Y 軸！');
      });
    }

    // 清除編碼槽
    const btnClear = document.getElementById('btnClearShelves');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        state.shelf.x = '';
        state.shelf.y = '';
        state.shelf.yMulti = [];
        state.shelf.color = '';
        state.shelf.size = '';
        state.shelf.secondary = '';
        state.shelf.facet = '';
        renderShelves();
        renderVisualization();
        renderKPIRibbon();
        showToast('已清除所有視覺編碼槽');
      });
    }

    // 表格搜尋
    const searchInput = document.getElementById('tableSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        state.tablePage = 1;
        renderDataTable();
      });
    }

    // 表格分頁按鈕
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.tablePage > 1) {
          state.tablePage--;
          renderDataTable();
        }
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const totalPages = Math.ceil(state.rawRows.length / state.pageSize);
        if (state.tablePage < totalPages) {
          state.tablePage++;
          renderDataTable();
        }
      });
    }

    // 抽屜展開收合
    const btnDrawer = document.getElementById('btnToggleDrawer');
    const drawer = document.getElementById('dataDrawer');
    if (btnDrawer && drawer) {
      btnDrawer.addEventListener('click', () => {
        const isOpen = drawer.classList.toggle('open');
        const icon = document.getElementById('drawerIcon');
        if (icon) icon.textContent = isOpen ? '▼' : '▲';
      });
    }

    // 檔案上傳監聽 (支援 .csv, .xlsx, .xls, .json)
    const fileInput = document.getElementById('fileInput');
    const dropzone = document.getElementById('dropzone');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleUploadedFile(e.target.files[0]);
        }
      });
    }
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-active');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-active');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-active');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleUploadedFile(e.dataTransfer.files[0]);
        }
      });
    }

    // 匯出 1080p 圖表
    const btnExport = document.getElementById('btnExportImage');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (state.engine === 'echarts' && echartsInstance) {
          const url = echartsInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          downloadDataUrl(url, `DataAtoms_${state.currentDatasetId}_${state.chartType}.png`);
        } else {
          const canvas = document.getElementById('mainChartCanvas');
          if (canvas) {
            const url = canvas.toDataURL('image/png');
            downloadDataUrl(url, `DataAtoms_${state.currentDatasetId}_${state.chartType}.png`);
          }
        }
        showToast('📷 已匯出高解析度圖表 PNG！');
      });
    }

    // 匯出 CSV
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        exportCurrentTableToCSV();
      });
    }

    // Tableau 語意微調精靈觸發按鈕
    const btnTopSchema = document.getElementById('btnOpenSchemaModalTop');
    const btnDockSchema = document.getElementById('btnOpenSchemaModalDock');
    if (btnTopSchema) {
      btnTopSchema.addEventListener('click', () => openSchemaClassifierModal(false));
    }
    if (btnDockSchema) {
      btnDockSchema.addEventListener('click', () => openSchemaClassifierModal(false));
    }

    const btnCloseSchema = document.getElementById('btnCloseSchemaModal');
    const btnCancelSchema = document.getElementById('btnCancelSchemaModal');
    if (btnCloseSchema) btnCloseSchema.addEventListener('click', closeSchemaClassifierModal);
    if (btnCancelSchema) btnCancelSchema.addEventListener('click', closeSchemaClassifierModal);

    const modalOverlay = document.getElementById('schemaClassifierModal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeSchemaClassifierModal();
      });
    }

    const btnApplyNext = document.getElementById('btnApplyAndNext');
    if (btnApplyNext) {
      btnApplyNext.addEventListener('click', applySchemaConfigAndNext);
    }

    const btnResetAuto = document.getElementById('btnResetAutoInfer');
    if (btnResetAuto) {
      btnResetAuto.addEventListener('click', resetAutoInferredSchema);
    }

    // 搜尋與篩選
    const schemaSearch = document.getElementById('schemaSearchInput');
    if (schemaSearch) {
      schemaSearch.addEventListener('input', (e) => {
        state.schemaSearchQuery = e.target.value;
        renderSchemaClassifierModal();
      });
    }

    const filterBtns = document.querySelectorAll('.schema-filter-btn');
    filterBtns.forEach(b => {
      b.addEventListener('click', () => {
        filterBtns.forEach(btn => btn.classList.remove('active'));
        b.classList.add('active');
        state.schemaFilter = b.dataset.filter;
        renderSchemaClassifierModal();
      });
    });
  }

  // --- Tableau 語意綱要分類精靈 (Schema Classifier Modal) ---
  function openSchemaClassifierModal(isInitialUpload = false) {
    const modal = document.getElementById('schemaClassifierModal');
    if (!modal) return;

    const stepAuto = document.getElementById('stepPillAuto');
    const stepReview = document.getElementById('stepPillReview');
    const stepNext = document.getElementById('stepPillNext');

    if (isInitialUpload) {
      if (stepAuto) {
        stepAuto.className = 'step-pill step-done';
        stepAuto.innerHTML = '<span class="step-num">✓</span><span class="step-text">1. 程式智慧判定 (已完成 ⚡)</span>';
      }
      if (stepReview) {
        stepReview.className = 'step-pill step-active';
        stepReview.innerHTML = '<span class="step-num">2</span><span class="step-text">2. 人工檢查與微調 (您可自由微調)</span>';
      }
      if (stepNext) {
        stepNext.className = 'step-pill step-pending';
        stepNext.innerHTML = '<span class="step-num">3</span><span class="step-text">3. 下一步：套用並進入圖表探索</span>';
      }
    } else {
      if (stepAuto) {
        stepAuto.className = 'step-pill step-done';
        stepAuto.innerHTML = '<span class="step-num">✓</span><span class="step-text">1. 目前綱要狀態</span>';
      }
      if (stepReview) {
        stepReview.className = 'step-pill step-active';
        stepReview.innerHTML = '<span class="step-num">2</span><span class="step-text">2. 人工檢查與微調 (型態/角色/連續性)</span>';
      }
      if (stepNext) {
        stepNext.className = 'step-pill step-pending';
        stepNext.innerHTML = '<span class="step-num">3</span><span class="step-text">3. 下一步：套用並進入圖表探索</span>';
      }
    }

    renderSchemaClassifierModal();
    modal.classList.add('open');
  }

  function closeSchemaClassifierModal() {
    const modal = document.getElementById('schemaClassifierModal');
    if (modal) modal.classList.remove('open');
  }

  function renderSchemaClassifierModal() {
    const tbody = document.getElementById('schemaTableBody');
    const dsTag = document.getElementById('schemaDatasetTag');
    const totalRowsChip = document.getElementById('schemaTotalRowsChip');
    const dimCountChip = document.getElementById('schemaDimCountChip');
    const meaCountChip = document.getElementById('schemaMeaCountChip');
    const countAll = document.getElementById('countAll');
    const countDim = document.getElementById('countDim');
    const countMea = document.getElementById('countMea');

    if (!tbody) return;

    if (dsTag) dsTag.textContent = `📁 資料集: ${state.datasetName}`;
    if (totalRowsChip) totalRowsChip.textContent = `總列數: ${state.rawRows.length} 列`;
    if (dimCountChip) dimCountChip.textContent = `🔵 維度: ${state.dimensions.length} 個`;
    if (meaCountChip) meaCountChip.textContent = `🟢 度量: ${state.measures.length} 個`;
    if (countAll) countAll.textContent = state.columns.length;
    if (countDim) countDim.textContent = state.dimensions.length;
    if (countMea) countMea.textContent = state.measures.length;

    const filter = state.schemaFilter || 'all';
    const query = (state.schemaSearchQuery || '').toLowerCase();

    const visibleCols = state.columns.filter(col => {
      const cfg = state.schemaConfig[col] || {};
      if (filter === 'dimension' && cfg.role !== 'dimension') return false;
      if (filter === 'measure' && cfg.role !== 'measure') return false;
      if (query && !col.toLowerCase().includes(query) && !(cfg.alias || '').toLowerCase().includes(query)) return false;
      return true;
    });

    tbody.innerHTML = visibleCols.map(col => {
      const cfg = state.schemaConfig[col] || {};
      const isDim = cfg.role === 'dimension';
      const isDiscrete = cfg.nature === 'discrete';

      return `
        <tr data-col="${escapeHtml(col)}">
          <td>
            <select class="schema-type-select" data-col="${escapeHtml(col)}">
              <option value="string" ${cfg.type === 'string' ? 'selected' : ''}>🔤 字串 (String)</option>
              <option value="integer" ${cfg.type === 'integer' ? 'selected' : ''}># 整數 (Integer)</option>
              <option value="decimal" ${cfg.type === 'decimal' ? 'selected' : ''}>#.0 小數 (Decimal)</option>
              <option value="date" ${cfg.type === 'date' ? 'selected' : ''}>📅 日期 (Date)</option>
              <option value="geo" ${cfg.type === 'geo' ? 'selected' : ''}>🌐 地理 (Geographic)</option>
              <option value="boolean" ${cfg.type === 'boolean' ? 'selected' : ''}>☑️ 布林 (Boolean)</option>
            </select>
          </td>
          <td>
            <div class="schema-field-name-box">
              <span class="schema-field-orig" title="${escapeHtml(col)}">${escapeHtml(col)}</span>
              <input type="text" class="schema-alias-input" data-col="${escapeHtml(col)}" placeholder="自訂別名 (選填)" value="${escapeHtml(cfg.alias || col)}">
            </div>
          </td>
          <td>
            <div class="role-segmented-toggle">
              <button type="button" class="role-toggle-btn btn-dim ${isDim ? 'active' : ''}" data-col="${escapeHtml(col)}" data-role="dimension">🔵 維度</button>
              <button type="button" class="role-toggle-btn btn-mea ${!isDim ? 'active' : ''}" data-col="${escapeHtml(col)}" data-role="measure">🟢 度量</button>
            </div>
          </td>
          <td>
            <div class="nature-segmented-toggle">
              <button type="button" class="nature-toggle-btn btn-discrete ${isDiscrete ? 'active' : ''}" data-col="${escapeHtml(col)}" data-nature="discrete">離散</button>
              <button type="button" class="nature-toggle-btn btn-continuous ${!isDiscrete ? 'active' : ''}" data-col="${escapeHtml(col)}" data-nature="continuous">連續</button>
            </div>
          </td>
          <td>
            <select class="schema-agg-select" data-col="${escapeHtml(col)}">
              <option value="sum" ${cfg.agg === 'sum' ? 'selected' : ''}>SUM (求和)</option>
              <option value="avg" ${cfg.agg === 'avg' ? 'selected' : ''}>AVG (平均)</option>
              <option value="count" ${cfg.agg === 'count' ? 'selected' : ''}>COUNT (計數)</option>
              <option value="countd" ${cfg.agg === 'countd' ? 'selected' : ''}>COUNTD (相異)</option>
              <option value="max" ${cfg.agg === 'max' ? 'selected' : ''}>MAX (最大)</option>
              <option value="min" ${cfg.agg === 'min' ? 'selected' : ''}>MIN (最小)</option>
            </select>
          </td>
          <td>
            <div class="schema-profile-box">
              <span class="schema-cardinality-text">${cfg.distinctCount || 0} 個唯一下標 · ${cfg.nullCount === 0 ? '無缺失' : cfg.nullCount + ' 筆空值'}</span>
              <div class="schema-samples-pills">
                ${(cfg.sampleValues || []).map(s => `<span class="schema-sample-pill" title="${escapeHtml(s)}">${escapeHtml(s)}</span>`).join('')}
              </div>
            </div>
          </td>
          <td>
            <span class="schema-reason-pill">💡 ${escapeHtml(cfg.reason || '系統判定')}</span>
          </td>
        </tr>
      `;
    }).join('');

    bindSchemaTableEvents();
  }

  // --- 表格微調事件綁定 ---
  function bindSchemaTableEvents() {
    // 角色切換 (維度 vs 度量)
    const roleBtns = document.querySelectorAll('.role-toggle-btn');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.dataset.col;
        const newRole = btn.dataset.role;
        if (!state.schemaConfig[col]) return;

        state.schemaConfig[col].role = newRole;
        // Tableau 預設連動：維度預設離散，度量預設連續
        state.schemaConfig[col].nature = newRole === 'dimension' ? 'discrete' : 'continuous';
        syncSchemaToDimensionsAndMeasures();
        renderSchemaClassifierModal();
      });
    });

    // 連續性切換 (離散 vs 連續)
    const natureBtns = document.querySelectorAll('.nature-toggle-btn');
    natureBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.dataset.col;
        const newNature = btn.dataset.nature;
        if (!state.schemaConfig[col]) return;

        state.schemaConfig[col].nature = newNature;
        renderSchemaClassifierModal();
      });
    });

    // 資料型態切換
    const typeSelects = document.querySelectorAll('.schema-type-select');
    typeSelects.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const col = sel.dataset.col;
        const newType = e.target.value;
        if (!state.schemaConfig[col]) return;

        state.schemaConfig[col].type = newType;
        // 連動型態至角色推薦
        if (newType === 'geo' || newType === 'date' || newType === 'string' || newType === 'boolean') {
          state.schemaConfig[col].role = 'dimension';
          state.schemaConfig[col].nature = 'discrete';
        } else if (newType === 'decimal') {
          state.schemaConfig[col].role = 'measure';
          state.schemaConfig[col].nature = 'continuous';
        }
        syncSchemaToDimensionsAndMeasures();
        renderSchemaClassifierModal();
      });
    });

    // 預設聚合方式切換
    const aggSelects = document.querySelectorAll('.schema-agg-select');
    aggSelects.forEach(sel => {
      sel.addEventListener('change', (e) => {
        const col = sel.dataset.col;
        if (state.schemaConfig[col]) {
          state.schemaConfig[col].agg = e.target.value;
        }
      });
    });

    // 別名輸入
    const aliasInputs = document.querySelectorAll('.schema-alias-input');
    aliasInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const col = input.dataset.col;
        if (state.schemaConfig[col]) {
          state.schemaConfig[col].alias = e.target.value.trim() || col;
        }
      });
    });
  }

  // --- 套用微調設定並進入圖表探索 ---
  function applySchemaConfigAndNext() {
    // 儲存當前尚未失焦的 alias 輸入
    const aliasInputs = document.querySelectorAll('.schema-alias-input');
    aliasInputs.forEach(input => {
      const col = input.dataset.col;
      if (state.schemaConfig[col]) {
        state.schemaConfig[col].alias = input.value.trim() || col;
      }
    });

    syncSchemaToDimensionsAndMeasures();

    // 檢查目前軸線上的欄位是否仍有效
    if (!state.columns.includes(state.shelf.x)) {
      state.shelf.x = state.dimensions[0] || state.columns[0];
    }
    if (!state.columns.includes(state.shelf.y)) {
      state.shelf.y = state.measures[0] || state.columns[1];
    }

    // 重新渲染左側與頂部各元件
    renderFieldLists();
    renderShelves();
    renderVisualization();
    renderKPIRibbon();
    renderDataTable();

    closeSchemaClassifierModal();
    showToast(`🎉 成功套用 Tableau 欄位分類！目前：${state.dimensions.length} 個維度，${state.measures.length} 個度量，已進入圖表製作！`);
  }

  // --- 重設回程式初始自動判定 ---
  function resetAutoInferredSchema() {
    if (!state.autoInferredSchema) return;
    state.schemaConfig = JSON.parse(JSON.stringify(state.autoInferredSchema));
    syncSchemaToDimensionsAndMeasures();
    renderSchemaClassifierModal();
    showToast('↺ 已重設回系統自動推薦之判定設定');
  }

  // --- 處理自訂上傳檔案 (CSV / Excel / JSON) ---
  function handleUploadedFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    showToast(`正在解析上傳檔案：${file.name}...`);

    if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const rows = Array.isArray(json) ? json : (json.data || json.rows || []);
          if (rows.length === 0) throw new Error('JSON 未包含陣列資料');
          mountCustomDataset(file.name, rows);
        } catch (err) {
          alert('JSON 解析失敗：' + err.message);
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      if (typeof XLSX === 'undefined') {
        alert('SheetJS (XLSX) 尚未就緒，請稍候重試');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          if (rows.length === 0) throw new Error('工作表內容為空');
          mountCustomDataset(file.name, rows);
        } catch (err) {
          alert('Excel 解析失敗：' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = parseCSVText(text);
          if (rows.length === 0) throw new Error('CSV 內容為空');
          mountCustomDataset(file.name, rows);
        } catch (err) {
          alert('CSV 解析失敗：' + err.message);
        }
      };
      reader.readAsText(file);
    } else {
      alert('僅支援上傳 .xlsx, .xls, .csv, .json 格式檔案！');
    }
  }

  // --- 掛載自訂上傳之資料集 ---
  function mountCustomDataset(fileName, rows) {
    const customObj = {
      id: 'custom_' + Date.now(),
      name: `📁 ${fileName}`,
      data: rows
    };

    if (!state.customDatasets) state.customDatasets = {};
    state.customDatasets[customObj.id] = customObj;

    // 加入選單
    const dsSelect = document.getElementById('datasetQuickSelect');
    if (dsSelect) {
      let existingOpt = dsSelect.querySelector(`option[value="${customObj.id}"]`);
      if (!existingOpt) {
        const opt = document.createElement('option');
        opt.value = customObj.id;
        opt.textContent = customObj.name;
        dsSelect.insertBefore(opt, dsSelect.firstChild);
      }
      dsSelect.value = customObj.id;
    }

    loadDataset(customObj.id, customObj);
    showToast(`🎉 成功載入自訂檔案 ${fileName}！共 ${rows.length} 筆資料。`);

    // 自動開啟 Tableau 判定精靈 (Step 1 系統自動判定，Step 2 人工微調)
    setTimeout(() => {
      openSchemaClassifierModal(true);
    }, 200);
  }

  // --- 強健 CSV 文字解析器 (優先使用 SheetJS，相容 RFC 4180 標準) ---
  function parseCSVText(text) {
    if (!text || typeof text !== 'string') return [];
    if (typeof XLSX !== 'undefined') {
      try {
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          if (rows && rows.length > 0) {
            return rows;
          }
        }
      } catch (err) {
        console.warn('XLSX.read CSV error, falling back to RFC parser:', err);
      }
    }

    // RFC 4180 備援解析器 (支援含引號、引號內逗號與換行)
    const lines = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        if (row.length > 1 || row[0] !== '') lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);

    if (lines.length < 2) return [];
    const headers = lines[0].map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let r = 1; r < lines.length; r++) {
      const vals = lines[r];
      if (vals.length === 0 || (vals.length === 1 && vals[0] === '')) continue;
      const obj = {};
      headers.forEach((h, idx) => {
        const val = vals[idx] !== undefined ? vals[idx].trim().replace(/^"|"$/g, '') : '';
        const cleaned = typeof val === 'string' ? val.replace(/,/g, '').trim() : val;
        const num = Number(cleaned);
        obj[h] = (!isNaN(num) && cleaned !== '') ? num : val;
      });
      rows.push(obj);
    }
    return rows;
  }

  // --- 匯出 CSV (以 getActiveRows() 結合搜尋之當前有效列為準) ---
  function exportCurrentTableToCSV() {
    let rowsToExport = [...getActiveRows()];
    if (state.searchQuery && state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      rowsToExport = rowsToExport.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(q));
      });
    }
    if (!rowsToExport || rowsToExport.length === 0) {
      showToast('⚠️ 目前無符合條件之資料可供匯出');
      return;
    }
    const headers = state.columns;
    const csvLines = [headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',')];

    rowsToExport.forEach(row => {
      const line = headers.map(h => {
        let val = row[h];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(',');
      csvLines.push(line);
    });

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `${state.currentDatasetId}_export.csv`);
    showToast(`已匯出 CSV 檔案！共 ${rowsToExport.length} 筆已篩選與搜尋資料。`);
  }

  function downloadDataUrl(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof url === 'string' && url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function hashCode(str) {
    let hash = 0;
    if (!str || str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  // --- 吐司提示 ---
  function showToast(msg) {
    const toast = document.getElementById('toastNotice');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  // =========================================================================
  // 17 大領域指標選取與年份區間提取控制器 (17 Domains & Multi-Year Panel Extractor)
  // =========================================================================

  const domainState = {
    activeDomainId: 'domain_A',
    selectedVarCodes: new Set(['A1101', 'A1301', 'H4101', 'H1103', 'C1201']),
    startYear: 2024,
    endYear: 2024,
    step: 1,
    searchQuery: ''
  };

  function init17DomainModal() {
    // 填充年份下拉選單 (1975 至 2024)
    const startSelect = document.getElementById('startYearSelect');
    const endSelect = document.getElementById('endYearSelect');
    const stepSelect = document.getElementById('yearStepSelect');

    if (startSelect && endSelect) {
      startSelect.innerHTML = '';
      endSelect.innerHTML = '';
      for (let y = 1975; y <= 2024; y++) {
        const opt1 = document.createElement('option');
        opt1.value = y;
        opt1.textContent = `${y} 年`;
        if (y === domainState.startYear) opt1.selected = true;
        startSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = y;
        opt2.textContent = `${y} 年`;
        if (y === domainState.endYear) opt2.selected = true;
        endSelect.appendChild(opt2);
      }

      startSelect.addEventListener('change', (e) => {
        domainState.startYear = parseInt(e.target.value, 10);
        if (domainState.startYear > domainState.endYear) {
          domainState.endYear = domainState.startYear;
          endSelect.value = domainState.endYear;
        }
        clearPresetChipsActive();
        update17DomainSummary();
      });

      endSelect.addEventListener('change', (e) => {
        domainState.endYear = parseInt(e.target.value, 10);
        if (domainState.endYear < domainState.startYear) {
          domainState.startYear = domainState.endYear;
          startSelect.value = domainState.startYear;
        }
        clearPresetChipsActive();
        update17DomainSummary();
      });
    }

    if (stepSelect) {
      stepSelect.addEventListener('change', (e) => {
        domainState.step = parseInt(e.target.value, 10) || 1;
        clearPresetChipsActive();
        update17DomainSummary();
      });
    }

    // 預設年份區間快速晶片按鈕 (Preset Chips)
    const presetBtns = document.querySelectorAll('#yearPresetGroup .year-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const range = btn.dataset.range;
        if (range === '2024') {
          domainState.startYear = 2024;
          domainState.endYear = 2024;
          domainState.step = 1;
        } else if (range === '2020-2024') {
          domainState.startYear = 2020;
          domainState.endYear = 2024;
          domainState.step = 1;
        } else if (range === '2015-2024') {
          domainState.startYear = 2015;
          domainState.endYear = 2024;
          domainState.step = 1;
        } else if (range === '2005-2024') {
          domainState.startYear = 2005;
          domainState.endYear = 2024;
          domainState.step = 1;
        } else if (range === '1975-2024-step5') {
          domainState.startYear = 1975;
          domainState.endYear = 2024;
          domainState.step = 5;
        }

        if (startSelect) startSelect.value = domainState.startYear;
        if (endSelect) endSelect.value = domainState.endYear;
        if (stepSelect) stepSelect.value = domainState.step;

        update17DomainSummary();
      });
    });

    // 彈窗開啟與關閉按鈕
    const btnTop = document.getElementById('btnOpen17DomainsModalTop');
    const btnDock = document.getElementById('btnOpen17DomainsModalDock');
    const btnClose = document.getElementById('btnClose17DomainModal');
    const modal = document.getElementById('estat17DomainModal');

    if (btnTop) btnTop.addEventListener('click', open17DomainModal);
    if (btnDock) btnDock.addEventListener('click', open17DomainModal);
    if (btnClose) btnClose.addEventListener('click', close17DomainModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close17DomainModal();
      });
    }

    // 搜尋與篩選變數
    const searchInput = document.getElementById('domainVarSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        domainState.searchQuery = e.target.value.trim().toLowerCase();
        render17DomainVars();
      });
    }

    // 全選、清除、重設核心按鈕
    const btnSelectAll = document.getElementById('btnSelectAllDomainVars');
    const btnClear = document.getElementById('btnClearDomainVars');
    const btnResetCore = document.getElementById('btnResetCoreDomainVars');

    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', () => {
        const domain = (window.ESTAT_17_DOMAINS || []).find(d => d.id === domainState.activeDomainId);
        if (domain) {
          domain.variables.forEach(v => domainState.selectedVarCodes.add(v.code));
          render17DomainNavList();
          render17DomainVars();
          update17DomainSummary();
        }
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        const domain = (window.ESTAT_17_DOMAINS || []).find(d => d.id === domainState.activeDomainId);
        if (domain) {
          domain.variables.forEach(v => domainState.selectedVarCodes.delete(v.code));
          render17DomainNavList();
          render17DomainVars();
          update17DomainSummary();
        }
      });
    }

    if (btnResetCore) {
      btnResetCore.addEventListener('click', () => {
        domainState.selectedVarCodes = new Set(['A1101', 'A1301', 'H4101', 'H1103', 'C1201']);
        render17DomainNavList();
        render17DomainVars();
        update17DomainSummary();
        showToast('已重設為官方推薦 5 項核心指標（總人口、高齡化率、住宅地價、空屋率、縣民所得）');
      });
    }

    // 匯出 CSV、JSON 與載入至工作台
    const btnApply = document.getElementById('btnApplyDomainDataset');
    const btnCSV = document.getElementById('btnExportDomainCSV');
    const btnJSON = document.getElementById('btnExportDomainJSON');

    if (btnApply) {
      btnApply.addEventListener('click', () => {
        if (domainState.selectedVarCodes.size === 0) {
          alert('請至少勾選一項指標變數！');
          return;
        }

        const rows = window.generatePanelDataset(
          Array.from(domainState.selectedVarCodes),
          domainState.startYear,
          domainState.endYear,
          domainState.step
        );

        const yearLabel = domainState.startYear === domainState.endYear 
          ? `${domainState.startYear}年` 
          : `${domainState.startYear}–${domainState.endYear}年 (${domainState.step > 1 ? `步長${domainState.step}年` : '逐年'})`;

        const datasetTitle = `🇯🇵 e-Stat 17領域面版數據 (${yearLabel})`;
        close17DomainModal();

        mountCustomDataset(datasetTitle, rows);
      });
    }

    if (btnCSV) {
      btnCSV.addEventListener('click', () => {
        if (domainState.selectedVarCodes.size === 0) {
          alert('請至少勾選一項指標變數！');
          return;
        }

        const rows = window.generatePanelDataset(
          Array.from(domainState.selectedVarCodes),
          domainState.startYear,
          domainState.endYear,
          domainState.step
        );

        if (rows.length === 0) return;
        const headers = Object.keys(rows[0]);
        const csvLines = [headers.join(',')];

        rows.forEach(r => {
          const line = headers.map(h => {
            let v = r[h];
            if (v === null || v === undefined) v = '';
            v = String(v).replace(/"/g, '""');
            return `"${v}"`;
          }).join(',');
          csvLines.push(line);
        });

        const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const fileName = `eStat_17Domains_${domainState.startYear}_${domainState.endYear}_${domainState.selectedVarCodes.size}vars.csv`;
        downloadDataUrl(url, fileName);
        showToast(`已成功下載 CSV 面板檔案 (${rows.length} 筆資料)！`);
      });
    }

    if (btnJSON) {
      btnJSON.addEventListener('click', () => {
        if (domainState.selectedVarCodes.size === 0) {
          alert('請至少勾選一項指標變數！');
          return;
        }

        const rows = window.generatePanelDataset(
          Array.from(domainState.selectedVarCodes),
          domainState.startYear,
          domainState.endYear,
          domainState.step
        );

        const jsonStr = JSON.stringify(rows, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const fileName = `eStat_17Domains_${domainState.startYear}_${domainState.endYear}.json`;
        downloadDataUrl(url, fileName);
        showToast(`已成功下載 JSON 面板檔案 (${rows.length} 筆資料)！`);
      });
    }

    // 初始渲染導覽與摘要
    render17DomainNavList();
    render17DomainVars();
    update17DomainSummary();
  }

  function clearPresetChipsActive() {
    const presetBtns = document.querySelectorAll('#yearPresetGroup .year-preset-btn');
    presetBtns.forEach(b => b.classList.remove('active'));
  }

  function open17DomainModal() {
    const modal = document.getElementById('estat17DomainModal');
    if (modal) {
      modal.classList.add('open');
      render17DomainNavList();
      render17DomainVars();
      update17DomainSummary();
    }
  }

  function close17DomainModal() {
    const modal = document.getElementById('estat17DomainModal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  function render17DomainNavList() {
    const navList = document.getElementById('domainNavList');
    if (!navList || !window.ESTAT_17_DOMAINS) return;

    navList.innerHTML = '';
    window.ESTAT_17_DOMAINS.forEach(domain => {
      const selectedCount = domain.variables.filter(v => domainState.selectedVarCodes.has(v.code)).length;
      const totalCount = domain.variables.length;

      const item = document.createElement('div');
      item.className = `domain-nav-item ${domain.id === domainState.activeDomainId ? 'active' : ''}`;
      item.innerHTML = `
        <div class="domain-nav-info">
          <span class="domain-code-tag">${escapeHtml(domain.code)}</span>
          <span class="domain-nav-name" title="${escapeHtml(domain.name)}">${escapeHtml(domain.name)}</span>
        </div>
        <span class="domain-badge-count ${selectedCount > 0 ? 'has-selected' : ''}">
          ${selectedCount}/${totalCount}
        </span>
      `;

      item.addEventListener('click', () => {
        domainState.activeDomainId = domain.id;
        render17DomainNavList();
        render17DomainVars();
      });

      navList.appendChild(item);
    });
  }

  function render17DomainVars() {
    const grid = document.getElementById('domainVarGrid');
    if (!grid || !window.ESTAT_17_DOMAINS) return;

    const domain = window.ESTAT_17_DOMAINS.find(d => d.id === domainState.activeDomainId);
    if (!domain) return;

    // 更新右側頂部說明
    const titleEl = document.getElementById('currentDomainTitle');
    const descEl = document.getElementById('currentDomainDesc');
    if (titleEl) {
      titleEl.innerHTML = `
        <span class="domain-code-tag">${escapeHtml(domain.code)}</span>
        <span>${escapeHtml(domain.name)} (${escapeHtml(domain.subName)})</span>
      `;
    }
    if (descEl) {
      descEl.textContent = domain.description;
    }

    grid.innerHTML = '';

    // 篩選變數（若有搜尋詞則跨領域或領域內篩選）
    let varsToRender = domain.variables;
    if (domainState.searchQuery) {
      // 搜尋時跨全部 17 領域搜尋
      varsToRender = [];
      window.ESTAT_17_DOMAINS.forEach(d => {
        d.variables.forEach(v => {
          const match = v.code.toLowerCase().includes(domainState.searchQuery) ||
                        v.name.toLowerCase().includes(domainState.searchQuery) ||
                        v.desc.toLowerCase().includes(domainState.searchQuery) ||
                        d.name.toLowerCase().includes(domainState.searchQuery);
          if (match) {
            varsToRender.push({ ...v, domainName: d.name, domainCode: d.code });
          }
        });
      });
    }

    if (varsToRender.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #64748b; font-size: 13px;">
          查無符合「${escapeHtml(domainState.searchQuery)}」的統計指標變數。
        </div>
      `;
      return;
    }

    varsToRender.forEach(v => {
      const isChecked = domainState.selectedVarCodes.has(v.code);
      const card = document.createElement('div');
      card.className = `var-card ${isChecked ? 'selected' : ''}`;
      card.innerHTML = `
        <input type="checkbox" class="var-card-checkbox" ${isChecked ? 'checked' : ''} data-code="${escapeHtml(v.code)}">
        <div class="var-card-content">
          <div class="var-card-header">
            <span class="var-code-pill">${escapeHtml(v.code)}</span>
            <span class="var-unit-pill">${escapeHtml(v.unit)} · ${escapeHtml(v.agg)}</span>
          </div>
          <div class="var-name-row">
            ${escapeHtml(v.name)}
            ${v.domainCode ? `<span style="font-size: 10.5px; color: #2563eb; margin-left: 4px;">[${escapeHtml(v.domainCode)} ${escapeHtml(v.domainName)}]</span>` : ''}
          </div>
          <div class="var-desc-text">${escapeHtml(v.desc)}</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() !== 'input') {
          const chk = card.querySelector('.var-card-checkbox');
          if (chk) chk.checked = !chk.checked;
        }
        const isNowChecked = card.querySelector('.var-card-checkbox').checked;
        if (isNowChecked) {
          domainState.selectedVarCodes.add(v.code);
          card.classList.add('selected');
        } else {
          domainState.selectedVarCodes.delete(v.code);
          card.classList.remove('selected');
        }
        render17DomainNavList();
        update17DomainSummary();
      });

      grid.appendChild(card);
    });
  }

  function update17DomainSummary() {
    const summaryVarCount = document.getElementById('summaryVarCount');
    const summaryYearCount = document.getElementById('summaryYearCount');
    const summaryYearSpan = document.getElementById('summaryYearSpan');
    const summaryRowCount = document.getElementById('summaryRowCount');

    // 計算年份數
    let yearCount = 0;
    for (let y = domainState.startYear; y <= domainState.endYear; y += domainState.step) {
      yearCount++;
    }
    if (domainState.step > 1 && (domainState.endYear - domainState.startYear) % domainState.step !== 0) {
      yearCount++;
    }
    if (yearCount === 0) yearCount = 1;

    const varCount = domainState.selectedVarCodes.size;
    const rowCount = 47 * yearCount;

    if (summaryVarCount) summaryVarCount.textContent = varCount;
    if (summaryYearCount) summaryYearCount.textContent = yearCount;
    if (summaryYearSpan) {
      summaryYearSpan.textContent = domainState.startYear === domainState.endYear 
        ? `${domainState.startYear}年` 
        : `${domainState.startYear}–${domainState.endYear}年`;
    }
    if (summaryRowCount) summaryRowCount.textContent = rowCount.toLocaleString();
  }


  // --- 多指標並列對比管理器 (Multi-Measure Comparison Manager) ---
  function openMultiMeasureModal() {
    const modal = document.getElementById('multiMeasureModal');
    const container = document.getElementById('multiMeasureCheckboxList');
    if (!modal || !container) return;

    // 渲染可用連續指標勾選框
    const selectedSet = new Set(
      state.shelf.yMulti && state.shelf.yMulti.length > 0 
        ? state.shelf.yMulti 
        : (state.shelf.y ? [state.shelf.y] : [])
    );

    container.innerHTML = state.measures.map(m => {
      const isChecked = selectedSet.has(m) ? 'checked' : '';
      return `
        <label style="display: flex; align-items: center; gap: 7px; font-size: 12.5px; padding: 4px 6px; border-radius: 4px; cursor: pointer; user-select: none;">
          <input type="checkbox" value="${escapeHtml(m)}" ${isChecked} class="chk-multi-measure" style="cursor: pointer;">
          <span style="font-weight: 500; color: #1e293b;">${escapeHtml(m)}</span>
        </label>
      `;
    }).join('');

    modal.classList.add('open');
  }

  function confirmMultiMeasure() {
    const checkboxes = document.querySelectorAll('.chk-multi-measure:checked');
    const selected = Array.from(checkboxes).map(c => c.value);
    const modal = document.getElementById('multiMeasureModal');

    if (selected.length === 0) {
      showToast('⚠️ 請至少選取 1 個數值指標');
      return;
    }

    if (selected.length === 1) {
      state.shelf.y = selected[0];
      state.shelf.yMulti = [];
    } else {
      state.shelf.y = selected[0];
      state.shelf.yMulti = selected;
    }

    if (modal) modal.classList.remove('open');
    renderShelves();
    renderVisualization();
    showToast(`⚡ 已套用 ${selected.length} 項指標並列比較！已更新圖表。`);
  }

  function applyMeasurePreset(measureList) {
    const finalMeasures = [];
    measureList.forEach(m => {
      if (state.measures.includes(m)) {
        finalMeasures.push(m);
      } else {
        const cleanM = m.replace(/[佔占]/g, '占');
        const alt = state.measures.find(x => x.replace(/[佔占]/g, '占').includes(cleanM.slice(0, 4)));
        if (alt) finalMeasures.push(alt);
      }
    });

    if (finalMeasures.length >= 2) {
      state.shelf.y = finalMeasures[0];
      state.shelf.yMulti = finalMeasures;
      const modal = document.getElementById('multiMeasureModal');
      if (modal) modal.classList.remove('open');
      renderShelves();
      renderVisualization();
      showToast(`🌟 已成功套用預設對比組合：${finalMeasures.join(' vs ')}！`);
    } else {
      showToast('⚠️ 當前資料集欄位不完全包含此組合，請手動自選指標。');
    }
  }

  function resetMultiMeasure() {
    state.shelf.yMulti = [];
    const modal = document.getElementById('multiMeasureModal');
    if (modal) modal.classList.remove('open');
    renderShelves();
    renderVisualization();
    showToast('已重設為單一指標模式。');
  }

  function removeMultiMeasure(fieldName) {
    if (!state.shelf.yMulti) return;
    state.shelf.yMulti = state.shelf.yMulti.filter(m => m !== fieldName);
    if (state.shelf.yMulti.length === 1) {
      state.shelf.y = state.shelf.yMulti[0];
      state.shelf.yMulti = [];
    } else if (state.shelf.yMulti.length === 0 && !state.shelf.y) {
      state.shelf.y = state.measures[0] || '';
    }
    renderShelves();
    renderVisualization();
  }

  // --- 暴露給全域供點擊調用 ---
  window.PyGWalker = {
    openMultiMeasureModal: () => {
      openMultiMeasureModal();
    },
    confirmMultiMeasure: () => {
      confirmMultiMeasure();
    },
    applyMeasurePreset: (measureList) => {
      applyMeasurePreset(measureList);
    },
    resetMultiMeasure: () => {
      resetMultiMeasure();
    },
    removeMultiMeasure: (fieldName) => {
      removeMultiMeasure(fieldName);
    },
    assignToShelf: (shelfKey, fieldName) => {
      setShelfField(shelfKey, fieldName);
    },
    getEChartsInstance: () => {
      return echartsInstance;
    },
    getState: () => {
      return state;
    },
    clearShelf: (shelfKey) => {
      state.shelf[shelfKey] = '';
      if (shelfKey === 'y') {
        state.shelf.yMulti = [];
      }
      renderShelves();
      renderVisualization();
      renderKPIRibbon();
    },
    cycleAgg: (e) => {
      e.stopPropagation();
      const aggs = ['RAW', 'SUM', 'MEAN', 'MAX', 'MIN', 'COUNT'];
      const nextIdx = (aggs.indexOf(state.shelf.agg) + 1) % aggs.length;
      state.shelf.agg = aggs[nextIdx];
      renderShelves();
      renderVisualization();
      showToast(`已切換 Y 軸聚合模式為：${state.shelf.agg}`);
    },
    toggleBarStackMode: () => {
      state.barStackMode = !state.barStackMode;
      renderShelves();
      renderVisualization();
      showToast(state.barStackMode ? '🥞 已切換為「堆疊累計柱狀圖」' : '📊 已切換為「併排對比柱狀圖」');
    },
    setBarStackMode: (stacked) => {
      state.barStackMode = !!stacked;
      renderShelves();
      renderVisualization();
      showToast(state.barStackMode ? '🥞 已切換為「堆疊累計柱狀圖」' : '📊 已切換為「併排對比柱狀圖」');
    },
    toggleFacetScale: () => {
      state.facetScaleMode = state.facetScaleMode === 'fixed' ? 'free' : 'fixed';
      renderShelves();
      renderVisualization();
      showToast(state.facetScaleMode === 'fixed' ? '🔒 已切換為「統一量表 (Fixed Scale)」' : '🔓 已切換為「獨立自適應量表 (Free Scale)」');
    },
    setFacetScaleMode: (mode) => {
      state.facetScaleMode = mode;
      renderShelves();
      renderVisualization();
    },
    sortTable: (col) => {
      if (state.sortColumn === col) {
        state.sortOrder = state.sortOrder === 'desc' ? 'asc' : 'desc';
      } else {
        state.sortColumn = col;
        state.sortOrder = 'desc';
      }
      renderDataTable();
    },
    openSchemaModal: (isInitial = false) => {
      openSchemaClassifierModal(isInitial);
    },
    open17DomainModal: () => {
      open17DomainModal();
    },
    addFilter: (field) => {
      addFilter(field);
    },
    removeFilter: (field) => {
      removeFilter(field);
    },
    toggleFilterValue: (field, val) => {
      toggleFilterValue(field, val);
    },
    setAllFilterValues: (field, selectAll) => {
      setAllFilterValues(field, selectAll);
    },
    setYearPreset: (field, preset) => {
      setYearPreset(field, preset);
    },
    applyRangeFilter: (field) => {
      applyRangeFilter(field);
    },
    resetAllFilters: () => {
      resetAllFilters();
    },
    getVisualData: (customRows) => {
      return getVisualData(customRows);
    },
    aggregateRows: (rows, groupKeys, measureKeys, aggType) => {
      return aggregateRows(rows, groupKeys, measureKeys, aggType);
    },
    renderVisualization: () => {
      renderVisualization();
    }
  };

  // 暴露至全域供測試與進階模組調用
  window.PALETTE_BAUHAUS = PALETTE_BAUHAUS;
  window.safeParseNumber = safeParseNumber;
  window.safeMin = safeMin;
  window.safeMax = safeMax;
  window.safeExtent = safeExtent;
  window.aggregateRows = aggregateRows;
  window.getVisualData = getVisualData;
  window.renderVisualization = renderVisualization;
  window.loadDataset = loadDataset;

  // 當 DOM 與資源就緒時初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
