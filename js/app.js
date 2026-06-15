/* ============================================================
   CP COMPANION — js/app.js
   Main controller: state, routing, theme, user loading
   ============================================================ */

import { fetchCF, mockLC, mockAC, cfRankColor, cfRankLabel, fmt } from './api.js';
import { drawRatingChart } from './charts.js';
import {
  renderStats, renderTopics, renderStreak, renderCard, renderAbout,
  buildShareCard, CARD_THEMES, setActiveCardTheme,
} from './tabs.js';

/* ── STATE ───────────────────────────────────────────────────────────────────── */
const state = {
  handle:    'tourist',
  cf:        null,
  lc:        null,
  ac:        null,
  loading:   false,
  activeTab: 'stats',
  theme:     localStorage.getItem('cp-theme') || 'dark',
};

/* ── THEME ───────────────────────────────────────────────────────────────────── */
function applyTheme(t) {
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('cp-theme', t);

  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = t === 'dark' ? '☀' : '🌑';

  // Re-draw chart if visible
  if (state.cf && state.activeTab === 'stats') {
    requestAnimationFrame(() =>
      drawRatingChart('ratingCanvas', state.cf.chartData, t)
    );
  }
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

/* ── LOAD USER ───────────────────────────────────────────────────────────────── */
async function loadUser() {
  const input  = document.getElementById('handleInput');
  const handle = input.value.trim();
  if (!handle) {
    input.focus();
    return;
  }

  state.handle = handle;
  state.loading = true;

  const btn = document.getElementById('searchBtn');
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled  = true;

  // Hide profile bar during load
  document.getElementById('profileBar').style.display = 'none';

  renderSkeletons();

  try {
    state.cf = await fetchCF(handle);
  } catch (err) {
    btn.innerHTML = 'Search';
    btn.disabled  = false;
    state.loading = false;
    renderError(err.message);
    return;
  }

  state.lc = mockLC(handle);
  state.ac = mockAC(handle);

  state.loading = false;
  btn.innerHTML = 'Search';
  btn.disabled  = false;

  renderProfileBar();
  renderActiveTab();
}

/* ── PROFILE BAR ─────────────────────────────────────────────────────────────── */
function renderProfileBar() {
  const { cf, lc, ac, handle } = state;
  const u   = cf.user;
  const col = cfRankColor(u.rating);

  const bar = document.getElementById('profileBar');
  bar.style.display = 'flex';
  bar.innerHTML = `
    <div class="avatar">
      ${u.avatar
        ? `<img src="${u.avatar}" alt="${handle}" onerror="this.parentElement.textContent='${handle[0].toUpperCase()}'">`
        : handle[0].toUpperCase()}
    </div>
    <div class="profile-info">
      <div class="name">${u.handle}</div>
      <div class="meta">
        ${[u.firstName, u.lastName].filter(Boolean).join(' ') || ''}
        ${[u.city, u.country].filter(Boolean).join(', ') || 'Competitive Programmer'}
      </div>
    </div>
    <div class="profile-badges">
      <span class="badge" style="color:${col};border-color:${col}40">
        CF ${fmt(u.rating || 0)}
      </span>
      <span class="badge" style="color:var(--amber);border-color:var(--amber-dim)">
        LC #${fmt(lc.ranking)}
      </span>
      <span class="badge" style="color:var(--rose);border-color:var(--rose-dim)">
        AC ${fmt(ac.rating)}
      </span>
    </div>
  `;
}

/* ── TAB SWITCHING ───────────────────────────────────────────────────────────── */
function switchTab(tabId) {
  // Hide old
  const oldContent = document.getElementById(`content-${state.activeTab}`);
  const oldTab     = document.getElementById(`tab-${state.activeTab}`);
  if (oldContent) oldContent.style.display = 'none';
  if (oldTab)     { oldTab.classList.remove('active'); oldTab.setAttribute('aria-selected', 'false'); }

  state.activeTab = tabId;

  // Show new
  const newContent = document.getElementById(`content-${tabId}`);
  const newTab     = document.getElementById(`tab-${tabId}`);
  if (newContent) newContent.style.display = '';
  if (newTab)     { newTab.classList.add('active'); newTab.setAttribute('aria-selected', 'true'); }

  if (state.cf || state.activeTab === 'about') renderActiveTab();
}

function renderActiveTab() {
  const tab = state.activeTab;
  if (tab === 'stats')  renderStats(state);
  if (tab === 'topics') renderTopics(state);
  if (tab === 'streak') renderStreak(state);
  if (tab === 'card')   renderCard(state);
  if (tab === 'about')  renderAbout();
}

/* ── SKELETON / ERROR ─────────────────────────────────────────────────────────── */
function renderSkeletons() {
  document.getElementById('content-stats').innerHTML = `
    <div class="col-gap tab-content">
      <div class="grid-3">
        ${'<div class="card skeleton" style="height:150px"></div>'.repeat(3)}
      </div>
      <div class="card skeleton" style="height:200px"></div>
      <div class="grid-2">
        ${'<div class="card skeleton" style="height:260px"></div>'.repeat(2)}
      </div>
      <div class="card skeleton" style="height:100px"></div>
    </div>`;
}

function renderError(msg) {
  document.getElementById('content-stats').innerHTML = `
    <div class="col-gap tab-content">
      <div class="alert alert-warn" style="padding:22px">
        <span class="alert-icon">⚠</span>
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:6px">Could not load profile</div>
          <div style="opacity:.85;font-size:13px">${msg}</div>
          <div style="margin-top:12px;font-size:12px;color:var(--text-2)">
            Verify the Codeforces handle exists and try again. If the problem persists, the Codeforces API may be temporarily down.
          </div>
        </div>
      </div>
    </div>`;
}

/* ── CARD ACTIONS ────────────────────────────────────────────────────────────── */
function updateCardHandle(val) {
  state.handle = val;
  const preview = document.getElementById('shareCardPreview');
  const swatch  = document.querySelector('.swatch.active');
  const themeId = swatch?.id?.replace('swatch-', '') || 'midnight';
  const theme   = CARD_THEMES.find(t => t.id === themeId) || CARD_THEMES[0];
  if (preview) preview.innerHTML = buildShareCard(state, theme);
}

function setCardTheme(id) {
  const theme = setActiveCardTheme(id);
  document.querySelectorAll('.swatch').forEach(el => el.classList.remove('active'));
  const sw = document.getElementById(`swatch-${id}`);
  if (sw) sw.classList.add('active');
  const preview = document.getElementById('shareCardPreview');
  if (preview) preview.innerHTML = buildShareCard(state, theme);
}

function copyCardLink() {
  const url = `https://cp-companion.dev/card/${state.handle}`;
  _copyText(url, event.target.closest('button'));
}

function copyCardEmbed() {
  const embed = `<a href="https://cp-companion.dev/card/${state.handle}"><img src="https://cp-companion.dev/api/card/${state.handle}" alt="${state.handle} CP Card"></a>`;
  _copyText(embed, event.target.closest('button'));
}

function _copyText(text, btn) {
  navigator.clipboard?.writeText(text).then(() => {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = orig, 2200);
  }).catch(() => {
    // Fallback for browsers without clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function shareX() {
  const { cf } = state;
  if (!cf) return;
  const text = [
    `🏆 My competitive programming stats:`,
    `📊 Codeforces: ${fmt(cf.user.rating)} (${cfRankLabel(cf.user.rating)})`,
    `🟠 LeetCode + 🔴 AtCoder included`,
    `💡 ${fmt(state.lc.solved + state.ac.solved + cf.solved)} total problems solved`,
    ``,
    `Check yours → cp-companion.dev/card/${state.handle}`,
    `#CompetitiveProgramming #Codeforces #LeetCode`,
  ].join('\n');
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
}

function shareLinkedIn() {
  const url = `https://cp-companion.dev/card/${state.handle}`;
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
}

/* ── KEYBOARD SUPPORT ────────────────────────────────────────────────────────── */
function handleInputKeydown(e) {
  if (e.key === 'Enter') loadUser();
}

/* ── INIT ────────────────────────────────────────────────────────────────────── */
function init() {
  applyTheme(state.theme);
  renderSkeletons();

  const input = document.getElementById('handleInput');
  if (input) input.value = state.handle;

  // Auto-load default handle
  loadUser();
}

/* ── RESIZE HANDLER ──────────────────────────────────────────────────────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (state.cf && state.activeTab === 'stats') {
      requestAnimationFrame(() =>
        drawRatingChart('ratingCanvas', state.cf.chartData, state.theme)
      );
    }
  }, 150);
});

/* ── EXPOSE API ──────────────────────────────────────────────────────────────── */
window.cpApp = {
  loadUser,
  switchTab,
  toggleTheme,
  updateCardHandle,
  setCardTheme,
  copyCardLink,
  copyCardEmbed,
  shareX,
  shareLinkedIn,
  handleInputKeydown,
};

document.addEventListener('DOMContentLoaded', init);
