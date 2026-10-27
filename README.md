# 🕹️ Neon Retro Arcade

A fast-paced synthwave cyber arcade web game built with pure vanilla JavaScript, HTML5 Canvas, and the Web Audio API. Catch falling neon energy orbs, dodge red hazard spikes, chain combo multipliers, and activate shield and slow-motion powerups.

Part of the [Gamility](https://mahesh-yennam.github.io/Gamility/) web games collection. Fully configured to run as an **independent standalone repository** or embedded within the Gamility portal.

---

## 📁 Repository Structure

```text
neon-retro-arcade/
├── index.html        # Game markup, HUD, overlays, touch controls & Schema.org JSON-LD
├── style.css         # Responsive synthwave neon styling & mobile touch layouts
├── game.js           # 60FPS Canvas engine, synthesized Web Audio SFX & local high score
├── favicon.svg       # Dedicated neon arcade vector favicon
├── site.webmanifest  # Progressive Web App (PWA) manifest for mobile install
├── robots.txt        # Search engine crawler configuration
├── sitemap.xml       # Standalone XML sitemap
├── .gitignore        # Standard web gitignore
└── README.md         # Documentation & deployment guide
```

---

## 🎮 How to Play

- **Objective:** Collect glowing cyan energy orbs to score points and chain your combo multiplier. Avoid red hazard spikes.
- **Desktop Controls:**
  - `Arrow Left` / `A`: Move Paddle Left
  - `Arrow Right` / `D`: Move Paddle Right
  - **Mouse / Trackpad:** Move your cursor across the canvas to glide the paddle directly
  - `P`: Pause / Resume
- **Mobile Controls:**
  - Tap or hold the on-screen `◀` and `▶` directional buttons
  - Drag your finger smoothly across the canvas play area

### ⚡ Items & Power-Ups

| Item | Appearance | Effect |
| :--- | :--- | :--- |
| **Energy Orb** | Cyan Glowing Sphere | +10 Points × Current Combo. Keeps combo chain alive. |
| **Shield Aura** | Purple Energy Orb | Absorbs 1 hit from a red hazard spike without losing a life. |
| **Slow-Mo Field** | Green Orb | Slows falling velocity by 45% for 4 seconds. |
| **Hazard Spike** | Red Polygon Spike | -1 Life. Resets combo multiplier back to 1x. |

---

## ✨ Features

- **Pure Vanilla Web Tech:** Zero dependencies, zero external frameworks, zero build tools.
- **Hardware-Accelerated Canvas:** Smooth 60 FPS rendering with perspective grid movement and custom particle explosion physics.
- **Synthesized Web Audio:** Authentic retro chiptune SFX generated dynamically using HTML5 `AudioContext` oscillators — 100% self-contained with no external `.mp3` files needed.
- **SEO & PWA Ready:** Includes dedicated `favicon.svg`, `site.webmanifest`, `robots.txt`, `sitemap.xml`, and Google-recognized `VideoGame` Schema.org structured data.
- **Persistent High Scores:** Automatically saves your personal best score in `localStorage`.
- **Fully Responsive:** Adapts cleanly to desktop monitors, tablets, and mobile phones with dedicated touch controls.

---

## 💻 Local Development

Run with any local static HTTP server or double-click `index.html`:

```bash
# Using Python
python -m http.server 8080

# Using Node.js npx
npx serve .
```

Then visit `http://localhost:8080` in your web browser.

---

## 📄 Copyright & Terms

Copyright © 2026 Gamility. All rights reserved.
This repository and its source code are proprietary. Unauthorized copying, distribution, or commercial reuse without explicit permission is strictly prohibited.
