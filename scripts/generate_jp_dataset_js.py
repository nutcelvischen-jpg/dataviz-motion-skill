#!/usr/bin/env python3
"""
Generate valid js/data_atoms_jp_dataset.js
"""
import json

with open('./sample_data/estat_japan_population_demo.json', 'r', encoding='utf-8') as f:
    demo = json.load(f)

regions_map = {
    '北海道': '北海道・東北', '青森県': '北海道・東北', '岩手県': '北海道・東北', '宮城県': '北海道・東北', '秋田県': '北海道・東北', '山形県': '北海道・東北', '福島県': '北海道・東北',
    '茨城県': '關東地方', '栃木県': '關東地方', '群馬県': '關東地方', '埼玉県': '關東地方', '千葉県': '關東地方', '東京都': '關東地方', '神奈川県': '關東地方',
    '新潟県': '中部地方', '富山県': '中部地方', '石川県': '中部地方', '福井県': '中部地方', '山梨県': '中部地方', '長野県': '中部地方', '岐阜県': '中部地方', '静岡県': '中部地方', '愛知県': '中部地方',
    '三重県': '近畿地方', '滋賀県': '近畿地方', '京都府': '近畿地方', '大阪府': '近畿地方', '兵庫県': '近畿地方', '奈良県': '近畿地方', '和歌山県': '近畿地方',
    '鳥取県': '中國地方', '島根県': '中國地方', '岡山県': '中國地方', '広島県': '中國地方', '山口県': '中國地方',
    '徳島県': '四國地方', '香川県': '四國地方', '愛媛県': '四國地方', '高知県': '四國地方',
    '福岡県': '九州・沖繩', '佐賀県': '九州・沖繩', '長崎県': '九州・沖繩', '熊本県': '九州・沖繩', '大分県': '九州・沖繩', '宮崎県': '九州・沖繩', '鹿児島県': '九州・沖繩', '沖縄県': '九州・沖繩'
}

# 1. 47 Prefectures
prefs_data = []
for p in demo['prefectures_2024']:
    name = p['name']
    region = regions_map.get(name, '其他地方')
    tot = p['total_population']
    eld = p['elderly_65_plus']
    yt = p['youth_0_14']
    wk = p['working_15_64']
    dep = round(((yt + eld) / wk) * 100, 2) if wk > 0 else 0
    prefs_data.append({
        '都道府縣': name,
        '地方分區': region,
        '總人口(人)': tot,
        '65歲以上高齡人口(人)': eld,
        '高齡化率(%)': p['elderly_ratio'],
        '15-64歲勞動力人口(人)': wk,
        '0-14歲幼年人口(人)': yt,
        '幼年人口率(%)': p['youth_ratio'],
        '在留外國人數(人)': p['foreigners'],
        '外國人佔比(%)': p['foreigners_ratio'],
        '總扶養比(%)': dep
    })

# 2. 50-Year History
history_data = []
for h in demo['national_history']:
    yr = h['year']
    tot = h['total_population']
    eld = h['elderly_65_plus']
    yt = h['youth_0_14']
    wk = h['working_15_64']
    dep = round(((yt + eld) / wk) * 100, 2) if wk > 0 else 0
    history_data.append({
        '年份': f"{yr}年",
        '年號': yr,
        '全國總人口(人)': tot,
        '65歲以上人口(人)': eld,
        '高齡化率(%)': h['elderly_ratio'],
        '15-64歲勞動人口(人)': wk,
        '0-14歲幼年人口(人)': yt,
        '幼年人口佔比(%)': h['youth_ratio'],
        '勞動人口佔比(%)': h['working_ratio'],
        '總扶養比(%)': dep
    })

# 3. Regional Aggregation
region_totals = {}
for p in prefs_data:
    r = p['地方分區']
    if r not in region_totals:
        region_totals[r] = {
            '地方分區': r,
            '涵蓋都道府縣數': 0,
            '區域總人口(人)': 0,
            '區域65歲以上人口(人)': 0,
            '區域勞動力人口(人)': 0,
            '區域幼年人口(人)': 0
        }
    region_totals[r]['涵蓋都道府縣數'] += 1
    region_totals[r]['區域總人口(人)'] += p['總人口(人)']
    region_totals[r]['區域65歲以上人口(人)'] += p['65歲以上高齡人口(人)']
    region_totals[r]['區域勞動力人口(人)'] += p['15-64歲勞動力人口(人)']
    region_totals[r]['區域幼年人口(人)'] += p['0-14歲幼年人口(人)']

regions_data = []
for r, d in region_totals.items():
    tot = d['區域總人口(人)']
    eld = d['區域65歲以上人口(人)']
    wk = d['區域勞動力人口(人)']
    yt = d['區域幼年人口(人)']
    d['區域平均高齡率(%)'] = round((eld / tot) * 100, 2) if tot > 0 else 0
    d['區域扶養比(%)'] = round(((yt + eld) / wk) * 100, 2) if wk > 0 else 0
    regions_data.append(d)

regions_data.sort(key=lambda x: x['區域總人口(人)'], reverse=True)

pref_obj = {
    'id': 'jp_prefectures',
    'name': '🇯🇵 日本 47 都道府縣人口與高齡化全量 (2024 e-Stat 官方)',
    'source': '日本總務省統計局 e-Stat 官方 API v3.0',
    'defaultX': '都道府縣',
    'defaultY': '總人口(人)',
    'defaultColor': '地方分區',
    'defaultSize': '65歲以上高齡人口(人)',
    'defaultSecondary': '高齡化率(%)',
    'defaultChart': 'bar',
    'data': prefs_data
}

hist_obj = {
    'id': 'jp_history',
    'name': '🇯🇵 日本半世紀人口結構演進時序 (1975–2024 e-Stat 官方)',
    'source': '日本總務省統計局 e-Stat 官方 API v3.0',
    'defaultX': '年份',
    'defaultY': '全國總人口(人)',
    'defaultColor': '',
    'defaultSize': '',
    'defaultSecondary': '高齡化率(%)',
    'defaultChart': 'line',
    'data': history_data
}

reg_obj = {
    'id': 'jp_regions',
    'name': '🇯🇵 日本地方分區人口與結構彙總表 (2024 e-Stat 官方)',
    'source': '依 47 都道府縣按行政區域聚合彙整',
    'defaultX': '地方分區',
    'defaultY': '區域總人口(人)',
    'defaultColor': '地方分區',
    'defaultSize': '區域65歲以上人口(人)',
    'defaultSecondary': '區域平均高齡率(%)',
    'defaultChart': 'bar',
    'data': regions_data
}

js_content = f"""/**
 * 日本官方統計 e-Stat 預置大數據庫 (Data Atoms & PyGWalker 專用)
 */
const _jpPrefDataset = {json.dumps(pref_obj, ensure_ascii=False, indent=2)};
const _jpHistDataset = {json.dumps(hist_obj, ensure_ascii=False, indent=2)};
const _jpRegDataset = {json.dumps(reg_obj, ensure_ascii=False, indent=2)};

window.ESTAT_JP_DATASETS = {{
  jp_prefectures: _jpPrefDataset,
  prefectures_2024: _jpPrefDataset,
  jp_history: _jpHistDataset,
  history_50yrs: _jpHistDataset,
  jp_regions: _jpRegDataset,
  regions_2024: _jpRegDataset
}};
"""

with open('./js/data_atoms_jp_dataset.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Generated valid js/data_atoms_jp_dataset.js!")
