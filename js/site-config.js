/* 站台設定：下一梯次只需改 workshop 區；網站名稱改 site 區。 */
window.SITE_CONFIG = {
  site: { name: '大語言模型學習地圖', nameTop: '大語言模型', nameMain: '學習地圖', mark: '學', tagline: '理解，然後動手做。' },
  workshop: {
    title: '一天打造你的 AI 工作流',
    subtitle: 'Claude × ChatGPT × Antigravity 進階實戰工作坊',
    nextDate: '2026-11-05',
    dateLabel: '11/05',
    instructor: '陳俊智 副教授',
    affiliation: '國立臺中科技大學 國際貿易與經營系'
  },
  assetVersion: '20261113',
  /* 資料分析實作路線（檔名不可改，以免舊連結失效）。
     module：填 1–4 可讓工作坊時程的對應時段出現「本時段實作」連結；null 表示不標示。 */
  steps: [
    { file: 'student_data_analyst_workflow.html', title: '看懂工作流', goal: '先看完五個階段：拿資料、清資料、驗證、分析、做儀表板。', module: null },
    { file: 'estat_api_tutorial_simulator.html', title: '申請 e-Stat API', goal: '跟著模擬畫面申請金鑰，避開最常見的設定錯誤。', module: null },
    { file: 'estat_catalog_and_research_guide.html', title: '選題', goal: '從 17 個領域、10 種圖表裡挑一個想回答的問題。', module: null },
    { file: 'data_atoms.html', title: '做儀表板', goal: '在 Data Atoms 拖拉欄位，做出自己的互動圖表。', module: null }
  ],
  references: [
    { file: 'curriculum_1105_workflow.html', title: '全日課程架構圖' },
    { file: 'skills.html', title: 'Skill 與 MCP 清單' },
    { file: 'system_architecture.html', title: 'GitHub + GAS 系統架構' },
    { file: 'openrouter_architecture.html', title: 'OpenRouter 三階資料流' },
    { file: 'japan_population_dashboard.html', title: '日本人口儀表板範例' },
    { file: 'data_atoms_demo.html', title: 'Data Atoms 操作示範影片' },
    { href: 'https://www.e-stat.go.jp', title: 'e-Stat 官網 ↗' },
    { href: 'https://github.com/nutcelvischen-jpg/data-analyst-skill', title: 'data-analyst 技能倉庫 ↗' }
  ]
};
