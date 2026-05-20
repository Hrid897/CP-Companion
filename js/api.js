/* ============================================================
   CP COMPANION — js/api.js
   Codeforces API with CORS proxy fallback
   LeetCode & AtCoder use deterministic mock (no public CORS API)
   ============================================================ */

const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url) {
  // Try direct first (works in deployed environments)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (res.ok) return res.json();
  } catch (_) { /* blocked by CORS or timeout */ }

  // Try each proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(9000) });
      if (res.ok) {
        const text = await res.text();
        return JSON.parse(text);
      }
    } catch (_) { /* try next */ }
  }
  throw new Error('All network requests failed — check your connection or try again later.');
}

/* ── CODEFORCES ─────────────────────────────────────────────────────────────── */
export async function fetchCF(handle) {
  const BASE = 'https://codeforces.com/api';

  const [infoData, ratingData, statusData] = await Promise.all([
    fetchWithProxy(`${BASE}/user.info?handles=${handle}`),
    fetchWithProxy(`${BASE}/user.rating?handle=${handle}`),
    fetchWithProxy(`${BASE}/user.status?handle=${handle}&from=1&count=10000`),
  ]);

  if (infoData.status !== 'OK')
    throw new Error(infoData.comment || 'Handle not found on Codeforces');

  const user     = infoData.result[0];
  const contests = ratingData.status === 'OK' ? ratingData.result : [];
  const subs     = statusData.status  === 'OK' ? statusData.result  : [];

  // Unique AC problems
  const acSet = new Set(
    subs.filter(s => s.verdict === 'OK')
        .map(s => `${s.problem.contestId}-${s.problem.index}`)
  );

  // Tag frequency from AC submissions
  const tagMap = {};
  subs.filter(s => s.verdict === 'OK').forEach(s => {
    (s.problem.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
  });

  // Solve calendar (last 365 days)
  const calendar = {};
  const cutoff   = Date.now() - 365 * 86400000;
  subs
    .filter(s => s.verdict === 'OK' && s.creationTimeSeconds * 1000 >= cutoff)
    .forEach(s => {
      const key = new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10);
      calendar[key] = (calendar[key] || 0) + 1;
    });

  // Rating chart (last 25 rated contests)
  const chartData = contests.slice(-25).map(c => ({
    label:  new Date(c.ratingUpdateTimeSeconds * 1000)
              .toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    rating: c.newRating,
  }));

  // Recent contests (newest first)
  const recentContests = [...contests].reverse().slice(0, 6).map(c => ({
    name:   c.contestName,
    rank:   c.rank,
    delta:  c.newRating - c.oldRating,
    rating: c.newRating,
    date:   new Date(c.ratingUpdateTimeSeconds * 1000)
              .toLocaleDateString('en', { month: 'short', year: 'numeric' }),
  }));

  return {
    user,
    solved:        acSet.size,
    totalContests: contests.length,
    tagMap,
    calendar,
    chartData,
    recentContests,
    allContests:   contests,
  };
}

/* ── LEETCODE (mock — deterministic by handle) ──────────────────────────────── */
export function mockLC(handle) {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  const rng = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 0xFFFFFFFF; };

  const easy   = Math.floor(150 + rng() * 450);
  const medium = Math.floor(300 + rng() * 700);
  const hard   = Math.floor(50  + rng() * 400);
  return {
    solved:     easy + medium + hard,
    easy, medium, hard,
    ranking:    Math.floor(1000  + rng() * 80000),
    streak:     Math.floor(5     + rng() * 400),
    acceptance: (50 + rng() * 30).toFixed(1),
    mock: true,
  };
}

/* ── ATCODER (mock — deterministic by handle) ────────────────────────────────── */
export function mockAC(handle) {
  // Fixed: avoid BigInt in the LCG — pure 32-bit integer math
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 37 + handle.charCodeAt(i)) >>> 0;
  const rng = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 0xFFFFFFFF; };

  const rating = Math.floor(400 + rng() * 3000);
  return {
    rating,
    solved:   Math.floor(50  + rng() * 900),
    contests: Math.floor(10  + rng() * 180),
    rank:     acRankLabel(rating),
    mock: true,
  };
}

export function acRankLabel(r) {
  if (r >= 2800) return 'Red';
  if (r >= 2400) return 'Orange';
  if (r >= 2000) return 'Yellow';
  if (r >= 1600) return 'Blue';
  if (r >= 1200) return 'Cyan';
  if (r >= 800)  return 'Green';
  return 'Gray';
}

/* ── CODEFORCES RANK HELPERS ─────────────────────────────────────────────────── */
export function cfRankColor(r) {
  if (!r) return '#888';
  if (r >= 2900) return '#ff0000';
  if (r >= 2600) return '#ff3333';
  if (r >= 2400) return '#ff8c00';
  if (r >= 2100) return '#ffaa00';
  if (r >= 1900) return '#9b59b6';
  if (r >= 1600) return '#4d8eff';
  if (r >= 1400) return '#03bfc8';
  if (r >= 1200) return '#43a047';
  return '#888';
}

export function cfRankLabel(r) {
  if (!r) return 'Unrated';
  if (r >= 2900) return 'Legendary Grandmaster';
  if (r >= 2600) return 'International Grandmaster';
  if (r >= 2400) return 'Grandmaster';
  if (r >= 2100) return 'International Master';
  if (r >= 1900) return 'Master';
  if (r >= 1600) return 'Candidate Master';
  if (r >= 1400) return 'Expert';
  if (r >= 1200) return 'Specialist';
  if (r >= 800)  return 'Pupil';
  return 'Newbie';
}

export function fmt(n) {
  return n != null ? Number(n).toLocaleString() : '—';
}
