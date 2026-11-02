# -*- coding: utf-8 -*-
with open('js/pygwalker_data_atoms.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Add yMulti to state.shelf
if 'yMulti: []' not in js:
    js = js.replace(
        "shelf: {\n      x: '都道府縣',\n      y: '總人口(人)',",
        "shelf: {\n      x: '都道府縣',\n      y: '總人口(人)',\n      yMulti: [], // 多指標並列對比陣列",
        1
    )

# 2. Add row auto-enrichment in loadDataset
enrich_code = """    // 自動補齊標準化人口結構比率 (確保 47都道府縣 與 50年時序 皆可直接對比 幼年 vs 勞動人口占比)
    state.rawRows.forEach(r => {
      if (r['幼年人口占比(%)'] === undefined) {
        const val = r['幼年人口佔比(%)'] != null ? r['幼年人口佔比(%)']
          : (r['幼年人口率(%)'] != null ? r['幼年人口率(%)']
          : (r['0-14歲幼年人口(人)'] && r['總人口(人)'] ? parseFloat(((Number(r['0-14歲幼年人口(人)']) / Number(r['總人口(人)'])) * 100).toFixed(2)) : undefined));
        if (val !== undefined) r['幼年人口占比(%)'] = Number(val);
      }
      if (r['勞動人口占比(%)'] === undefined) {
        const val = r['勞動人口佔比(%)'] != null ? r['勞動人口佔比(%)']
          : (r['15-64歲勞動力人口(人)'] && r['總人口(人)'] ? parseFloat(((Number(r['15-64歲勞動力人口(人)']) / Number(r['總人口(人)'])) * 100).toFixed(2))
          : (r['15-64歲勞動人口(人)'] && r['全國總人口(人)'] ? parseFloat(((Number(r['15-64歲勞動人口(人)']) / Number(r['全國總人口(人)'])) * 100).toFixed(2)) : undefined));
        if (val !== undefined) r['勞動人口占比(%)'] = Number(val);
      }
      if (r['老年人口占比(%)'] === undefined) {
        const val = r['高齡化率(%)'] != null ? r['高齡化率(%)']
          : (r['65歲以上高齡人口(人)'] && r['總人口(人)'] ? parseFloat(((Number(r['65歲以上高齡人口(人)']) / Number(r['總人口(人)'])) * 100).toFixed(2)) : undefined);
        if (val !== undefined) r['老年人口占比(%)'] = Number(val);
      }
    });
"""

if '自動補齊標準化人口結構比率' not in js:
    js = js.replace(
        "    state.rawRows = JSON.parse(JSON.stringify(target.data));\n    \n    // 分析欄位綱要",
        "    state.rawRows = JSON.parse(JSON.stringify(target.data));\n    \n" + enrich_code + "\n    // 分析欄位綱要",
        1
    )

# 3. Replace renderSingleShelf to support yMulti
old_rss = """  function renderSingleShelf(elemId, shelfKey, currentField, placeholderText) {
    const container = document.getElementById(elemId);
    if (!container) return;

    if (!currentField) {
      container.innerHTML = `<span class="shelf-placeholder">${placeholderText}</span>`;
      container.classList.remove('has-field');
    } else {
      container.classList.add('has-field');
      const isMeasure = state.measures.includes(currentField);
      const badge = isMeasure ? '#' : 'T';
      const pillClass = isMeasure ? 'measure' : 'dimension';
      
      let aggHtml = '';
      if (isMeasure && shelfKey === 'y') {
        aggHtml = `<span class="shelf-agg-badge" onclick="window.PyGWalker.cycleAgg(event)" title="點擊切換聚合方式 (RAW ➔ SUM ➔ MEAN ➔ MAX ➔ MIN)">[${state.shelf.agg}]</span>`;
      }

      container.innerHTML = `
        <div class="shelf-pill ${pillClass}">
          <span class="field-type-badge">${badge}</span>
          ${aggHtml}
          <span class="shelf-pill-name">${currentField}</span>
          <button type="button" class="shelf-pill-remove" onclick="window.PyGWalker.clearShelf('${shelfKey}')" title="移除此槽位欄位">✕</button>
        </div>
      `;
    }
  }"""

new_rss = """  function renderSingleShelf(elemId, shelfKey, currentField, placeholderText) {
    const container = document.getElementById(elemId);
    if (!container) return;

    if (shelfKey === 'y' && state.shelf.yMulti && state.shelf.yMulti.length > 0) {
      container.classList.add('has-field');
      let pillsHtml = state.shelf.yMulti.map((f, idx) => {
        const color = PALETTE[idx % PALETTE.length];
        return `
          <div class="shelf-pill measure" style="border-left: 3px solid ${color};">
            <span class="field-type-badge">#</span>
            <span class="shelf-pill-name" style="font-weight: 600;">${escapeHtml(f)}</span>
            <button type="button" class="shelf-pill-remove" onclick="window.PyGWalker.removeMultiMeasure('${escapeHtml(f)}')" title="移除此對比指標">✕</button>
          </div>
        `;
      }).join('');

      pillsHtml += `
        <button type="button" class="btn btn-sm btn-outline btn-shelf-compare" onclick="window.PyGWalker.openMultiMeasureModal()" title="調整或增加對比指標" style="margin-left: 4px; padding: 2px 8px; font-size: 11px; font-weight: 700; border-color: #ea580c; color: #c2410c; background: #fff7ed; border-radius: 4px;">
          ⚡ 多指標對比 (${state.shelf.yMulti.length})
        </button>
      `;
      container.innerHTML = pillsHtml;
      return;
    }

    if (!currentField) {
      container.innerHTML = `<span class="shelf-placeholder">${placeholderText}</span>`;
      container.classList.remove('has-field');
    } else {
      container.classList.add('has-field');
      const isMeasure = state.measures.includes(currentField);
      const badge = isMeasure ? '#' : 'T';
      const pillClass = isMeasure ? 'measure' : 'dimension';
      
      let aggHtml = '';
      if (isMeasure && shelfKey === 'y') {
        aggHtml = `<span class="shelf-agg-badge" onclick="window.PyGWalker.cycleAgg(event)" title="點擊切換聚合方式 (RAW ➔ SUM ➔ MEAN ➔ MAX ➔ MIN)">[${state.shelf.agg}]</span>`;
      }

      let extraCompareBtn = '';
      if (shelfKey === 'y') {
        extraCompareBtn = `
          <button type="button" class="btn btn-sm btn-outline btn-shelf-compare" onclick="window.PyGWalker.openMultiMeasureModal()" title="開啟多數值指標並列比較 (幼年 vs 勞動占比等)" style="margin-left: 6px; padding: 2px 7px; font-size: 11px; font-weight: 600; border-color: #cbd5e1; color: #475569; background: #fff; border-radius: 4px;">
            ＋ 多指標比較
          </button>
        `;
      }

      container.innerHTML = `
        <div class="shelf-pill ${pillClass}">
          <span class="field-type-badge">${badge}</span>
          ${aggHtml}
          <span class="shelf-pill-name">${escapeHtml(currentField)}</span>
          <button type="button" class="shelf-pill-remove" onclick="window.PyGWalker.clearShelf('${shelfKey}')" title="移除此槽位欄位">✕</button>
        </div>
        ${extraCompareBtn}
      `;
    }
  }"""

if old_rss in js:
    js = js.replace(old_rss, new_rss, 1)

# 4. Multi-measure modal functions and window.PyGWalker export
modal_helpers = """
  // --- 多指標並列對比管理器 (Multi-Measure Comparison Manager) ---
  function openMultiMeasureModal() {
    const modal = document.getElementById('multiMeasureModal');
    const container = document.getElementById('multiMeasureCheckboxList');
    if (!modal || !container) return;

    // 渲染可用連續指標勾選框
    const selectedSet = new Set(
      state.shelf.yMulti && state.shelf.yMulti.length > 0 
        ? state.shelf.yMulti 
        : (state.shelf.y ? [state.shelf.y] : [])
    );

    container.innerHTML = state.measures.map(m => {
      const isChecked = selectedSet.has(m) ? 'checked' : '';
      return `
        <label style="display: flex; align-items: center; gap: 7px; font-size: 12.5px; padding: 4px 6px; border-radius: 4px; cursor: pointer; user-select: none;">
          <input type="checkbox" value="${escapeHtml(m)}" ${isChecked} class="chk-multi-measure" style="cursor: pointer;">
          <span style="font-weight: 500; color: #1e293b;">${escapeHtml(m)}</span>
        </label>
      `;
    }).join('');

    modal.classList.add('open');
  }

  function confirmMultiMeasure() {
    const checkboxes = document.querySelectorAll('.chk-multi-measure:checked');
    const selected = Array.from(checkboxes).map(c => c.value);
    const modal = document.getElementById('multiMeasureModal');

    if (selected.length === 0) {
      showToast('⚠️ 請至少選取 1 個數值指標');
      return;
    }

    if (selected.length === 1) {
      state.shelf.y = selected[0];
      state.shelf.yMulti = [];
    } else {
      state.shelf.y = selected[0];
      state.shelf.yMulti = selected;
    }

    if (modal) modal.classList.remove('open');
    renderShelves();
    renderVisualization();
    showToast(`⚡ 已套用 ${selected.length} 項指標並列比較！已更新圖表。`);
  }

  function applyMeasurePreset(measureList) {
    // 檢查指標是否存於當前資料集，若不存在則尋找近義欄位
    const finalMeasures = [];
    measureList.forEach(m => {
      if (state.measures.includes(m)) {
        finalMeasures.push(m);
      } else {
        const alt = state.measures.find(x => x.replace(/[佔占]/g, '占').includes(m.replace(/[佔占]/g, '占').slice(0, 4)));
        if (alt) finalMeasures.push(alt);
      }
    });

    if (finalMeasures.length >= 2) {
      state.shelf.y = finalMeasures[0];
      state.shelf.yMulti = finalMeasures;
      const modal = document.getElementById('multiMeasureModal');
      if (modal) modal.classList.remove('open');
      renderShelves();
      renderVisualization();
      showToast(`🌟 已成功套用預設對比組合：${finalMeasures.join(' vs ')}！`);
    } else {
      showToast('⚠️ 當前資料集欄位不完全包含此組合，請手動自選指標。');
    }
  }

  function resetMultiMeasure() {
    state.shelf.yMulti = [];
    const modal = document.getElementById('multiMeasureModal');
    if (modal) modal.classList.remove('open');
    renderShelves();
    renderVisualization();
    showToast('已重設為單一指標模式。');
  }

  function removeMultiMeasure(fieldName) {
    if (!state.shelf.yMulti) return;
    state.shelf.yMulti = state.shelf.yMulti.filter(m => m !== fieldName);
    if (state.shelf.yMulti.length === 1) {
      state.shelf.y = state.shelf.yMulti[0];
      state.shelf.yMulti = [];
    } else if (state.shelf.yMulti.length === 0 && !state.shelf.y) {
      state.shelf.y = state.measures[0] || '';
    }
    renderShelves();
    renderVisualization();
  }
"""

if 'openMultiMeasureModal' not in js:
    js = js.replace(
        "  // --- 暴露給全域供點擊調用 ---",
        modal_helpers + "\n  // --- 暴露給全域供點擊調用 ---",
        1
    )

# 5. Export to window.PyGWalker
pyg_export = """    openMultiMeasureModal: () => {
      openMultiMeasureModal();
    },
    confirmMultiMeasure: () => {
      confirmMultiMeasure();
    },
    applyMeasurePreset: (measureList) => {
      applyMeasurePreset(measureList);
    },
    resetMultiMeasure: () => {
      resetMultiMeasure();
    },
    removeMultiMeasure: (fieldName) => {
      removeMultiMeasure(fieldName);
    },"""

if 'openMultiMeasureModal:' not in js:
    js = js.replace(
        "window.PyGWalker = {",
        "window.PyGWalker = {\n" + pyg_export,
        1
    )

with open('js/pygwalker_data_atoms.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Patched js/pygwalker_data_atoms.js successfully!")
