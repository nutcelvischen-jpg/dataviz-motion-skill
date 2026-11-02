# -*- coding: utf-8 -*-
with open('js/pygwalker_data_atoms.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update bar in renderECharts
old_bar_block = """    if (state.chartType === 'bar') {
      option.xAxis = {
        type: 'category',
        data: xVals,
        axisLabel: {
          rotate: xVals.length > 15 ? 40 : 0,
          color: '#475569',
          fontSize: 11
        }
      };
      option.yAxis = [
        {
          type: 'value',
          name: yField,
          axisLabel: {
            formatter: (v) => formatCompactNumber(v)
          }
        }
      ];

      // 若有設定顏色分組，按分組上色
      const seriesList = [];
      if (colorField && state.dimensions.includes(colorField)) {
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
      if (secField && state.measures.includes(secField)) {
        option.yAxis.push({
          type: 'value',
          name: secField,
          position: 'right',
          axisLabel: { formatter: '{value}' }
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
        { type: 'slider', bottom: 10, height: 18 }
      ];"""

new_bar_block = """    if (state.chartType === 'bar') {
      const isMulti = state.shelf.yMulti && state.shelf.yMulti.length > 1;
      const activeMeasures = isMulti ? state.shelf.yMulti : [yField];

      option.xAxis = {
        type: 'category',
        data: xVals,
        axisLabel: {
          rotate: xVals.length > 15 ? 40 : 0,
          color: '#475569',
          fontSize: 11
        }
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
          axisLabel: { formatter: '{value}' }
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
        { type: 'slider', bottom: 10, height: 18 }
      ];"""

if old_bar_block in js:
    js = js.replace(old_bar_block, new_bar_block, 1)

# 2. Update line in renderECharts
old_line_block = """    } else if (state.chartType === 'line') {
      option.xAxis = {
        type: 'category',
        data: xVals,
        boundaryGap: false,
        axisLabel: { color: '#475569' }
      };
      option.yAxis = [
        {
          type: 'value',
          name: yField,
          axisLabel: { formatter: (v) => formatCompactNumber(v) }
        }
      ];

      const seriesList = [
        {
          name: yField,
          type: 'line',
          smooth: true,
          data: yVals,
          itemStyle: { color: '#2563eb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(37, 99, 235, 0.4)' },
              { offset: 1, color: 'rgba(37, 99, 235, 0.02)' }
            ])
          },
          markLine: state.showAverage ? {
            data: [{ type: 'average', name: '平均線' }]
          } : undefined
        }
      ];

      if (secField && state.measures.includes(secField)) {
        option.yAxis.push({
          type: 'value',
          name: secField,
          position: 'right'
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
      option.dataZoom = [{ type: 'inside' }, { type: 'slider', bottom: 10, height: 18 }];"""

new_line_block = """    } else if (state.chartType === 'line') {
      const isMulti = state.shelf.yMulti && state.shelf.yMulti.length > 1;
      const activeMeasures = isMulti ? state.shelf.yMulti : [yField];

      option.xAxis = {
        type: 'category',
        data: xVals,
        boundaryGap: false,
        axisLabel: { color: '#475569' }
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

      const seriesList = activeMeasures.map((m, idx) => {
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

      if (!isMulti && secField && state.measures.includes(secField)) {
        option.yAxis.push({
          type: 'value',
          name: secField,
          position: 'right'
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
      option.dataZoom = [{ type: 'inside' }, { type: 'slider', bottom: 10, height: 18 }];"""

if old_line_block in js:
    js = js.replace(old_line_block, new_line_block, 1)

# 3. Update scatter in renderECharts to compare Measure 1 vs Measure 2
old_scatter_start = """    } else if (state.chartType === 'scatter') {
      // 散佈/氣泡矩陣
      option.tooltip = {
        formatter: (params) => {
          const item = params.data.raw;
          let tip = `<strong>${item[state.dimensions[0] || xField] || ''}</strong><br/>`;
          tip += `${xField}: ${params.data.value[0].toLocaleString()}<br/>`;
          tip += `${yField}: ${params.data.value[1].toLocaleString()}<br/>`;"""

new_scatter_start = """    } else if (state.chartType === 'scatter') {
      // 散佈/氣泡矩陣 (支援多指標對比模式：指標1 vs 指標2)
      const isMulti = state.shelf.yMulti && state.shelf.yMulti.length >= 2;
      const actXField = isMulti ? state.shelf.yMulti[0] : xField;
      const actYField = isMulti ? state.shelf.yMulti[1] : yField;

      option.tooltip = {
        formatter: (params) => {
          const item = params.data.raw;
          let tip = `<strong>${item[state.dimensions[0] || xField] || ''}</strong><br/>`;
          tip += `${actXField}: ${Number(params.data.value[0]).toLocaleString()}<br/>`;
          tip += `${actYField}: ${Number(params.data.value[1]).toLocaleString()}<br/>`;"""

if old_scatter_start in js:
    js = js.replace(old_scatter_start, new_scatter_start, 1)

# Also update xAxis/yAxis and scatter data map
old_scatter_axes = """      option.xAxis = {
        type: 'value',
        name: xField,
        scale: true,
        axisLabel: { formatter: (v) => formatCompactNumber(v) }
      };
      option.yAxis = {
        type: 'value',
        name: yField,
        scale: true
      };

      // 計算氣泡大小基準
      let maxVal = 1;
      if (sizeField && state.measures.includes(sizeField)) {
        maxVal = Math.max(...data.map(d => Number(d[sizeField] || 0))) || 1;
      }

      const scatterData = data.map(d => {
        const x = Number(d[xField] || 0);
        const y = Number(d[yField] || 0);"""

new_scatter_axes = """      option.xAxis = {
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
        maxVal = Math.max(...data.map(d => Number(d[sizeField] || 0))) || 1;
      }

      const scatterData = data.map(d => {
        const x = Number(d[actXField] || 0);
        const y = Number(d[actYField] || 0);"""

if old_scatter_axes in js:
    js = js.replace(old_scatter_axes, new_scatter_axes, 1)

with open('js/pygwalker_data_atoms.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated renderECharts multi-measure logic in js/pygwalker_data_atoms.js successfully!")
