/* 站台設定：下一梯次只需改 workshop 區。 */
window.SITE_CONFIG = {
  workshop: {
    title: '一天打造你的 AI 工作流',
    subtitle: 'Claude × ChatGPT × Antigravity 進階實戰工作坊',
    nextDate: '2026-11-05',
    dateLabel: '11/05',
    instructor: '陳俊智 副教授',
    affiliation: '國立臺中科技大學 國際貿易與經營系'
  },
  assetVersion: '20261110',
  /* 工作坊線性步驟（檔名不可改，以免舊連結失效） */
  steps: [
    { file: 'curriculum_1105_workflow.html', title: '全日課程架構' },
    { file: 'student_data_analyst_workflow.html', title: '分析師工作流' },
    { file: 'estat_api_tutorial_simulator.html', title: '申請 e-Stat API' },
    { file: 'estat_catalog_and_research_guide.html', title: '17 領域研究指南' },
    { file: 'data_atoms.html', title: 'Data Atoms 儀表板' }
  ],
  references: [
    { file: 'system_architecture.html', title: 'GitHub + GAS 系統架構' },
    { file: 'openrouter_architecture.html', title: 'OpenRouter 三階資料流' },
    { file: 'japan_population_dashboard.html', title: '日本人口儀表板範例' },
    { href: 'https://www.e-stat.go.jp', title: 'e-Stat 官網 ↗' },
    { href: 'https://github.com/nutcelvischen-jpg/data-analyst-skill', title: 'data-analyst 技能倉庫 ↗' }
  ]
};
