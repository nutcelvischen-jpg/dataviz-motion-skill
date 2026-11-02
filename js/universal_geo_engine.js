/**
 * Universal Geo Engine for Data Atoms Studio
 * 通用地理視覺化引擎：支援日本 (47都道府縣)、台灣 (22縣市)、世界主要國家、美國各州與經緯度自適應
 * 具備智慧地理實體識別 (Smart Entity Detection) 與空間分級熱力 (Choropleth/Bubble Mapping)
 */

(function () {
  'use strict';

  // --- 1. 日本 47 都道府縣地理坐標基準庫 ---
  const JAPAN_PREFECTURES_GEO = {
    '北海道': { lng: 141.3544, lat: 43.0621, region: '北海道・東北' },
    '青森県': { lng: 140.7400, lat: 40.8244, region: '北海道・東北' },
    '岩手県': { lng: 141.1527, lat: 39.7036, region: '北海道・東北' },
    '宮城県': { lng: 140.8719, lat: 38.2688, region: '北海道・東北' },
    '秋田県': { lng: 140.1024, lat: 39.7186, region: '北海道・東北' },
    '山形県': { lng: 140.3633, lat: 38.2404, region: '北海道・東北' },
    '福島県': { lng: 140.4678, lat: 37.7500, region: '北海道・東北' },
    '茨城県': { lng: 140.4468, lat: 36.3418, region: '關東地方' },
    '栃木県': { lng: 139.8836, lat: 36.5658, region: '關東地方' },
    '群馬県': { lng: 139.0608, lat: 36.3911, region: '關東地方' },
    '埼玉県': { lng: 139.6489, lat: 35.8569, region: '關東地方' },
    '千葉県': { lng: 140.1233, lat: 35.6051, region: '關東地方' },
    '東京都': { lng: 139.6917, lat: 35.6895, region: '關東地方' },
    '神奈川県': { lng: 139.6425, lat: 35.4478, region: '關東地方' },
    '新潟県': { lng: 139.0236, lat: 37.9026, region: '中部地方' },
    '富山県': { lng: 137.2113, lat: 36.6953, region: '中部地方' },
    '石川県': { lng: 136.6256, lat: 36.5947, region: '中部地方' },
    '福井県': { lng: 136.2219, lat: 36.0652, region: '中部地方' },
    '山梨県': { lng: 138.5683, lat: 35.6639, region: '中部地方' },
    '長野県': { lng: 138.1812, lat: 36.6513, region: '中部地方' },
    '岐阜県': { lng: 136.7223, lat: 35.3912, region: '中部地方' },
    '静岡県': { lng: 138.3831, lat: 34.9769, region: '中部地方' },
    '愛知県': { lng: 136.9066, lat: 35.1802, region: '中部地方' },
    '三重県': { lng: 136.5086, lat: 34.7303, region: '近畿地方' },
    '滋賀県': { lng: 135.8686, lat: 35.0045, region: '近畿地方' },
    '京都府': { lng: 135.7556, lat: 35.0211, region: '近畿地方' },
    '大阪府': { lng: 135.5200, lat: 34.6863, region: '近畿地方' },
    '兵庫県': { lng: 135.1830, lat: 34.6913, region: '近畿地方' },
    '奈良県': { lng: 135.8328, lat: 34.6853, region: '近畿地方' },
    '和歌山県': { lng: 135.1675, lat: 34.2260, region: '近畿地方' },
    '鳥取県': { lng: 134.2383, lat: 35.5039, region: '中國地方' },
    '島根県': { lng: 133.0505, lat: 35.4723, region: '中國地方' },
    '岡山県': { lng: 133.9350, lat: 34.6618, region: '中國地方' },
    '広島県': { lng: 132.4596, lat: 34.3966, region: '中國地方' },
    '山口県': { lng: 131.4705, lat: 34.1859, region: '中國地方' },
    '徳島県': { lng: 134.5594, lat: 34.0658, region: '四國地方' },
    '香川県': { lng: 134.0433, lat: 34.3401, region: '四國地方' },
    '愛媛県': { lng: 132.7661, lat: 33.8417, region: '四國地方' },
    '高知県': { lng: 133.5311, lat: 33.5597, region: '四國地方' },
    '福岡県': { lng: 130.4181, lat: 33.6068, region: '九州・沖繩' },
    '佐賀県': { lng: 130.2988, lat: 33.2494, region: '九州・沖繩' },
    '長崎県': { lng: 129.8737, lat: 32.7448, region: '九州・沖繩' },
    '熊本県': { lng: 130.7417, lat: 32.7898, region: '九州・沖繩' },
    '大分県': { lng: 131.6126, lat: 33.2382, region: '九州・沖繩' },
    '宮崎県': { lng: 131.4239, lat: 31.9111, region: '九州・沖繩' },
    '鹿児島県': { lng: 130.5581, lat: 31.5602, region: '九州・沖繩' },
    '沖縄県': { lng: 127.6811, lat: 26.2124, region: '九州・沖繩' }
  };

  // --- 2. 台灣 22 縣市地理坐標基準庫 ---
  const TAIWAN_COUNTIES_GEO = {
    '基隆市': { lng: 121.7462, lat: 25.1276 },
    '台北市': { lng: 121.5654, lat: 25.0330 },
    '臺北市': { lng: 121.5654, lat: 25.0330 },
    '新北市': { lng: 121.4657, lat: 25.0123 },
    '桃園市': { lng: 121.3010, lat: 24.9936 },
    '新竹市': { lng: 120.9675, lat: 24.8138 },
    '新竹縣': { lng: 121.0135, lat: 24.8387 },
    '苗栗縣': { lng: 120.8208, lat: 24.5602 },
    '台中市': { lng: 120.6736, lat: 24.1477 },
    '臺中市': { lng: 120.6736, lat: 24.1477 },
    '彰化縣': { lng: 120.5385, lat: 24.0518 },
    '南投縣': { lng: 120.6865, lat: 23.9609 },
    '雲林縣': { lng: 120.4313, lat: 23.7092 },
    '嘉義市': { lng: 120.4491, lat: 23.4800 },
    '嘉義縣': { lng: 120.2929, lat: 23.4518 },
    '台南市': { lng: 120.1983, lat: 22.9997 },
    '臺南市': { lng: 120.1983, lat: 22.9997 },
    '高雄市': { lng: 120.3014, lat: 22.6273 },
    '屏東縣': { lng: 120.4879, lat: 22.6828 },
    '宜蘭縣': { lng: 121.7565, lat: 24.7021 },
    '花蓮縣': { lng: 121.6067, lat: 23.9871 },
    '台東縣': { lng: 121.1456, lat: 22.7583 },
    '臺東縣': { lng: 121.1456, lat: 22.7583 },
    '澎湖縣': { lng: 119.5793, lat: 23.5711 },
    '金門縣': { lng: 118.3226, lat: 24.4327 },
    '連江縣': { lng: 119.9499, lat: 26.1557 }
  };

  // --- 3. 世界主要國家與經濟體地理坐標 ---
  const WORLD_COUNTRIES_GEO = {
    '日本': { lng: 138.2529, lat: 36.2048 },
    'Japan': { lng: 138.2529, lat: 36.2048 },
    'JP': { lng: 138.2529, lat: 36.2048 },
    '台灣': { lng: 120.9605, lat: 23.6978 },
    'Taiwan': { lng: 120.9605, lat: 23.6978 },
    'TW': { lng: 120.9605, lat: 23.6978 },
    '美國': { lng: -95.7129, lat: 37.0902 },
    'United States': { lng: -95.7129, lat: 37.0902 },
    'USA': { lng: -95.7129, lat: 37.0902 },
    'US': { lng: -95.7129, lat: 37.0902 },
    '中國': { lng: 104.1954, lat: 35.8617 },
    'China': { lng: 104.1954, lat: 35.8617 },
    'CN': { lng: 104.1954, lat: 35.8617 },
    '德國': { lng: 10.4515, lat: 51.1657 },
    'Germany': { lng: 10.4515, lat: 51.1657 },
    'DE': { lng: 10.4515, lat: 51.1657 },
    '英國': { lng: -3.4360, lat: 55.3781 },
    'United Kingdom': { lng: -3.4360, lat: 55.3781 },
    'UK': { lng: -3.4360, lat: 55.3781 },
    '法國': { lng: 2.2137, lat: 46.2276 },
    'France': { lng: 2.2137, lat: 46.2276 },
    'FR': { lng: 2.2137, lat: 46.2276 },
    '韓國': { lng: 127.7669, lat: 35.9078 },
    'South Korea': { lng: 127.7669, lat: 35.9078 },
    'KR': { lng: 127.7669, lat: 35.9078 },
    '新加坡': { lng: 103.8198, lat: 1.3521 },
    'Singapore': { lng: 103.8198, lat: 1.3521 },
    'SG': { lng: 103.8198, lat: 1.3521 },
    '澳洲': { lng: 133.7751, lat: -25.2744 },
    'Australia': { lng: 133.7751, lat: -25.2744 },
    'AU': { lng: 133.7751, lat: -25.2744 },
    '加拿大': { lng: -106.3468, lat: 56.1304 },
    'Canada': { lng: -106.3468, lat: 56.1304 },
    'CA': { lng: -106.3468, lat: 56.1304 },
    '印度': { lng: 78.9629, lat: 20.5937 },
    'India': { lng: 78.9629, lat: 20.5937 },
    'IN': { lng: 78.9629, lat: 20.5937 },
    '越南': { lng: 108.2772, lat: 14.0583 },
    'Vietnam': { lng: 108.2772, lat: 14.0583 },
    '泰國': { lng: 100.9925, lat: 15.8700 },
    'Thailand': { lng: 100.9925, lat: 15.8700 }
  };

  // --- 4. 美國主要州坐標 ---
  const US_STATES_GEO = {
    'California': { lng: -119.4179, lat: 36.7783 },
    'CA': { lng: -119.4179, lat: 36.7783 },
    'Texas': { lng: -99.9018, lat: 31.9686 },
    'TX': { lng: -99.9018, lat: 31.9686 },
    'New York': { lng: -74.0060, lat: 40.7128 },
    'NY': { lng: -74.0060, lat: 40.7128 },
    'Florida': { lng: -81.5158, lat: 27.6648 },
    'FL': { lng: -81.5158, lat: 27.6648 },
    'Illinois': { lng: -89.3985, lat: 40.6331 },
    'IL': { lng: -89.3985, lat: 40.6331 },
    'Washington': { lng: -120.7401, lat: 47.7511 },
    'WA': { lng: -120.7401, lat: 47.7511 },
    'Massachusetts': { lng: -71.3824, lat: 42.4072 },
    'MA': { lng: -71.3824, lat: 42.4072 }
  };

  /**
   * 自動判斷資料集中出現的地理名稱屬於何種體系 (Japan, Taiwan, World, US, Coordinates, or Custom)
   */
  function detectGeoScope(names) {
    if (!names || names.length === 0) return 'unknown';

    let jpCount = 0;
    let twCount = 0;
    let worldCount = 0;
    let usCount = 0;

    names.forEach(raw => {
      const name = String(raw).trim();
      // 比對日本
      const matchJp = Object.keys(JAPAN_PREFECTURES_GEO).some(k => name.includes(k.replace(/[都府県]/, '')) || name === k);
      if (matchJp) jpCount++;

      // 比對台灣
      const matchTw = Object.keys(TAIWAN_COUNTIES_GEO).some(k => name.includes(k.replace(/[縣市]/, '')) || name === k);
      if (matchTw) twCount++;

      // 比對世界
      if (WORLD_COUNTRIES_GEO[name]) worldCount++;

      // 比對美國
      if (US_STATES_GEO[name]) usCount++;
    });

    const total = names.length;
    if (jpCount / total >= 0.4) return 'japan';
    if (twCount / total >= 0.4) return 'taiwan';
    if (worldCount / total >= 0.4) return 'world';
    if (usCount / total >= 0.4) return 'us';

    return 'custom';
  }

  /**
   * 根據地名取得坐標 [lng, lat]
   */
  function getCoordinatesForName(name, scope = 'japan') {
    const cleanName = String(name).trim();

    // 1. 若為日本
    if (scope === 'japan') {
      for (const [k, v] of Object.entries(JAPAN_PREFECTURES_GEO)) {
        if (cleanName === k || cleanName.includes(k.replace(/[都府県]/, '')) || k.includes(cleanName)) {
          return [v.lng, v.lat];
        }
      }
    }

    // 2. 若為台灣
    if (scope === 'taiwan') {
      for (const [k, v] of Object.entries(TAIWAN_COUNTIES_GEO)) {
        if (cleanName === k || cleanName.includes(k.replace(/[縣市]/, '')) || k.includes(cleanName)) {
          return [v.lng, v.lat];
        }
      }
    }

    // 3. 若為世界
    if (WORLD_COUNTRIES_GEO[cleanName]) {
      return [WORLD_COUNTRIES_GEO[cleanName].lng, WORLD_COUNTRIES_GEO[cleanName].lat];
    }

    // 4. 若為美國
    if (US_STATES_GEO[cleanName]) {
      return [US_STATES_GEO[cleanName].lng, US_STATES_GEO[cleanName].lat];
    }

    // 5. 跨庫兜底搜尋
    for (const [k, v] of Object.entries(JAPAN_PREFECTURES_GEO)) {
      if (cleanName.includes(k.replace(/[都府県]/, ''))) return [v.lng, v.lat];
    }
    for (const [k, v] of Object.entries(TAIWAN_COUNTIES_GEO)) {
      if (cleanName.includes(k.replace(/[縣市]/, ''))) return [v.lng, v.lat];
    }

    // 6. 自訂非標準地區：以雜湊值生成穩定均勻的投影坐標（保證不崩潰、隨機平鋪視覺化）
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = (hash << 5) - hash + cleanName.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const pseudoLng = 120 + (seed % 40) - 20;
    const pseudoLat = 25 + ((seed >> 4) % 30) - 15;
    return [pseudoLng, pseudoLat];
  }

  // 匯出至全域
  window.UniversalGeoEngine = {
    detectGeoScope,
    getCoordinatesForName,
    JAPAN_PREFECTURES_GEO,
    TAIWAN_COUNTIES_GEO,
    WORLD_COUNTRIES_GEO,
    US_STATES_GEO
  };

})();
