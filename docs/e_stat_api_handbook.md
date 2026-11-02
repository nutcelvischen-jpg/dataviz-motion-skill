# 日本政府官方統計 e-Stat API v3.0 完全使用說明書與實戰手冊

> **官方入口網站：** [e-Stat 統計ポータルサイト](https://www.e-stat.go.jp/)  
> **API 官方規格文檔：** [e-Stat API Specification](https://www.e-stat.go.jp/api/en/api-info/api-spec)  
> **本專案已驗證金鑰 (appId)：** `d96194b7b3219075b1041948fddc842cfead7477`  
> **連線狀態：** 🟢 驗證通過，正式可用（HTTP 200 / STATUS 0）

---

## 目錄
1. [什麼是 e-Stat API？](#1-什麼是-e-stat-api)
2. [版本架構演進：v2.1 vs v3.0](#2-版本架構演進v21-vs-v30)
3. [通訊協定與基礎網址 (Base URLs)](#3-通訊協定與基礎網址-base-urls)
4. [核心五大端點詳細指南](#4-核心五大端點詳細指南)
5. [常用請求參數全字典](#5-常用請求參數全字典)
6. [JSON 回應資料結構解構](#6-json-回應資料結構解構)
7. [頻率限制與錯誤處理規範](#7-頻率限制與錯誤處理規範)
8. [實戰連線：我們用這個 API 做出了什麼？](#8-實戰連線我們用這個-api-做出了什麼)
9. [延伸應用場景與商業價值清單](#9-延伸應用場景與商業價值清單)

---

## 1. 什麼是 e-Stat API？

**e-Stat**（政府統計ポータルサイト）是日本總務省統計局整合日本各中央省廳（內閣府、財務省、厚生勞動省、國土交通省等）所發布的官方統計入口網站。

**e-Stat API** 提供了機器可讀（Machine-Readable）的 RESTful 接口，讓開發者、數據分析師與企業系統無需手動下載 Excel/CSV 檔案，即可直接以程式自動化檢索超過 **數十萬張官方統計表**，涵蓋：
- **人口與社會動向**：國勢調查、人口推計、住民基本台帳
- **經濟與企業營運**：消費者物價指數 (CPI)、企業活動基本調查、商業統計
- **勞動與就業所得**：每月勤勞統計、勞動力調查、賃金結構基本調查
- **國土與觀光居住**：住宅與土地統計、訪日外國旅客觀光動向

---

## 2. 版本架構演進：v2.1 vs v3.0

目前 e-Stat 提供兩種版本，**強烈建議全面採用 v3.0**：

| 特性比較 | 舊版 Version 2.1 (v2.1) | 新版 Version 3.0 (v3.0) - 本專案採用 |
| :--- | :--- | :--- |
| **維護狀態** | 維護模式（Legacy） | **官方主要推薦版本（Current Standard）** |
| **參數標準化** | 參數命名較不統一（如 `stat_id`） | 統一命名規範（如 `statsDataId`） |
| **JSON 架構** | 多層巢狀深且屬性命名較繁雜 | 結構清晰，明確區隔 `RESULT`、`PARAMETER` 與 `STATISTICAL_DATA` |
| **篩選能力** | 僅支援基礎維度篩選 | 支援細緻的元資料控制 (`metaGetFlg`, `explanationGetFlg`) |
| **單次最大筆數** | 100,000 筆 | 100,000 筆 |

---

## 3. 通訊協定與基礎網址 (Base URLs)

所有請求均採用標準 HTTP GET 方式呼叫，官方伺服器全面支援 HTTPS 加密傳輸。

### 端點基礎路徑 (v3.0)

| 格式類型 | 基礎 URL (Base URL) | 說明 |
| :--- | :--- | :--- |
| **REST JSON** | `https://api.e-stat.go.jp/rest/3.0/app/json/<endpoint>` | **最常用**，回傳標準 JSON 物件 |
| **REST JSONP** | `https://api.e-stat.go.jp/rest/3.0/app/json/<endpoint>?callback=<fn>` | 用於前端瀏覽器跨域呼叫 |
| **REST XML** | `https://api.e-stat.go.jp/rest/3.0/app/<endpoint>` | 回傳標準 XML 格式 |
| **CSV 簡化格式** | `https://api.e-stat.go.jp/rest/3.0/app/getSimpleStatsData` | 直出扁平 CSV 結構 |

---

## 4. 核心五大端點詳細指南

```
取得 API 金鑰 (appId)
       │
       ▼
1. getStatsList: 搜尋統計表 ID (statsDataId)
       │
       ▼
2. getMetaInfo: 取得該表的維度代碼 (Class/Cat/Area/Time)
       │
       ▼
3. getStatsData: 指定維度與時間，精準下載觀測數值
       │
       ▼
4. 資料分析與視覺化 (Charts, Dashboards, Pandas)
```

### 端點 1：`getStatsList`（統計表搜尋）
- **功能**：根據關鍵字、年份或機關代碼搜尋資料庫中的統計表，獲取 `statsDataId`。
- **範例請求**：
  ```http
  GET https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=YOUR_KEY&searchWord=人口&limit=5
  ```
- **核心回傳欄位**：
  - `@id`: 統計表 ID（10 碼數字，例如 `0000010101`）
  - `STAT_NAME`: 統計名稱（例如「社會・人口統計體系」）
  - `TITLE`: 該張統計表的標題（例如「Ａ 人口・世帯」）
  - `SURVEY_DATE`: 調查時間

---

### 端點 2：`getMetaInfo`（維度欄位定義取得）
- **功能**：查詢某張統計表所具備的「分類維度」（例如：年齡層、性別、47都道府縣、時間區間），避免抓下不必要的幾百萬筆資料。
- **範例請求**：
  ```http
  GET https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=YOUR_KEY&statsDataId=0000010101
  ```
- **核心回傳欄位**：
  - `CLASS_OBJ`: 分類維度陣列（`cat01`, `cat02`, `area`, `time`, `tab`）
  - 每個項目包含 `@code`（如 `A1101`）、`@name`（如「A1101_總人口」）、`@unit`（如「人」）。

---

### 端點 3：`getStatsData`（統計數值取得）
- **功能**：核心取數接口。透過維度代碼組合，擷取確切的統計數字。
- **範例請求**：
  ```http
  GET https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=YOUR_KEY&statsDataId=0000010101&cdCat01=A1101,A1303&cdArea=00000&limit=100
  ```
- **核心回傳欄位**：
  - `DATA_INF` -> `VALUE`: 觀測值陣列。
  - 每個物件為一筆資料：`{"@time": "2024100000", "@cat01": "A1101", "@unit": "人", "$": "123802000"}`，其中 `$` 即為實際數值。

---

### 端點 4：`getSimpleStatsData`（簡易 CSV / Tabular 資料）
- **功能**：回傳扁平化表格結構，適合需要快速輸出 CSV 或給試算表軟體使用的情境。

---

### 端點 5：`getDataCatalog`（資料型錄檢索）
- **功能**：搜尋官方發布的非 API 原始檔案（如 XLS、CSV、PDF 專案報告書）。

---

## 5. 常用請求參數全字典

| 參數名稱 | 適用端點 | 是否必填 | 預設值 | 說明與取值範例 |
| :--- | :--- | :---: | :---: | :--- |
| `appId` | 所有端點 | **必填** | - | 您的 40 位數 Application ID |
| `lang` | 所有端點 | 選填 | `J` | 語系：`J`（日語）或 `E`（英語） |
| `statsDataId` | getMetaInfo, getStatsData | **必填** | - | 10 位數統計表 ID，例如 `0000010101` |
| `searchWord` | getStatsList, getDataCatalog | 選填 | - | 搜尋關鍵字，如 `消費者物価指数`、`観光` |
| `surveyYears` | getStatsList | 選填 | - | 調查年份，如 `2020` 或區間 `2015-2020` |
| `limit` | 所有端點 | 選填 | 100 | 單次取回上限（getStatsList 最大 1,000；getStatsData 最大 100,000） |
| `startPosition` | 所有端點 | 選填 | 1 | 分頁起始位移量（從 1 開始計數） |
| `cdCat01` ~ `cdCat15` | getStatsData | 選填 | 全部 | 分類維度代碼，支援逗點多選（例如 `A1101,A1303`） |
| `cdArea` | getStatsData | 選填 | 全部 | 行政區代碼（`00000` 為全國，`13000` 為東京都） |
| `cdTime` | getStatsData | 選填 | 全部 | 時間代碼（例如 `2024100000`） |
| `metaGetFlg` | getStatsData | 選填 | `N` | `Y` 表示一併回傳標籤中文/日文對照表；`N` 僅回傳數值以省頻寬 |
| `cntGetFlg` | getStatsData | 選填 | `N` | `Y` 時僅回傳符合條件之總筆數（不回傳實際資料列） |
| `callback` | JSON 端點 | 選填 | - | 用於前端 JSONP 跨域調用的函式名稱 |

---

## 6. JSON 回應資料結構解構

當呼叫 `getStatsData` 並開啟 `metaGetFlg=Y` 時，返回的 JSON 結構如下：

```json
{
  "GET_STATS_DATA": {
    "RESULT": {
      "STATUS": 0,
      "ERROR_MSG": "正常に終了しました。",
      "DATE": "2026-11-02T14:49:28.830+09:00"
    },
    "PARAMETER": {
      "STATS_DATA_ID": "0000010101",
      "LIMIT": 10
    },
    "STATISTICAL_DATA": {
      "TABLE_INF": {
        "@id": "0000010101",
        "STAT_NAME": { "$": "社会・人口統計体系" },
        "TITLE": { "$": "Ａ　人口・世帯" }
      },
      "CLASS_INF": {
        "CLASS_OBJ": [
          {
            "@id": "cat01",
            "@name": "Ａ　人口・世帯",
            "CLASS": [
              { "@code": "A1101", "@name": "A1101_総人口", "@unit": "人" },
              { "@code": "A1303", "@name": "A1303_65歳以上人口", "@unit": "人" }
            ]
          },
          {
            "@id": "area",
            "@name": "地域",
            "CLASS": [
              { "@code": "00000", "@name": "全国" },
              { "@code": "13000", "@name": "東京都" }
            ]
          }
        ]
      },
      "DATA_INF": {
        "VALUE": [
          {
            "@tab": "00001",
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2024100000",
            "@unit": "人",
            "$": "123802000"
          }
        ]
      }
    }
  }
}
```

> **資料解析秘訣：**  
> 1. 先檢查 `RESULT.STATUS === 0`，非 0 代表有錯誤。  
> 2. 數值本體存放於 `DATA_INF.VALUE` 陣列中的 `$` 鍵，型別為字串，需使用 `parseInt()` 或 `parseFloat()` 轉換。  
> 3. `@cat01`、`@area`、`@time` 分別對應到 `CLASS_INF` 中的代碼說明。

---

## 7. 頻率限制與錯誤處理規範

### 速率限制 (Rate Limits)
- **並行請求限制**：e-Stat 未公開嚴苛的每秒限制，但官方建議同一 IP / appId 避免連續高頻發起並行請求。建議客戶端維持 **≥ 200ms** 間隔。
- **單次最大查詢量**：
  - `getStatsData`: 最大 **100,000** 筆。
  - `getStatsList`: 最大 **1,000** 筆。
  - 如資料超過上限，必須搭配 `startPosition` 進行分頁擷取（Pagination）。

### 常見 HTTP 狀態碼與 e-Stat STATUS 代碼
- **HTTP 200 + STATUS 0**：請求成功。
- **HTTP 200 + STATUS 100**：資料不存在（無符合條件的數據）。
- **HTTP 200 + STATUS 101**：appId 無效或未被授權。
- **HTTP 429 / 503**：頻率過高遭伺服器限流，請實作指數退避重試（Exponential Backoff）。

---

## 8. 實戰連線：我們用這個 API 做出了什麼？

在本次連線測試中，我們使用您的 API Key 直連 e-Stat 官方資料庫，成功產出了三個開箱即用的成果：

### 成果 1：現代化 Python 客戶端封裝
- **檔案路徑**：`scripts/estat_api_client.py`
- **功能特點**：
  - 封裝 `search_tables()`、`get_meta_info()`、`get_stats_data()` 方法。
  - 自動處理請求間隔限流保護，避免觸發 429。
  - 完整的型別標註與異常狀態檢查。

### 成果 2：全自動數據擷取管線
- **檔案路徑**：`scripts/fetch_estat_showcase.py`
- **產出數據**：`sample_data/estat_japan_population_demo.json`
- **實測萃取出的 2024 年日本人口真實洞察**：
  - **日本總人口 (2024)**：`123,802,000` 人（較 2008 年峰值減少 428 萬人）。
  - **65 歲以上高齡化率**：`29.27%`（達 3,624 萬人，相當於每 3.4 人就有 1 位長者）。
  - **全日本最高齡縣市**：**秋田縣**，高齡化率高達 **39.46%**（每 10 人就有將近 4 位長者）。
  - **全日本最年輕行政區**：**東京都**，高齡化率 **22.68%**。

### 成果 3：高互動視覺化數據儀表板
- **檔案路徑**：`japan_population_dashboard.html`
- **包含功能**：
  1. **半世紀人口總量與高齡化率雙軸趨勢圖 (1975~2024)**。
  2. **47 都道府縣人口排行榜與高齡化極值比較**。
  3. **少子高齡化世代結構消長（0-14歲 vs 15-64歲 vs 65+歲 100% 堆疊面積圖）**。
  4. **內建 e-Stat API 實時測試台**：可在網頁上直接輸入不同端點與參數，即時向官方發送請求並檢視 JSON。

---

## 9. 延伸應用場景與商業價值清單

透過 e-Stat 官方豐富的資料庫，後續可輕鬆打造下列高價值應用：

1. **日本不動產與門市選址分析系統**
   - 結合 `0000010101`（人口移入/移出）與 `0000010108`（住宅每坪租金與空屋率），評估東京圈、福岡、札幌等熱門城市的房產租金回報率與少子化風險。
2. **訪日外國旅客與觀光消費景氣監控**
   - 串接「訪日外客消費動向調查」，依國家（台灣、香港、美國、中國）分析人均消費金額、住宿天數與購物偏好演變。
3. **通膨、物價與企業薪資競爭力分析**
   - 串接「消費者物價指數 (CPI)」與「每月勤勞統計調查」，監控日本民生實質薪資成長率與物價上漲關聯。
4. **醫療與長照健康產業市場規模預測**
   - 串接「社會・人口統計體系 (Ｉ 健康・醫療)」中的醫療機構數、病床數、醫師數與高齡人口比例，推估長照照護資源缺口。
