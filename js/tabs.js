/* ============================================================
   CP COMPANION — js/tabs.js
   Render functions for each dashboard tab
   ============================================================ */

import { cfRankColor, cfRankLabel, acRankLabel, fmt } from './api.js';
import { drawRatingChart, buildHeatmap, buildMonthlyBars } from './charts.js';

/* ── TAG COLORS ──────────────────────────────────────────────────────────────── */
const TAG_COLORS = {
  'dp':                       '#00e5a0',
  'dynamic programming':      '#00e5a0',
  'graphs':                   '#5b9fff',
  'graph theory':             '#5b9fff',
  'data structures':          '#f5a623',
  'trees':                    '#f5a623',
  'math':                     '#f43f5e',
  'mathematics':              '#f43f5e',
  'number theory':            '#f43f5e',
  'greedy':                   '#fbbf24',
  'strings':                  '#a78bfa',
  'string suffix structures': '#a78bfa',
  'binary search':            '#22d3ee',
  'two pointers':             '#5b9fff',
  'implementation':           '#94a3b8',
  'brute force':              '#f5a623',
  'constructive algorithms':  '#00e5a0',
  'sortings':                 '#a78bfa',
  'geometry':                 '#fbbf24',
  'combinatorics':            '#f43f5e',
  'dfs and similar':          '#5b9fff',
  'bitmasks':                 '#22d3ee',
  'divide and conquer':       '#a78bfa',
  'flows':                    '#5b9fff',
  'games':                    '#fbbf24',
};
const tagColor = t => TAG_COLORS[t.toLowerCase()] || '#94a3b8';

