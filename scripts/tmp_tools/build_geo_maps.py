import urllib.request
import json
import math
import os

def p_dist(p, a, b):
    x, y = p[0], p[1]
    x1, y1 = a[0], a[1]
    x2, y2 = b[0], b[1]
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))

def rdp(points, tol):
    if len(points) <= 2:
        return points
    dmax = 0
    idx = 0
    for i in range(1, len(points) - 1):
        d = p_dist(points[i], points[0], points[-1])
        if d > dmax:
            idx = i
            dmax = d
    if dmax > tol:
        rec1 = rdp(points[:idx+1], tol)
        rec2 = rdp(points[idx:], tol)
        return rec1[:-1] + rec2
    else:
        return [points[0], points[-1]]

def simplify_geom(geom, tol):
    gt = geom['type']
    coords = geom['coordinates']
    if gt == 'Polygon':
        new_rings = []
        for ring in coords:
            s_ring = rdp(ring, tol)
            if len(s_ring) < 4:
                s_ring = ring[:4]
            new_rings.append([[round(c[0], 4), round(c[1], 4)] for c in s_ring])
        return {'type': gt, 'coordinates': new_rings}
    elif gt == 'MultiPolygon':
        new_polys = []
        for poly in coords:
            new_rings = []
            for ring in poly:
                s_ring = rdp(ring, tol)
                if len(s_ring) < 4:
                    s_ring = ring[:4]
                new_rings.append([[round(c[0], 4), round(c[1], 4)] for c in s_ring])
            new_polys.append(new_rings)
        return {'type': gt, 'coordinates': new_polys}
    return geom

print('Fetching Japan GeoJSON...')
req_jp = urllib.request.Request('https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson', headers={'User-Agent': 'Mozilla/5.0'})
raw_jp = json.loads(urllib.request.urlopen(req_jp).read())
for f in raw_jp['features']:
    f['properties']['name'] = f['properties']['nam_ja']
    f['geometry'] = simplify_geom(f['geometry'], 0.02)

print('Fetching Taiwan GeoJSON...')
req_tw = urllib.request.Request('https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json', headers={'User-Agent': 'Mozilla/5.0'})
raw_tw = json.loads(urllib.request.urlopen(req_tw).read())
for f in raw_tw['features']:
    name = f['properties'].get('COUNTYNAME', '')
    if name == '桃園縣':
        name = '桃園市'
    f['properties']['name'] = name
    f['geometry'] = simplify_geom(f['geometry'], 0.015)

jp_json_str = json.dumps(raw_jp, ensure_ascii=False, separators=(',', ':'))
tw_json_str = json.dumps(raw_tw, ensure_ascii=False, separators=(',', ':'))

output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'js', 'universal_geo_maps.js')
output_path = os.path.abspath(output_path)

header = """/**
 * Universal Geo Maps for Data Atoms Studio
 * 內建日本 47 都道府縣與台灣 22 縣市真實地理向量輪廓 (Client-only Zero-build)
 * 自動註冊至 ECharts 地圖系統 (echarts.registerMap)
 */
(function() {
  'use strict';

  const JAPAN_GEOJSON = """

middle = """;

  const TAIWAN_GEOJSON = """

footer = """;

  function registerMaps() {
    if (typeof echarts !== 'undefined' && typeof echarts.registerMap === 'function') {
      try {
        echarts.registerMap('japan', JAPAN_GEOJSON);
        echarts.registerMap('taiwan', TAIWAN_GEOJSON);
        echarts.registerMap('jp', JAPAN_GEOJSON);
        echarts.registerMap('tw', TAIWAN_GEOJSON);
        echarts.registerMap('日本', JAPAN_GEOJSON);
        echarts.registerMap('台灣', TAIWAN_GEOJSON);
      } catch (err) {
        console.warn('[UniversalGeoMaps] Failed to register maps in ECharts:', err);
      }
    }
  }

  // 立即註冊或延遲註冊
  registerMaps();
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', registerMaps);
    window.UniversalGeoMaps = {
      japan: JAPAN_GEOJSON,
      taiwan: TAIWAN_GEOJSON,
      registerMaps: registerMaps
    };
  }
})();
"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(header + jp_json_str + middle + tw_json_str + footer)

print(f'{output_path} generated successfully! Size: {os.path.getsize(output_path) / 1024:.2f} KB')
