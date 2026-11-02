#!/usr/bin/env python3
"""
Fetch Japanese demographic data from e-Stat and save as structured JSON for visualization.
Dataset used: 社会・人口統計体系 (System of Social and Demographic Statistics)
StatsDataId: 0000010101 (Ａ 人口・世帯)
"""

import json
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))
from estat_api_client import EStatClient

APP_ID = "d96194b7b3219075b1041948fddc842cfead7477"


def main():
    client = EStatClient(app_id=APP_ID)
    print(">>> 正在連線 e-Stat API 擷取『社會・人口統計體系 (0000010101)』...")

    # 1. 抓取全國 1975~2024 年長期推移數據
    print("1. 擷取日本全國半世紀人口結構演進 (1975~2024)...")
    indicators = "A1101,A1301,A1302,A1303,A1401"
    res_national = client.get_stats_data(
        stats_data_id="0000010101",
        cat01=indicators,
        area="00000",
        limit=500,
    )
    national_values = res_national.get("DATA_INF", {}).get("VALUE", [])

    time_series = {}
    for row in national_values:
        yr = row.get("@time")[:4]
        cat = row.get("@cat01")
        val = int(row.get("$", 0))
        if yr not in time_series:
            time_series[yr] = {"year": int(yr)}
        time_series[yr][cat] = val

    national_history = []
    for yr in sorted(time_series.keys()):
        item = time_series[yr]
        total = item.get("A1101", 0)
        u15 = item.get("A1301", 0)
        w15_64 = item.get("A1302", 0)
        o65 = item.get("A1303", 0)
        o75 = item.get("A1401", 0)

        # 計算百分比
        u15_ratio = round((u15 / total * 100), 2) if total else 0
        w_ratio = round((w15_64 / total * 100), 2) if total else 0
        o65_ratio = round((o65 / total * 100), 2) if total else 0
        o75_ratio = round((o75 / total * 100), 2) if total else 0

        national_history.append({
            "year": item["year"],
            "total_population": total,
            "youth_0_14": u15,
            "working_15_64": w15_64,
            "elderly_65_plus": o65,
            "late_elderly_75_plus": o75,
            "youth_ratio": u15_ratio,
            "working_ratio": w_ratio,
            "elderly_ratio": o65_ratio,
            "late_elderly_ratio": o75_ratio,
        })

    print(f"   已取得 {len(national_history)} 個年度的全國歷史數據。")

    # 2. 抓取 2024 年全日本 47 都道府縣的人口規模與高齡化比率
    print("2. 擷取 2024 年日本 47 都道府縣人口與高齡化率...")
    res_pref_2024 = client.get_stats_data(
        stats_data_id="0000010101",
        cat01="A1101,A1301,A1302,A1303",
        time_period="2024100000",
        include_meta=True,
        limit=500,
    )

    # 建立地區名稱映射
    area_map = {}
    classes = res_pref_2024.get("CLASS_INF", {}).get("CLASS_OBJ", [])
    for c in classes:
        if c.get("@id") == "area":
            for a in c.get("CLASS", []):
                area_map[a.get("@code")] = a.get("@name")

    pref_raw = res_pref_2024.get("DATA_INF", {}).get("VALUE", [])
    pref_dict = {}
    for row in pref_raw:
        code = row.get("@area")
        if code == "00000":
            continue
        cat = row.get("@cat01")
        val = int(row.get("$", 0))
        if code not in pref_dict:
            pref_dict[code] = {
                "code": code,
                "name": area_map.get(code, code),
            }
        pref_dict[code][cat] = val

    # 3. 抓取外國人居民數據 (2020 國勢調查 A1700)
    print("3. 擷取各都道府縣的外國人居民人數 (A1700)...")
    res_foreign = client.get_stats_data(
        stats_data_id="0000010101",
        cat01="A1700",
        time_period="2020100000",
        limit=100,
    )
    for row in res_foreign.get("DATA_INF", {}).get("VALUE", []):
        code = row.get("@area")
        if code in pref_dict:
            pref_dict[code]["foreigners"] = int(row.get("$", 0))

    prefectures = []
    for code, d in pref_dict.items():
        total = d.get("A1101", 0)
        u15 = d.get("A1301", 0)
        w15_64 = d.get("A1302", 0)
        o65 = d.get("A1303", 0)
        foreign = d.get("foreigners", 0)

        prefectures.append({
            "code": code,
            "name": d["name"],
            "total_population": total,
            "youth_0_14": u15,
            "working_15_64": w15_64,
            "elderly_65_plus": o65,
            "elderly_ratio": round((o65 / total * 100), 2) if total else 0,
            "youth_ratio": round((u15 / total * 100), 2) if total else 0,
            "foreigners": foreign,
            "foreigners_ratio": round((foreign / total * 100), 2) if total else 0,
        })

    # 排序：按總人口由大到小
    prefectures.sort(key=lambda x: x["total_population"], reverse=True)

    output_data = {
        "metadata": {
            "source": "日本政府統計 e-Stat API v3.0 (總務省統計局)",
            "table_id": "0000010101",
            "table_name": "社会・人口統計体系（Ａ 人口・世帯）",
            "query_timestamp": "2026-11-02",
            "api_endpoint": "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
        },
        "summary_2024": {
            "japan_total_population": national_history[-1]["total_population"],
            "japan_elderly_population": national_history[-1]["elderly_65_plus"],
            "japan_elderly_ratio": national_history[-1]["elderly_ratio"],
            "japan_youth_ratio": national_history[-1]["youth_ratio"],
            "japan_working_ratio": national_history[-1]["working_ratio"],
            "top_populous_prefecture": prefectures[0]["name"],
            "highest_aging_prefecture": max(prefectures, key=lambda x: x["elderly_ratio"])["name"],
            "highest_aging_ratio": max(prefectures, key=lambda x: x["elderly_ratio"])["elderly_ratio"],
            "lowest_aging_prefecture": min(prefectures, key=lambda x: x["elderly_ratio"])["name"],
            "lowest_aging_ratio": min(prefectures, key=lambda x: x["elderly_ratio"])["elderly_ratio"],
        },
        "national_history": national_history,
        "prefectures_2024": prefectures,
    }

    out_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "sample_data",
        "estat_japan_population_demo.json"
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 成功儲存統計資料至: {out_path}")
    print("\n【2024 全國摘要】:")
    print(f"- 總人口: {output_data['summary_2024']['japan_total_population']:,} 人")
    print(f"- 65歲以上高齡化率: {output_data['summary_2024']['japan_elderly_ratio']}%")
    print(f"- 最高齡縣市: {output_data['summary_2024']['highest_aging_prefecture']} ({output_data['summary_2024']['highest_aging_ratio']}%)")
    print(f"- 最年輕都道府縣: {output_data['summary_2024']['lowest_aging_prefecture']} ({output_data['summary_2024']['lowest_aging_ratio']}%)")


if __name__ == "__main__":
    main()