/* ── STATS TAB ───────────────────────────────────────────────────────────────── */
export function renderStats(state) {
  const { cf, lc, ac, theme } = state;
  const u   = cf.user;
  const col = cfRankColor(u.rating);

  document.getElementById('content-stats').innerHTML = `
    <div class="col-gap tab-content">

      <!-- ── Platform Rating Cards ── -->
      <div class="grid-3">
        ${platCard({
          name: 'Codeforces', apiLabel: 'Live API', live: true,
          value: fmt(u.rating || 0), valueColor: col,
          rank:  cfRankLabel(u.rating),
          sub1:  `${fmt(cf.solved)} problems solved`,
          sub2:  `${fmt(cf.totalContests)} rated contests`,
          peak:  u.maxRating ? `Peak ${fmt(u.maxRating)}` : null,
          barColor: col,
          icon: '🟡',
        })}
        ${platCard({
          name: 'LeetCode', apiLabel: 'Simulated', live: false,
          value: `#${fmt(lc.ranking)}`, valueColor: 'var(--amber)',
          rank:  `${fmt(lc.solved)} problems solved`,
          sub1:  `${lc.easy}E · ${lc.medium}M · ${lc.hard}H`,
          sub2:  `${lc.acceptance}% acceptance rate`,
          peak:  `${lc.streak}-day streak 🔥`,
          barColor: 'var(--amber)',
          icon: '🟠',
        })}
        ${platCard({
          name: 'AtCoder', apiLabel: 'Simulated', live: false,
          value: fmt(ac.rating), valueColor: 'var(--rose)',
          rank:  ac.rank,
          sub1:  `${fmt(ac.solved)} problems solved`,
          sub2:  `${fmt(ac.contests)} rated contests`,
          peak:  null,
          barColor: 'var(--rose)',
          icon: '🔴',
        })}
      </div>

      <!-- ── Rating Chart ── -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;gap:12px;flex-wrap:wrap">
          <div>
            <div class="sec-title" style="margin:0 0 5px">
              Rating History
              <span class="sec-pill">Codeforces · Last ${cf.chartData.length} contests</span>
            </div>
            <div style="font-size:12px;color:var(--text-2)">
              Live data fetched from the Codeforces public API
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:28px;font-weight:900;color:${col};font-family:var(--font-display);letter-spacing:-1px;line-height:1">${fmt(u.maxRating || 0)}</div>
            <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);letter-spacing:1px;margin-top:3px">PEAK RATING</div>
          </div>
        </div>
        <div class="chart-wrapper">
          <canvas id="ratingCanvas"></canvas>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;padding:0 4px">
          ${cf.chartData
              .filter((_, i) => i % Math.ceil(cf.chartData.length / 6) === 0)
              .map(d => `<span style="font-size:9px;color:var(--text-3);font-family:var(--font-mono)">${d.label}</span>`)
              .join('')}
        </div>
        <div class="card-glow" style="--glow-c:${col}"></div>
      </div>

      <!-- ── LC Breakdown + Recent Contests ── -->
      <div class="grid-2">

        <!-- LeetCode breakdown -->
        <div class="card">
          <div class="sec-title">LeetCode Breakdown</div>
          ${[
            { label: 'Easy',   val: lc.easy,   color: '#00e5a0' },
            { label: 'Medium', val: lc.medium, color: '#f5a623' },
            { label: 'Hard',   val: lc.hard,   color: '#f43f5e' },
          ].map(({ label, val, color }) => {
            const p = Math.round(val / lc.solved * 100);
            return `
              <div style="margin-bottom:16px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:7px;align-items:center">
                  <span style="color:var(--text-2);font-weight:500">${label}</span>
                  <span style="color:${color};font-family:var(--font-mono);font-weight:700">${val} <span style="color:var(--text-3);font-size:10px">(${p}%)</span></span>
                </div>
                <div class="prog-wrap">
                  <div class="prog-fill" style="width:${p}%;background:${color}"></div>
                </div>
              </div>`;
          }).join('')}
          <div class="divider"></div>
          <div style="display:flex;justify-content:space-around;text-align:center;padding-top:4px">
            ${[
              { val: lc.streak,          unit: 'day streak',   color: 'var(--amber)' },
              { val: lc.acceptance + '%', unit: 'acceptance',  color: 'var(--text-1)' },
              { val: fmt(lc.solved),     unit: 'solved',       color: 'var(--green)'  },
            ].map(s => `
              <div class="mini-stat">
                <div class="mini-stat-val" style="color:${s.color}">${s.val}</div>
                <div class="mini-stat-label">${s.unit}</div>
              </div>`).join('')}
          </div>
          <div class="card-glow" style="--glow-c:var(--amber)"></div>
        </div>

        <!-- Recent CF contests -->
        <div class="card">
          <div class="sec-title">
            Recent Contests
            <span class="sec-pill">Codeforces</span>
          </div>
          <div class="col-gap" style="gap:8px">
            ${cf.recentContests.length === 0
              ? `<div style="color:var(--text-3);font-size:13px;padding:8px 0">No rated contest history found.</div>`
              : cf.recentContests.map(c => `
                  <div class="contest-row">
                    <div style="min-width:0">
                      <div class="contest-name">${c.name}</div>
                      <div class="contest-meta">${c.date} · Rank #${fmt(c.rank)}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                      <div class="delta ${c.delta >= 0 ? 'pos' : 'neg'}">${c.delta >= 0 ? '+' : ''}${c.delta}</div>
                      <div class="rating-after">${fmt(c.rating)}</div>
                    </div>
                  </div>`).join('')}
          </div>
          <div class="card-glow" style="--glow-c:${col}"></div>
        </div>
      </div>

      <!-- ── Total Solved Summary ── -->
      <div class="card" style="background:linear-gradient(135deg,var(--surface),var(--surface2))">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
          <div>
            <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);letter-spacing:2px;margin-bottom:8px">TOTAL PROBLEMS SOLVED</div>
            <div style="font-size:52px;font-weight:900;font-family:var(--font-display);letter-spacing:-2px;line-height:1;color:var(--green)">${fmt(cf.solved + lc.solved + ac.solved)}</div>
            <div style="font-size:13px;color:var(--text-2);margin-top:8px">across Codeforces · LeetCode · AtCoder</div>
          </div>
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            ${[
              { plat: 'Codeforces', val: fmt(cf.solved),  color: col },
              { plat: 'LeetCode',   val: fmt(lc.solved),  color: 'var(--amber)' },
              { plat: 'AtCoder',    val: fmt(ac.solved),  color: 'var(--rose)'  },
            ].map(p => `
              <div class="mini-stat">
                <div class="mini-stat-val" style="font-size:26px;color:${p.color}">${p.val}</div>
                <div class="mini-stat-label">${p.plat}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card-glow" style="--glow-c:var(--green)"></div>
      </div>

      <!-- ── Info Notice ── -->
      <div class="alert alert-info">
        <span class="alert-icon">ℹ</span>
        <div style="color:var(--text-2)">
          <strong style="color:var(--blue)">Codeforces</strong> data is live via the public API.
          <strong style="color:var(--amber)">LeetCode</strong> &amp; <strong style="color:var(--rose)">AtCoder</strong> data is simulated — connect a backend proxy to enable real data for those platforms.
        </div>
      </div>

    </div>
  `;

  requestAnimationFrame(() => {
    drawRatingChart('ratingCanvas', cf.chartData, state.theme);
  });
}

/* ── PLATFORM CARD HELPER ────────────────────────────────────────────────────── */
function platCard({ name, apiLabel, live, value, valueColor, rank, sub1, sub2, peak, barColor, icon }) {
  return `
    <div class="card">
      <div class="plat-bar" style="background:${barColor};opacity:.6"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div class="stat-label" style="margin:0">${icon} ${name}</div>
        <span class="api-pill ${live ? 'api-live' : 'api-sim'}">
          <span class="dot"></span>${apiLabel}
        </span>
      </div>
      <div class="stat-value" style="color:${valueColor}">${value}</div>
      <div class="stat-rank"  style="color:${valueColor}">${rank}</div>
      <div class="stat-sub">${sub1}</div>
      <div class="stat-sub">${sub2}</div>
      ${peak ? `<div class="stat-peak">${peak}</div>` : ''}
      <div class="card-glow" style="--glow-c:${barColor}"></div>
    </div>`;
}

/* ── TOPICS TAB ──────────────────────────────────────────────────────────────── */
export function renderTopics(state) {
  const { cf } = state;
  const sorted  = Object.entries(cf.tagMap).sort((a, b) => b[1] - a[1]).slice(0, 18);
  const maxVal  = sorted[0]?.[1] || 1;
  const total   = Object.values(cf.tagMap).reduce((a, b) => a + b, 0);
  const weakest = [...sorted].sort((a, b) => a[1] - b[1]).slice(0, 3);

  document.getElementById('content-topics').innerHTML = `
    <div class="col-gap tab-content">

      ${weakest.length ? `
      <div class="alert alert-amber">
        <span class="alert-icon">💡</span>
        <div>
          <div style="font-weight:700;margin-bottom:3px">Least practiced topics — consider focusing here</div>
          <div style="opacity:.85;font-size:13px">${weakest.map(w => `<strong>${w[0]}</strong> (${w[1]})`).join(' · ')}</div>
        </div>
      </div>` : ''}

      <!-- Topic grid -->
      <div class="card">
        <div class="sec-title">
          Topic Mastery
          <span class="sec-pill">${sorted.length} topics · ${fmt(total)} AC submissions</span>
        </div>
        <div class="grid-2" style="gap:10px">
          ${sorted.map(([tag, count]) => {
            const p   = Math.round(count / maxVal * 100);
            const col = tagColor(tag);
            return `
              <div class="topic-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px">
                  <span class="topic-name">${tag}</span>
                  <span class="topic-count" style="color:${col}">${count}</span>
                </div>
                <div class="prog-wrap">
                  <div class="prog-fill" style="width:${p}%;background:${col}"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
        <div class="card-glow" style="--glow-c:var(--blue)"></div>
      </div>

      <!-- Bar distribution -->
      <div class="card">
        <div class="sec-title">Top 10 Topics Distribution</div>
        <div style="display:flex;align-items:flex-end;gap:10px;height:120px;padding:0 4px">
          ${sorted.slice(0, 10).map(([tag, count]) => {
            const h   = Math.max(8, Math.round(count / maxVal * 108));
            const col = tagColor(tag);
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px" title="${tag}: ${count}">
                <span style="font-size:10px;color:${col};font-family:var(--font-mono);font-weight:700">${count}</span>
                <div style="width:100%;height:${h}px;background:${col};border-radius:5px 5px 0 0;opacity:.85;min-height:8px;transition:height 1.2s cubic-bezier(.16,1,.3,1)"></div>
                <span style="font-size:9px;color:var(--text-3);text-align:center;max-width:54px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-mono)">${tag.split(' ')[0]}</span>
              </div>`;
          }).join('')}
        </div>
        <div class="card-glow" style="--glow-c:var(--blue)"></div>
      </div>

      <div class="alert alert-success">
        <span class="alert-icon">✓</span>
        <div>Topics extracted from <strong>${fmt(total)}</strong> actual Codeforces submissions in real-time via the public API.</div>
      </div>

    </div>
  `;
}

/* ── STREAK TAB ──────────────────────────────────────────────────────────────── */
export function renderStreak(state) {
  const { cf } = state;
  const cal    = cf.calendar;

  const days = [];
  const now  = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, solved: cal[key] || 0 });
  }

  // Current streak
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].solved > 0) currentStreak++;
    else break;
  }

  // Max streak
  let maxStreak = 0, run = 0;
  days.forEach(d => {
    if (d.solved > 0) { run++; maxStreak = Math.max(maxStreak, run); }
    else run = 0;
  });

  const activeDays  = days.filter(d => d.solved > 0).length;
  const totalSolved = Object.values(cal).reduce((a, b) => a + b, 0);
  const avgPerDay   = activeDays > 0 ? (totalSolved / activeDays).toFixed(1) : '0.0';
  const bestDay     = Math.max(...Object.values(cal), 0);

  document.getElementById('content-streak').innerHTML = `
    <div class="col-gap tab-content">

      <!-- Stat cards -->
      <div class="grid-4">
        ${[
          { label: 'Current Streak', val: currentStreak,     unit: 'days',       color: 'var(--amber)' },
          { label: 'Longest Streak', val: maxStreak,          unit: 'days',       color: 'var(--green)' },
          { label: 'Active Days',    val: activeDays,          unit: '/ 365',     color: 'var(--blue)'  },
          { label: 'Best Single Day',val: bestDay,             unit: 'problems',  color: 'var(--rose)'  },
        ].map(s => `
          <div class="card">
            <div style="font-size:34px;font-weight:900;color:${s.color};font-family:var(--font-display);letter-spacing:-1px;line-height:1">${s.val}</div>
            <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);margin-top:5px;letter-spacing:.5px">${s.unit}</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:7px;font-weight:500">${s.label}</div>
            <div class="card-glow" style="--glow-c:${s.color}"></div>
          </div>`).join('')}
      </div>

      <!-- Heatmap -->
      <div class="card" style="overflow-x:auto">
        <div class="sec-title">
          Solve Heatmap
          <span class="sec-pill">Last 365 days · Codeforces</span>
        </div>
        <div id="heatmapContainer"></div>
        <div class="card-glow" style="--glow-c:var(--green)"></div>
      </div>

      <!-- Monthly bars + extra stats -->
      <div class="grid-2">
        <div class="card">
          <div class="sec-title">Monthly Activity</div>
          <div id="monthlyContainer"></div>
          <div class="card-glow" style="--glow-c:var(--amber)"></div>
        </div>
        <div class="card">
          <div class="sec-title">Activity Summary</div>
          <div class="col-gap" style="gap:14px">
            ${[
              { label: 'Total solved (last year)',  val: fmt(totalSolved), color: 'var(--green)' },
              { label: 'Avg. per active day',       val: avgPerDay,        color: 'var(--blue)'  },
              { label: 'Best single day',           val: bestDay,          color: 'var(--rose)'  },
              { label: 'Consistency rate',          val: Math.round(activeDays / 365 * 100) + '%', color: 'var(--amber)' },
            ].map(row => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
                <span style="font-size:12px;color:var(--text-2)">${row.label}</span>
                <span style="font-size:15px;font-weight:800;font-family:var(--font-display);color:${row.color}">${row.val}</span>
              </div>`).join('')}
          </div>
          <div class="card-glow" style="--glow-c:var(--green)"></div>
        </div>
      </div>

    </div>
  `;

  buildHeatmap('heatmapContainer', cal, state.theme);
  buildMonthlyBars('monthlyContainer', cal, state.theme);
}

/* ── CARD THEMES ─────────────────────────────────────────────────────────────── */
export const CARD_THEMES = [
  { id: 'midnight', label: 'Midnight', bg: '#07080f', accent: '#00e5a0', text: '#eef0ff', bg2: '#0c0e18' },
  { id: 'slate',    label: 'Slate',    bg: '#0f172a', accent: '#5b9fff', text: '#e2e8f0', bg2: '#1e293b' },
  { id: 'ember',    label: 'Ember',    bg: '#0d0500', accent: '#f5a623', text: '#fff7ed', bg2: '#1c0a00' },
  { id: 'rose',     label: 'Rose',     bg: '#0f0007', accent: '#f43f5e', text: '#fff1f2', bg2: '#1a000a' },
  { id: 'violet',   label: 'Violet',   bg: '#0a0714', accent: '#a78bfa', text: '#f5f3ff', bg2: '#130f1f' },
  { id: 'paper',    label: 'Paper',    bg: '#fafaf9', accent: '#059669', text: '#1c1917', bg2: '#f5f5f4' },
];

let activeCardTheme = CARD_THEMES[0];

export function setActiveCardTheme(id) {
  activeCardTheme = CARD_THEMES.find(t => t.id === id) || CARD_THEMES[0];
  return activeCardTheme;
}

/* ── CARD TAB ────────────────────────────────────────────────────────────────── */
export function renderCard(state) {
  document.getElementById('content-card').innerHTML = `
    <div class="col-gap tab-content">

      <!-- Controls -->
      <div class="controls-row">
        <div style="flex:1;min-width:170px">
          <div class="controls-label">Handle</div>
          <input
            id="cardHandleInput"
            class="card-handle-input"
            value="${state.handle}"
            placeholder="codeforces handle"
            oninput="window.cpApp.updateCardHandle(this.value)"
          />
        </div>
        <div>
          <div class="controls-label">Theme</div>
          <div class="swatch-row" id="cardSwatches">
            ${CARD_THEMES.map(t => `
              <div class="swatch ${t === activeCardTheme ? 'active' : ''}"
                   id="swatch-${t.id}"
                   style="background:${t.bg};--accent-color:${t.accent}"
                   onclick="window.cpApp.setCardTheme('${t.id}')"
                   title="${t.label}">
                <div class="swatch-dot" style="background:${t.accent}"></div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div>
        <div style="font-size:10px;color:var(--text-3);font-family:var(--font-mono);margin-bottom:12px;letter-spacing:1.5px">PREVIEW</div>
        <div id="shareCardPreview">
          ${buildShareCard(state, activeCardTheme)}
        </div>
      </div>

      <!-- Share actions -->
      <div class="share-actions">
        <button class="btn btn-primary"   onclick="window.cpApp.copyCardLink()">🔗 Copy Profile Link</button>
        <button class="btn btn-x"         onclick="window.cpApp.shareX()">𝕏 Share on X</button>
        <button class="btn btn-li"        onclick="window.cpApp.shareLinkedIn()">in Share on LinkedIn</button>
        <button class="btn btn-secondary" onclick="window.cpApp.copyCardEmbed()">&#60;/&#62; Copy Embed Code</button>
      </div>

      <div style="font-size:11px;color:var(--text-3);text-align:center;font-family:var(--font-mono);padding:4px 0">
        Your shareable link: cp-companion.dev/card/${state.handle}
      </div>

    </div>
  `;
}

/* ── BUILD SHARE CARD HTML ───────────────────────────────────────────────────── */
export function buildShareCard(state, theme) {
  const { cf, lc, ac } = state;
  const u   = cf.user;
  const t   = theme || activeCardTheme;
  const col = cfRankColor(u.rating);
  const totalSolved = cf.solved + lc.solved + ac.solved;
  const topTags     = Object.entries(cf.tagMap)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([tag]) => tag);
  const handle = document.getElementById('cardHandleInput')?.value || state.handle;

  const lightText = t.id === 'paper';

  return `
    <div class="share-card" style="background:${t.bg};border:1px solid ${t.accent}22">
      <div class="share-card-bg">
        <div class="orb" style="width:320px;height:320px;top:-120px;right:-100px;background:${t.accent}"></div>
        <div class="orb" style="width:220px;height:220px;bottom:-80px;left:-80px;background:${t.accent}"></div>
        <div style="position:absolute;inset:0;background-image:radial-gradient(circle,${t.accent}09 1.5px,transparent 1.5px);background-size:24px 24px"></div>
      </div>
      <div style="position:relative">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px;gap:12px">
          <div>
            <div style="font-size:9px;color:${t.accent};font-family:'DM Mono',monospace;letter-spacing:3.5px;opacity:.7;margin-bottom:8px;text-transform:uppercase">CP Companion</div>
            <div style="font-size:34px;font-weight:900;color:${t.text};letter-spacing:-1.5px;line-height:1;font-family:'Syne',sans-serif">${handle}</div>
            <div style="font-size:13px;color:${col};margin-top:7px;font-weight:700;letter-spacing:.2px">${cfRankLabel(u.rating)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:48px;font-weight:900;color:${t.accent};letter-spacing:-2px;line-height:1;font-family:'Syne',sans-serif">${fmt(u.rating || 0)}</div>
            <div style="font-size:9px;color:${t.text}55;font-family:'DM Mono',monospace;letter-spacing:1.5px;margin-top:4px">CF RATING</div>
          </div>
        </div>

        <!-- Platform stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px">
          ${[
            { platform: 'Codeforces', val: fmt(cf.solved),  sub: `Peak ${fmt(u.maxRating || 0)}` },
            { platform: 'LeetCode',   val: fmt(lc.solved),  sub: `#${fmt(lc.ranking)} rank`       },
            { platform: 'AtCoder',    val: fmt(ac.solved),  sub: `${fmt(ac.rating)} rated`         },
          ].map(p => `
            <div style="background:${t.text}08;border-radius:11px;padding:13px 14px;border:1px solid ${t.text}09">
              <div style="font-size:24px;font-weight:900;color:${t.text};font-family:'Syne',sans-serif;letter-spacing:-.5px">${p.val}</div>
              <div style="font-size:9px;color:${t.text}45;font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:1.2px;margin:4px 0">${p.platform}</div>
              <div style="font-size:11px;color:${t.text}60">${p.sub}</div>
            </div>`).join('')}
        </div>

        <!-- Footer row -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:18px;border-top:1px solid ${t.text}12;gap:12px;flex-wrap:wrap">
          <div>
            <div style="font-size:28px;font-weight:900;color:${t.accent};font-family:'Syne',sans-serif;letter-spacing:-1px;line-height:1">${fmt(totalSolved)}</div>
            <div style="font-size:9px;color:${t.text}45;font-family:'DM Mono',monospace;letter-spacing:1.5px;margin-top:3px">TOTAL SOLVED</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:55%">
            ${topTags.map(tag => `
              <span style="font-size:10px;padding:4px 10px;border-radius:5px;background:${t.accent}15;color:${t.accent};border:1px solid ${t.accent}28;font-family:'DM Mono',monospace;letter-spacing:.3px">${tag.split(' ')[0]}</span>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}
