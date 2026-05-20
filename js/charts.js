/* ============================================================
   CP COMPANION — js/charts.js
   Canvas-based chart renderers (zero external dependencies)
   ============================================================ */

/* ── RATING LINE CHART ───────────────────────────────────────────────────────── */
export function drawRatingChart(canvasId, data, theme = 'dark') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !data || data.length < 2) return;

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.offsetWidth  || 600;
  const H   = 120;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const isLight  = theme === 'light';
  const ACCENT    = isLight ? '#00a572'              : '#00e5a0';
  const FILL_TOP  = isLight ? 'rgba(0,165,114,.15)'  : 'rgba(0,229,160,.18)';
  const FILL_BOT  = isLight ? 'rgba(0,165,114,0)'    : 'rgba(0,229,160,0)';
  const GRID      = isLight ? 'rgba(0,0,0,.05)'      : 'rgba(255,255,255,.04)';
  const LABEL     = isLight ? 'rgba(0,0,0,.28)'      : 'rgba(255,255,255,.22)';
  const DOT_INNER = isLight ? '#ffffff'               : '#080a12';

  const vals = data.map(d => d.rating);
  const minV = Math.min(...vals) - 40;
  const maxV = Math.max(...vals) + 40;
  const pad  = { l: 10, r: 10, t: 12, b: 12 };
  const cW   = W - pad.l - pad.r;
  const cH   = H - pad.t - pad.b;

  const xOf = i => pad.l + (i / (data.length - 1)) * cW;
  const yOf = v => pad.t + cH - ((v - minV) / (maxV - minV)) * cH;

  // Grid lines
  for (let i = 0; i <= 3; i++) {
    const y = pad.t + (i / 3) * cH;
    ctx.beginPath();
    ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Smooth bezier curve path builder
  function smoothPath() {
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(vals[0]));
    for (let i = 1; i < data.length; i++) {
      const x0 = xOf(i - 1), y0 = yOf(vals[i - 1]);
      const x1 = xOf(i),     y1 = yOf(vals[i]);
      const cpx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
  }

  // Area fill
  smoothPath();
  ctx.lineTo(xOf(data.length - 1), H);
  ctx.lineTo(xOf(0), H);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.t, 0, H);
  grad.addColorStop(0, FILL_TOP);
  grad.addColorStop(1, FILL_BOT);
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke line
  smoothPath();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.stroke();

  // All contest dots (small)
  data.forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(xOf(i), yOf(d.rating), 2.5, 0, Math.PI * 2);
    ctx.fillStyle = d.rating >= vals[vals.length - 1] ? ACCENT : (isLight ? 'rgba(0,165,114,.3)' : 'rgba(0,229,160,.3)');
    ctx.fill();
  });

  // End dot (larger, emphasized)
  const lx = xOf(data.length - 1);
  const ly = yOf(vals[vals.length - 1]);
  ctx.beginPath();
  ctx.arc(lx, ly, 6, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = DOT_INNER;
  ctx.fill();

  // Min / max labels
  ctx.fillStyle   = LABEL;
  ctx.font        = `500 9px DM Mono, monospace`;
  ctx.textBaseline = 'top';
  ctx.fillText(Math.round(maxV - 40), pad.l + 4, pad.t + 2);
  ctx.textBaseline = 'bottom';
  ctx.fillText(Math.round(minV + 40), pad.l + 4, H - 3);
}

/* ── SOLVE HEATMAP ───────────────────────────────────────────────────────────── */
export function buildHeatmap(containerId, calendar, theme = 'dark') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isLight = theme === 'light';

  function cellColor(n) {
    if (n === 0) return isLight ? '#e8ecf8' : 'rgba(255,255,255,.05)';
    if (isLight) {
      if (n === 1) return '#bbf7d0';
      if (n === 2) return '#86efac';
      if (n <= 4)  return '#4ade80';
      if (n <= 7)  return '#22c55e';
      return '#16a34a';
    } else {
      if (n === 1) return '#0a5c3f';
      if (n === 2) return '#0d8055';
      if (n <= 4)  return '#0daa6e';
      if (n <= 7)  return '#00dd8a';
      return '#00e5a0';
    }
  }

  // Build last 365 days
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const days  = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, solved: calendar[key] || 0, isToday: key === todayKey });
  }

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  container.innerHTML = `
    <div class="heatmap-row">
      ${weeks.map(week => `
        <div class="heatmap-week">
          ${week.map(d => `
            <div class="heatmap-cell ${d.isToday ? 'streak-today' : ''}"
                 style="background:${cellColor(d.solved)}"
                 data-tip="${d.key}: ${d.solved} solved">
            </div>`).join('')}
        </div>`).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:5px;margin-top:12px">
      <span style="font-size:10px;color:var(--text-3);font-family:var(--font-mono)">Less</span>
      ${[0,1,2,4,6,9].map(v =>
        `<div style="width:10px;height:10px;border-radius:2px;background:${cellColor(v)}"></div>`
      ).join('')}
      <span style="font-size:10px;color:var(--text-3);font-family:var(--font-mono)">More</span>
    </div>
  `;
}

/* ── MONTHLY BAR CHART ───────────────────────────────────────────────────────── */
export function buildMonthlyBars(containerId, calendar, theme = 'dark') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isLight = theme === 'light';
  const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthly = Array(12).fill(0);

  Object.entries(calendar).forEach(([key, count]) => {
    const month = parseInt(key.slice(5, 7)) - 1;
    monthly[month] += count;
  });

  const maxVal = Math.max(...monthly, 1);
  const currMonth = new Date().getMonth();

  container.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:8px;height:100px">
      ${monthly.map((val, i) => {
        const h   = Math.max(4, (val / maxVal) * 92);
        const isCurrentMonth = i === currMonth;
        const color = isCurrentMonth
          ? (isLight ? 'linear-gradient(180deg,#00a572,#059669)' : 'linear-gradient(180deg,#00e5a0,#00c888)')
          : (isLight ? 'linear-gradient(180deg,#f59e0b,#e11d48)' : 'linear-gradient(180deg,#f5a623,#f43f5e)');
        return `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px">
            <div title="${MONTHS[i]}: ${val}"
                 style="width:100%;height:${h}px;background:${color};border-radius:4px 4px 0 0;
                        opacity:${isCurrentMonth ? 1 : .75};min-height:4px;
                        transition:height 1.2s cubic-bezier(.16,1,.3,1);
                        ${isCurrentMonth ? 'box-shadow:0 0 12px rgba(0,229,160,.3)' : ''}">
            </div>
            <span style="font-size:9px;color:${isCurrentMonth ? 'var(--green)' : 'var(--text-3)'};
                         font-family:var(--font-mono);font-weight:${isCurrentMonth ? 700 : 400}">${MONTHS[i][0]}</span>
          </div>`;
      }).join('')}
    </div>
  `;
}
