/* Random Color Palette Generator
   - Vanilla JS, modular functions, minimal comments
*/

(() => {
  'use strict';

  const PALETTE_SIZE = 5;
  const HISTORY_LIMIT = 12;
  const STORAGE_KEYS = {
    saved: 'rcpg:saved-palettes:v1',
    theme: 'rcpg:theme:v1'
  };

  const els = {
    palette: document.getElementById('palette'),
    generateBtn: document.getElementById('generateBtn'),
    saveBtn: document.getElementById('saveBtn'),
    history: document.getElementById('history'),
    saved: document.getElementById('saved'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    clearSavedBtn: document.getElementById('clearSavedBtn'),
    toast: document.getElementById('toast'),
    themeToggle: document.getElementById('themeToggle'),
    exportDropdown: document.getElementById('exportDropdown'),
    exportBtn: document.getElementById('exportBtn')
  };

  const state = {
    palette: [],
    locked: new Array(PALETTE_SIZE).fill(false),
    selectedIndex: 0,
    history: [],
    saved: [],
    toastTimer: null
  };

  // -------- Color utilities --------

  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  function hexToRgb(hex) {
    const clean = hex.replace('#', '').trim();
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean;
    const int = parseInt(full, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    };
  }

  function rgbToHex({ r, g, b }) {
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function rgbToHsl({ r, g, b }) {
    let rr = r / 255, gg = g / 255, bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const d = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case rr: h = ((gg - bb) / d) % 6; break;
        case gg: h = (bb - rr) / d + 2; break;
        case bb: h = (rr - gg) / d + 4; break;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    return { h, s, l };
  }

  function hslToRgb({ h, s, l }) {
    const C = (1 - Math.abs(2 * l - 1)) * s;
    const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - C / 2;
    let r1 = 0, g1 = 0, b1 = 0;

    if (h >= 0 && h < 60) [r1, g1, b1] = [C, X, 0];
    else if (h < 120) [r1, g1, b1] = [X, C, 0];
    else if (h < 180) [r1, g1, b1] = [0, C, X];
    else if (h < 240) [r1, g1, b1] = [0, X, C];
    else if (h < 300) [r1, g1, b1] = [X, 0, C];
    else [r1, g1, b1] = [C, 0, X];

    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255)
    };
  }

  // Relative luminance per WCAG
  function luminance({ r, g, b }) {
    const srgb = [r, g, b].map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function contrastRatio(hexA, hexB) {
    const L1 = luminance(hexToRgb(hexA));
    const L2 = luminance(hexToRgb(hexB));
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function bestTextColor(bgHex) {
    const white = '#FFFFFF';
    const black = '#0B1220';
    return contrastRatio(bgHex, white) >= contrastRatio(bgHex, black) ? white : black;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0];
  }

  function generateNicePalette(existingLocked) {
    const rnd = mulberry32(randomSeed());

    // Base hue and a gentle spread for pleasing variation
    const baseHue = rnd() * 360;
    const spread = 22 + rnd() * 28; // 22..50
    const hueJitter = () => (rnd() - 0.5) * 10; // subtle variance

    // Balanced saturation/lightness with small deviations
    const baseS = 0.62 + rnd() * 0.22; // 0.62..0.84
    const baseL = 0.48 + rnd() * 0.10; // 0.48..0.58

    const colors = new Array(PALETTE_SIZE);

    for (let i = 0; i < PALETTE_SIZE; i++) {
      if (existingLocked && existingLocked[i] && state.palette[i]) {
        colors[i] = state.palette[i];
        continue;
      }

      const h = (baseHue + spread * i + hueJitter() + 360) % 360;
      const s = clamp01(baseS - (i === 0 || i === 4 ? 0.08 : 0) + (rnd() - 0.5) * 0.10);
      const l = clamp01(baseL + (i - 2) * 0.04 + (rnd() - 0.5) * 0.08);

      const rgb = hslToRgb({ h, s, l });
      colors[i] = rgbToHex(rgb);
    }

    // Ensure at least one deep and one light-ish for usability
    // (Only adjust unlocked slots)
    const ensureIdx = (idx, targetL) => {
      if (existingLocked && existingLocked[idx]) return;
      const hsl = rgbToHsl(hexToRgb(colors[idx]));
      const rgb = hslToRgb({ h: hsl.h, s: clamp01(hsl.s), l: clamp01(targetL) });
      colors[idx] = rgbToHex(rgb);
    };

    ensureIdx(0, 0.28 + rnd() * 0.06);
    ensureIdx(4, 0.78 - rnd() * 0.06);

    return colors;
  }

  // -------- Storage helpers --------

  function safeParseJSON(value, fallback) {
    try {
      if (!value) return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function loadSavedPalettes() {
    const raw = localStorage.getItem(STORAGE_KEYS.saved);
    const parsed = safeParseJSON(raw, []);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(p => Array.isArray(p) && p.length === PALETTE_SIZE && p.every(x => typeof x === 'string'))
      .map(p => p.map(x => x.toUpperCase()));
  }

  function persistSaved() {
    try {
      localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(state.saved));
    } catch {
      showToast('Storage unavailable');
    }
  }

  function loadTheme() {
    const t = localStorage.getItem(STORAGE_KEYS.theme);
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function persistTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // ignore
    }
  }

  // -------- UI --------

  function showToast(message) {
    if (!message) return;
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    state.toastTimer = setTimeout(() => {
      els.toast.classList.remove('show');
    }, 1300);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }

  function paletteKey(p) {
    return p.join('-');
  }

  function setBackgroundGradientFromPalette(palette) {
    const c1 = palette[0];
    const c2 = palette[2];
    const c3 = palette[4];
    const root = document.documentElement;
    root.style.setProperty('--bg0', c1);
    root.style.setProperty('--bg1', c3);

    document.body.style.background =
      `radial-gradient(1200px 700px at 18% 12%, ${withAlpha(c1, 0.22)}, transparent 60%),
       radial-gradient(1200px 800px at 85% 28%, ${withAlpha(c2, 0.18)}, transparent 55%),
       linear-gradient(135deg, ${withAlpha(c3, 0.10)}, color-mix(in oklab, var(--app-bg) 78%, #ffffff 22%))`;
  }

  function withAlpha(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function renderPalette() {
    els.palette.innerHTML = '';

    state.palette.forEach((hex, i) => {
      const card = document.createElement('article');
      card.className = 'color-card';
      card.dataset.index = String(i);
      if (i === state.selectedIndex) card.classList.add('selected');

      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.setProperty('--swatch', hex);
      swatch.title = `Select color ${i + 1}`;

      const footer = document.createElement('div');
      footer.className = 'card-footer';

      const hexBtn = document.createElement('button');
      hexBtn.type = 'button';
      hexBtn.className = 'hex';
      hexBtn.textContent = hex;
      hexBtn.setAttribute('aria-label', `Copy ${hex}`);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const contrastDot = document.createElement('span');
      contrastDot.className = 'contrast';
      const text = bestTextColor(hex);
      contrastDot.style.setProperty('--contrast', text);
      contrastDot.title = `Best text: ${text === '#FFFFFF' ? 'white' : 'dark'}`;

      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.className = 'lock';
      lockBtn.setAttribute('aria-label', state.locked[i] ? 'Unlock color' : 'Lock color');
      lockBtn.setAttribute('aria-pressed', state.locked[i] ? 'true' : 'false');
      lockBtn.innerHTML = state.locked[i]
        ? svgLockClosed()
        : svgLockOpen();

      meta.appendChild(contrastDot);
      meta.appendChild(lockBtn);

      footer.appendChild(hexBtn);
      footer.appendChild(meta);

      card.appendChild(swatch);
      card.appendChild(footer);
      els.palette.appendChild(card);

      // Smooth change animation (subtle)
      requestAnimationFrame(() => {
        swatch.style.filter = 'saturate(1.02)';
        setTimeout(() => { swatch.style.filter = ''; }, 240);
      });

      swatch.addEventListener('click', () => setSelectedIndex(i));
      card.addEventListener('click', (e) => {
        if (e.target === swatch) return;
        if (e.target === hexBtn || e.target === lockBtn) return;
        setSelectedIndex(i);
      });

      hexBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await copyToClipboard(hex);
        showToast(ok ? `Copied ${hex}` : 'Copy failed');
      });

      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLock(i);
      });
    });
  }

  function setSelectedIndex(i) {
    const idx = Math.max(0, Math.min(PALETTE_SIZE - 1, i));
    state.selectedIndex = idx;
    [...els.palette.querySelectorAll('.color-card')].forEach((card, n) => {
      card.classList.toggle('selected', n === idx);
    });
  }

  function toggleLock(i) {
    state.locked[i] = !state.locked[i];
    renderPalette();
    showToast(state.locked[i] ? 'Color locked' : 'Color unlocked');
  }

  function renderHistory() {
    els.history.innerHTML = '';
    if (state.history.length === 0) {
      els.history.appendChild(emptyState('No recent palettes yet.'));
      return;
    }

    state.history.forEach((palette) => {
      const row = renderPaletteRow(palette, { kind: 'history' });
      els.history.appendChild(row);
    });
  }

  function renderSaved() {
    els.saved.innerHTML = '';
    if (state.saved.length === 0) {
      els.saved.appendChild(emptyState('No saved palettes.'));
      return;
    }

    state.saved.forEach((palette, idx) => {
      const row = renderPaletteRow(palette, { kind: 'saved', index: idx });
      els.saved.appendChild(row);
    });
  }

  function emptyState(text) {
    const div = document.createElement('div');
    div.className = 'row';
    div.style.justifyContent = 'center';
    div.style.color = 'var(--app-muted)';
    div.style.fontWeight = '600';
    div.textContent = text;
    return div;
  }

  function renderPaletteRow(palette, meta) {
    const row = document.createElement('div');
    row.className = 'row';

    const mini = document.createElement('div');
    mini.className = 'mini';
    palette.forEach((hex) => {
      const s = document.createElement('span');
      s.style.background = hex;
      mini.appendChild(s);
    });

    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'icon-btn';
    applyBtn.title = 'Apply palette';
    applyBtn.innerHTML = svgArrow();

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'icon-btn';
    copyBtn.title = 'Copy full palette';
    copyBtn.innerHTML = svgCopy();

    actions.appendChild(applyBtn);
    actions.appendChild(copyBtn);

    if (meta.kind === 'saved') {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'icon-btn';
      delBtn.title = 'Remove';
      delBtn.innerHTML = svgTrash();
      actions.appendChild(delBtn);

      delBtn.addEventListener('click', () => {
        state.saved.splice(meta.index, 1);
        persistSaved();
        renderSaved();
        showToast('Removed');
      });
    }

    applyBtn.addEventListener('click', () => {
      state.palette = palette.slice();
      // Keep locks, but do not mutate locked palette values
      setBackgroundGradientFromPalette(state.palette);
      renderPalette();
      showToast('Applied');
    });

    copyBtn.addEventListener('click', async () => {
      const ok = await copyToClipboard(palette.join(', '));
      showToast(ok ? 'Copied palette' : 'Copy failed');
    });

    row.appendChild(mini);
    row.appendChild(actions);
    return row;
  }

  // -------- Actions --------

  function pushHistory(palette) {
    const key = paletteKey(palette);
    const existingIdx = state.history.findIndex(p => paletteKey(p) === key);
    if (existingIdx !== -1) state.history.splice(existingIdx, 1);
    state.history.unshift(palette.slice());
    if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
    renderHistory();
  }

  function generatePalette() {
    const next = generateNicePalette(state.locked);
    state.palette = next;
    setBackgroundGradientFromPalette(state.palette);
    renderPalette();
    pushHistory(state.palette);
  }

  function saveCurrentPalette() {
    const key = paletteKey(state.palette);
    if (state.saved.some(p => paletteKey(p) === key)) {
      showToast('Already saved');
      return;
    }
    state.saved.unshift(state.palette.slice());
    persistSaved();
    renderSaved();
    showToast('Saved');
  }

  function exportPalette(type) {
    const p = state.palette.slice();
    if (type === 'css') {
      const lines = p.map((hex, i) => `  --color-${i + 1}: ${hex};`);
      const text = `:root\n{\n${lines.join('\n')}\n}`;
      copyToClipboard(text).then(ok => showToast(ok ? 'Copied CSS variables' : 'Copy failed'));
      return;
    }

    if (type === 'json') {
      const payload = {
        colors: p,
        locked: state.locked.slice(),
        generatedAt: new Date().toISOString()
      };
      copyToClipboard(JSON.stringify(payload, null, 2)).then(ok => showToast(ok ? 'Copied JSON' : 'Copy failed'));
      return;
    }

    // all
    const text = [
      `Palette: ${p.join(' ')}`,
      '',
      'CSS Variables:',
      `:root\n{\n${p.map((hex, i) => `  --color-${i + 1}: ${hex};`).join('\n')}\n}`,
      '',
      'JSON:',
      JSON.stringify({ colors: p }, null, 2)
    ].join('\n');

    copyToClipboard(text).then(ok => showToast(ok ? 'Copied full palette' : 'Copy failed'));
  }

  // -------- Keyboard shortcuts --------

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  function onKeyDown(e) {
    if (isTypingTarget(e.target)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      generatePalette();
      return;
    }

    if (e.key >= '1' && e.key <= '5') {
      setSelectedIndex(parseInt(e.key, 10) - 1);
      return;
    }

    if (e.key === 'l' || e.key === 'L') {
      toggleLock(state.selectedIndex);
      return;
    }

    if (e.key === 'c' || e.key === 'C') {
      const hex = state.palette[state.selectedIndex];
      copyToClipboard(hex).then(ok => showToast(ok ? `Copied ${hex}` : 'Copy failed'));
    }
  }

  // -------- Dropdown --------

  function closeExportMenu() {
    els.exportDropdown.classList.remove('open');
    els.exportBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleExportMenu() {
    const open = els.exportDropdown.classList.toggle('open');
    els.exportBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // -------- SVG icons --------

  function svgLockClosed() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  function svgLockOpen() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9 11V8a5 5 0 0 1 9.5-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  function svgCopy() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M9 9h10v10H9V9Z" stroke="currentColor" stroke-width="2"/>
        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="2"/>
      </svg>`;
  }

  function svgTrash() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 7l1 14h10l1-14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M9 7V4h6v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  function svgArrow() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 10l5-5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
  }

  // -------- Init --------

  function initTheme() {
    const theme = loadTheme();
    document.documentElement.dataset.theme = theme;
    els.themeToggle.checked = theme === 'dark';
    els.themeToggle.addEventListener('change', () => {
      const next = els.themeToggle.checked ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      persistTheme(next);
    });
  }

  function bindUI() {
    els.generateBtn.addEventListener('click', generatePalette);
    els.saveBtn.addEventListener('click', saveCurrentPalette);

    els.clearHistoryBtn.addEventListener('click', () => {
      state.history = [];
      renderHistory();
      showToast('History cleared');
    });

    els.clearSavedBtn.addEventListener('click', () => {
      state.saved = [];
      persistSaved();
      renderSaved();
      showToast('Saved cleared');
    });

    els.exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleExportMenu();
    });

    els.exportDropdown.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-export');
        closeExportMenu();
        exportPalette(type);
      });
    });

    document.addEventListener('click', (e) => {
      if (!els.exportDropdown.contains(e.target)) closeExportMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeExportMenu();
    });

    window.addEventListener('keydown', onKeyDown, { passive: false });
  }

  function init() {
    initTheme();
    state.saved = loadSavedPalettes();
    renderSaved();
    renderHistory();

    state.palette = generateNicePalette(null);
    setBackgroundGradientFromPalette(state.palette);
    renderPalette();
    pushHistory(state.palette);
    bindUI();
  }

  init();
})();
