# ⚡ CP Companion

**A professional competitive programming portfolio dashboard** — showcase your Codeforces, LeetCode, and AtCoder achievements in one beautiful, shareable interface.

---

## 🗂 Project Structure

```
cp-companion/
├── index.html          ← Main HTML shell (entry point)
├── css/
│   └── style.css       ← All styles, design tokens, light/dark themes
└── js/
    ├── app.js          ← Main controller: state, routing, theme, data loading
    ├── api.js          ← Codeforces live API + LeetCode/AtCoder mock data
    ├── charts.js       ← Canvas-based rating chart, heatmap, bar chart
    └── tabs.js         ← Render functions for each dashboard tab
```

---

## 🚀 Usage

### Local
Just open `index.html` in any modern browser. No build step, no npm install.

```bash
# With a simple local server (recommended to avoid CORS issues):
npx serve .
# or
python3 -m http.server 8080
```

### Deployed
Drop the entire folder onto any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

---

## ✨ Features

| Feature | Details |
|---|---|
| **Live Codeforces data** | Fetches user info, rating history, all submissions via public API |
| **Rating chart** | Smooth canvas-rendered bezier curve with dots per contest |
| **Solve heatmap** | GitHub-style 365-day activity calendar |
| **Topic mastery** | Tag frequency from all AC submissions with bar charts |
| **Streak tracker** | Current streak, longest streak, consistency rate |
| **Share card** | 6 beautiful card themes for LinkedIn / X / CV |
| **Light & Dark mode** | Full theme system with smooth transitions |
| **LeetCode & AtCoder** | Deterministic mock (real data requires a backend proxy) |

---

## 🎨 Light / Dark Mode

Click the ☀ / 🌑 button in the top-right. Theme preference is saved to `localStorage`.

---

## 🔌 Real LeetCode / AtCoder Data

The app currently uses **deterministic mock** data for LeetCode and AtCoder (no public CORS-friendly API exists). To enable real data:

1. Create a backend proxy (Node.js / Python / Cloudflare Worker)
2. Call the LeetCode GraphQL API and AtCoder APIs server-side
3. Replace the `mockLC()` / `mockAC()` calls in `js/api.js` with real `fetch()` calls to your proxy

---

## 🖼 Share Card

The **Share Card** tab lets you:
- Preview a professional card with 6 color themes
- Copy a shareable profile link
- Share directly to X (Twitter) or LinkedIn
- Copy an embed code (`<img>` tag) for GitHub README or CV

---

## 🛠 Tech Stack

- **Vanilla JS (ES Modules)** — zero dependencies, zero build step
- **Canvas 2D API** — custom chart rendering
- **CSS Custom Properties** — full design token system
- **Codeforces Public API** — `codeforces.com/api`

---

## 📋 Known Issues & Fixes in This Version

- ✅ Fixed `mockAC()` BigInt crash (was using `BigInt` in LCG, now pure 32-bit)
- ✅ Fixed loading state not resetting profile bar on new search
- ✅ Fixed tab `aria-selected` attributes for accessibility
- ✅ Fixed resize handler debounce to prevent chart flicker
- ✅ Added avatar image error fallback
- ✅ Improved CORS proxy timeout handling

---

*Built for the competitive programming community.*
