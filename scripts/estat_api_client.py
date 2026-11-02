#!/usr/bin/env python3
"""
e-Stat API (Version 3.0) Python Client
======================================
官方網站: https://www.e-stat.go.jp/
API 規範: https://www.e-stat.go.jp/api/en/api-info/api-spec

本客戶端提供對日本政府官方統計 e-Stat API v3.0 的標準封裝，
支援關鍵字檢索、元資料（維度代碼）解析、統計數值擷取與格式轉換。
"""

import json
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional, Union


class EStatClient:
    """日本政府統計 e-Stat API v3.0 客戶端"""

    BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json"

    def __init__(self, app_id: str, default_lang: str = "J", timeout: int = 15):
        """
        初始化客戶端
        :param app_id: e-Stat 發行的 Application ID (API Key)
        :param default_lang: 預設語系 'J' (日語) 或 'E' (英語)
        :param timeout: 網路請求超時秒數
        """
        if not app_id:
            raise ValueError("必須提供有效的 e-Stat appId")
        self.app_id = app_id
        self.default_lang = default_lang
        self.timeout = timeout
        self.last_request_time = 0.0
        self.min_interval = 0.3  # 請求間隔保護，避免觸發 429 / 503 限流

    def _request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """執行 API 呼叫並處理節流與異常"""
        # 簡易頻率控制 (Rate limiting protection)
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)

        req_params = {
            "appId": self.app_id,
            "lang": params.get("lang", self.default_lang),
            **params,
        }
        query_string = urllib.parse.urlencode(req_params)
        url = f"{self.BASE_URL}/{endpoint}?{query_string}"

        headers = {
            "User-Agent": "EStatPythonClient/3.0 (+https://github.com/e-stat-api)",
            "Accept": "application/json",
        }
        req = urllib.request.Request(url, headers=headers)

        try:
            self.last_request_time = time.time()
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"HTTP {e.code} Error calling {endpoint}: {err_body}") from e
        except Exception as e:
            raise RuntimeError(f"連線至 e-Stat 失敗: {str(e)}") from e

        # 檢查 e-Stat 返回的業務狀態碼
        root_key = list(data.keys())[0] if data else ""
        result_info = data.get(root_key, {}).get("RESULT", {})
        status = result_info.get("STATUS", 0)
        if status != 0:
            error_msg = result_info.get("ERROR_MSG", "未知錯誤")
            raise RuntimeError(f"e-Stat API 錯誤 [{status}]: {error_msg}")

        return data

    def search_tables(
        self,
        search_word: Optional[str] = None,
        survey_years: Optional[str] = None,
        stats_field: Optional[str] = None,
        stats_code: Optional[str] = None,
        limit: int = 20,
        start_position: int = 1,
        search_kind: int = 1,
    ) -> List[Dict[str, Any]]:
        """
        [getStatsList] 檢索統計表清單
        :param search_word: 搜尋關鍵字 (例如: '人口', 'CPI', '賃金')
        :param survey_years: 調查年度 (例如: '2020' 或 '2015-2020')
        :param stats_field: 統計領域分類代碼 (01~17)
        :param stats_code: 政府統計調查代碼 (8位數，如國勢調查 00200521)
        :param limit: 回傳筆數 (最大 1,000)
        :param start_position: 起始筆數 (從 1 開始)
        :param search_kind: 1=統計表, 2=小分類資料集
        """
        params: Dict[str, Any] = {
            "limit": min(limit, 1000),
            "startPosition": start_position,
            "searchKind": search_kind,
        }
        if search_word:
            params["searchWord"] = search_word
        if survey_years:
            params["surveyYears"] = survey_years
        if stats_field:
            params["statsField"] = stats_field
        if stats_code:
            params["statsCode"] = stats_code

        res = self._request("getStatsList", params)
        datalist = res.get("GET_STATS_LIST", {}).get("DATALIST_INF", {})
        table_inf = datalist.get("TABLE_INF", [])
        if isinstance(table_inf, dict):
            table_inf = [table_inf]
        return table_inf

    def get_meta_info(self, stats_data_id: str, explanation: bool = False) -> Dict[str, Any]:
        """
        [getMetaInfo] 取得統計表的欄位定義、維度代碼 (Class/Categories)
        :param stats_data_id: 統計表 ID (10 位數，例如 '0000010101')
        :param explanation: 是否包含更詳細的指標定義說明
        """
        params = {
            "statsDataId": stats_data_id,
            "explanationGetFlg": "Y" if explanation else "N",
        }
        res = self._request("getMetaInfo", params)
        return res.get("GET_META_INFO", {}).get("METADATA_INF", {})

    def get_stats_data(
        self,
        stats_data_id: str,
        cat01: Optional[str] = None,
        cat02: Optional[str] = None,
        cat03: Optional[str] = None,
        area: Optional[str] = None,
        time_period: Optional[str] = None,
        tab: Optional[str] = None,
        include_meta: bool = True,
        limit: int = 10000,
        start_position: int = 1,
    ) -> Dict[str, Any]:
        """
        [getStatsData] 取得統計數值與觀測資料
        :param stats_data_id: 統計表 ID (10 位數)
        :param cat01: 分類1代碼，可用逗點分隔多組代碼 (例: 'A1101,A1303')
        :param cat02: 分類2代碼
        :param cat03: 分類3代碼
        :param area: 地區代碼 (例: '00000' 全國, '13000' 東京都)
        :param time_period: 時間代碼 (例: '2024100000' 或區間)
        :param tab: 表頭代碼 (Cross-tab)
        :param include_meta: 是否同時返回維度字典對照表 (metaGetFlg)
        :param limit: 單次請求最大筆數 (上限 100,000)
        :param start_position: 起始資料偏移量
        """
        params: Dict[str, Any] = {
            "statsDataId": stats_data_id,
            "metaGetFlg": "Y" if include_meta else "N",
            "limit": min(limit, 100000),
            "startPosition": start_position,
        }
        if cat01:
            params["cdCat01"] = cat01
        if cat02:
            params["cdCat02"] = cat02
        if cat03:
            params["cdCat03"] = cat03
        if area:
            params["cdArea"] = area
        if time_period:
            params["cdTime"] = time_period
        if tab:
            params["cdTab"] = tab

        res = self._request("getStatsData", params)
        return res.get("GET_STATS_DATA", {}).get("STATISTICAL_DATA", {})


if __name__ == "__main__":
    import sys
    APP_ID = "d96194b7b3219075b1041948fddc842cfead7477"
    client = EStatClient(app_id=APP_ID)
    print("=== 測試連線 e-Stat API v3.0 ===")
    results = client.search_tables(search_word="人口", limit=3)
    print(f"成功搜尋到 {len(results)} 張統計表:")
    for t in results:
        print(f"- [{t.get('@id')}] {t.get('STAT_NAME',{}).get('$', '')} : {t.get('TITLE',{}).get('$', '')}")
