import re

script_code = r'''
// =========================================================================
// 1. 10 大資料視覺化實戰分析法 (DataViz Atoms Methods Data)
// =========================================================================
const datavizMethodsData = [
  {
    id: "trend_line",
    chartAtom: "line",
    icon: "📈",
    name: "時序趨勢預警法 (Trend Analysis)",
    atomName: "時序趨勢折線圖 (Line Chart)",
    category: "動態走勢",
    question: "日本總人口哪一年開始反轉崩跌？高齡化衝得多快？未來還會繼續惡化嗎？",
    shelfSetup: "X 軸：年份 (1975~2024) ｜ Y 軸：總人口 / 65歲以上老年比例",
    insightTips: "觀察折線的「拐點 (Inflection Point)」與斜率加速度；當老年比例線與幼年人口線黃金交叉，即為超高齡社會分水嶺。",
    datasetHint: "推薦數據：02 人口推計 (1950–2024, 74年序列)",
    tag: "時序預警"
  },
  {
    id: "geo_map",
    chartAtom: "geo",
    icon: "🗾",
    name: "地理空間熱度與城鄉差距法 (Choropleth Geo Map)",
    atomName: "通用地理分級地圖 (Geo Map)",
    category: "空間分佈",
    question: "全日本哪裡空屋最嚴重？年輕人都湧向哪些縣市？偏鄉真的在消失嗎？",
    shelfSetup: "地理維度：都道府縣 (Prefecture) ｜ 色彩深淺：空屋率 / 淨移入人口數",
    insightTips: "透過色階深淺（Choropleth），一眼看出東京、愛知、大阪三大都會區的磁吸紅區，與四國、東北人口空洞化深谷。",
    datasetHint: "推薦數據：08 住宅土地調查 (空屋率) + 02 住民移動報告",
    tag: "區域落差"
  },
  {
    id: "ranking_bar",
    chartAtom: "bar",
    icon: "📊",
    name: "規模體量與競爭排名法 (Ranking & Volume Comparison)",
    atomName: "離散體量柱狀圖 (Bar Chart)",
    category: "體量對比",
    question: "各都道府縣的製造業產值排行？東京的商業規模真的是第二名的幾倍？",
    shelfSetup: "X 軸：都道府縣 / 產業類別 (離散類別) ｜ Y 軸：出貨額 / 營收總和 (度量數值)",
    insightTips: "將數值由大到小降序排列，可以看出斷層式落差（二八法則與長尾分佈），快速辨識誰是領頭羊、誰是後段班。",
    datasetHint: "推薦數據：05 工業統計 + 06 商業統計指標 (1951–2021)",
    tag: "排行對比"
  },
  {
    id: "correlation_scatter",
    chartAtom: "scatter",
    icon: "🔵",
    name: "雙指標關聯與假說檢驗法 (Correlation & Scatter Insight)",
    atomName: "相關散佈分佈圖 (Scatter Plot)",
    category: "關聯驗證",
    question: "地價越貴的地方，空屋率真的越低嗎？平均薪資越高的縣市，大家生得更多還是更少？",
    shelfSetup: "X 軸：住宅公示地價 (或平均薪資) ｜ Y 軸：空屋率 (或粗出生率)",
    insightTips: "觀察散佈點雲的聚集走向：朝右上代表正相關、朝右下代表負相關、散落無章代表兩者無直接關係，快速打破直覺迷思。",
    datasetHint: "推薦數據：13 地價公示 (1974–2024) + 08 空屋率",
    tag: "關聯假說"
  },
  {
    id: "scale_rate_dual",
    chartAtom: "dual",
    icon: "⚖️",
    name: "規模量體 vs 比例比率複合對比法 (Dual-Axis Scale vs Rate)",
    atomName: "雙軸指標複合圖 (Dual-Axis Combo)",
    category: "矛盾解構",
    question: "東京的老人總人數全日本最多，但它的『高齡化比例』到底高不高？總量大跟程度嚴重是一回事嗎？",
    shelfSetup: "X 軸：都道府縣 ｜ 左 Y 軸 (柱狀)：老人總量 (萬人) ｜ 右 Y 軸 (折線)：高齡化率 (%)",
    insightTips: "打破「大城市一定老化最嚴重」的常見盲點：東京老人總數第一但佔比僅 23%（青年稀釋）；偏鄉老人少但佔比突破 40%！",
    datasetHint: "推薦數據：02 社會人口體系 SSDSE-A (47都道府縣)",
    tag: "雙重視角"
  },
  {
    id: "donut_part",
    chartAtom: "donut",
    icon: "🍩",
    name: "整體結構與預算佔比切片法 (Part-to-Whole Composition)",
    atomName: "結構佔比甜甜圈圖 (Donut Chart)",
    category: "結構比例",
    question: "一般日本家庭每個月的薪水都花去哪了？食衣住行育樂誰吃掉了最大的份額？",
    shelfSetup: "類別分組：消費大類 (食品/住居/光熱水費/交通等) ｜ 數值大小：月均支出金額",
    insightTips: "環形切片大小一眼看出核心支出痛點；配合年份篩選，可分析能源通膨對家庭民生造成的擠壓效應。",
    datasetHint: "推薦數據：07 家計調查 (收支與儲蓄, 1963–2024, 61年時序)",
    tag: "開銷結構"
  },
  {
    id: "boxplot_outliers",
    chartAtom: "boxplot",
    icon: "📦",
    name: "分組離散度與貧富極端值檢驗法 (Group Distribution & Outliers)",
    atomName: "盒鬚指標分佈圖 (Boxplot)",
    category: "分佈檢驗",
    question: "各區域的薪資是普遍差不多，還是少數人賺超多、多數人很苦？有沒有誇張的極端值？",
    shelfSetup: "分組維度：八大地理區域 (關東/近畿/中部/九州...) ｜ 分析指標：每人實質工資",
    insightTips: "看箱體高度判斷貧富差距離散度（IQR）；看中位數而非容易被拉偏的平均數；箱外浮點即為「超級離群暴富/偏鄉縣市」。",
    datasetHint: "推薦數據：03 賃金構造基本統計 (1953–2024, 71年時序)",
    tag: "貧富離散"
  },
  {
    id: "radar_profile",
    chartAtom: "radar",
    icon: "🕸️",
    name: "多維綜合體質畫像評估法 (Multidimensional Radar Profile)",
    atomName: "多維畫像雷達圖 (Radar Chart)",
    category: "綜合評價",
    question: "這座城市適不適合我移居？醫療、教育、交通、育兒、環境各得幾分？",
    shelfSetup: "多維度量軸：百人病床數、保育所入所率、道路鋪設率、人均公園面積、財政健全指數",
    insightTips: "多角形覆蓋面積越大代表城市綜合體質越強健；形狀偏向哪一側，一眼識別是「文教型」、「醫療型」還是「環境宜居型」。",
    datasetHint: "推薦數據：SSDSE-A~M 全領域 1500+ 指標體系 (1975–2024)",
    tag: "城市畫像"
  },
  {
    id: "treemap_hierarchy",
    chartAtom: "treemap",
    icon: "🧱",
    name: "多層級結構與面積權重法 (Hierarchical Treemap Weighting)",
    atomName: "矩形樹狀層級圖 (Treemap)",
    category: "層級權重",
    question: "全國近千萬間空屋中，木造 vs 鋼筋、公寓 vs 獨棟、可租售 vs 荒廢無人的分佈權重如何？",
    shelfSetup: "主層級：住宅構造 (木造/非木造) ｜ 次層級：利用現況 (租賃用/拋棄廢棄) ｜ 面積：空屋戶數",
    insightTips: "巢狀矩形以面積直觀呈現整體與局部的權重關係，快速抓出「哪一類危老木造空屋正在釀成治安與倒塌隱患」。",
    datasetHint: "推薦數據：08 住宅土地統計調查 (1948–2023, 75年歷史)",
    tag: "層級佔比"
  },
  {
    id: "funnel_flow",
    chartAtom: "funnel",
    icon: "🔻",
    name: "轉化流失與階段漏斗法 (Conversion Funnel Analysis)",
    atomName: "轉化路徑漏斗圖 (Funnel Chart)",
    category: "流程流失",
    question: "地方青年從高中畢業、升讀大學、外流到東京就業，到最後願意回流鄉村的留存率有多少？",
    shelfSetup: "流程階段：高中畢業數 ➔ 大學在學數 ➔ 在地就業數 ➔ 青年留鄉數 ｜ 數值：人數規模",
    insightTips: "觀察漏斗哪一個階梯落差最劇烈（最大瓶頸點），直接指出政府地方創生補貼應該在哪個階段精準發力。",
    datasetHint: "推薦數據：16 學校基本調查 + 02 住民移動報告 (1975–2024)",
    tag: "漏斗流失"
  }
];
'''

print("Length of script definition:", len(script_code))
