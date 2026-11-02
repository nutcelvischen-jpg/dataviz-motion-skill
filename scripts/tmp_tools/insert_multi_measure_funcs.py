# -*- coding: utf-8 -*-
with open('js/pygwalker_data_atoms.js', 'r', encoding='utf-8') as f:
    js = f.read()

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
    const finalMeasures = [];
    measureList.forEach(m => {
      if (state.measures.includes(m)) {
        finalMeasures.push(m);
      } else {
        const cleanM = m.replace(/[佔占]/g, '占');
        const alt = state.measures.find(x => x.replace(/[佔占]/g, '占').includes(cleanM.slice(0, 4)));
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

anchor = "  // --- 暴露給全域供點擊調用 ---"
idx = js.find(anchor)
if idx != -1:
    js = js[:idx] + modal_helpers + "\n" + js[idx:]
    with open('js/pygwalker_data_atoms.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Inserted modal_helpers successfully!")
else:
    print("Anchor not found!")
