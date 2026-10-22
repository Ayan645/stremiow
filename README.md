# 📺 Stremio tv

> A high-performance, cinematic **Apple TV-inspired interface** for the **Stremio** ecosystem and **Letterboxd** cinephile community.

Stremio tv connects directly to Stremio's open addon protocol (manifests, catalogs, metadata, and streams) and the Stremboxd Letterboxd bridge to deliver an editorial streaming frontend with frosted glass aesthetics, instant gesture dynamics, and zero visual clutter.

---

## ✨ Features

- **Apple TV Design Language:**
  - **Top Shelf Hero:** Dynamic full-bleed cinematic banner with auto-rotating trending titles, muted preview trailers, and frosted glass capsule buttons.
  - **Floating Frosted Glass Island:** Apple TV pill navigation (`Watch Now`, `Top 10`, `Letterboxd`, `Movies`, `Series`, `My List`) with backdrop-blur-3xl.
  - **Focus Elevation Cards:** Fluid card lift (`scale-[1.04]`), atmospheric 3D elevation shadows (`shadow-[0_24px_48px_rgba(0,0,0,0.85)]`), and in-card muted preview trailers.
  - **Anti-Slop Craftsmanship:** Elimination of generic AI tropes (no neon volt accents, no robotic monospace developer jargon). Clean human typography ([Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) / SF Pro Display) and deep velvety `#050507` canvas.

- **Letterboxd Cinephile Integration:**
  - **Live Watchlist Sync:** Connect any public Letterboxd username to display your personal watchlist directly on the home shelf and in your library via the Stremboxd protocol.
  - **In-App Diary Logging:** Log films to your Letterboxd diary with 1–5 star ratings, like heart toggle, and review notes from cards, detail pages, and the player HUD.
  - **Cinephile Rails:** Browse Letterboxd's *Popular This Week* and *Top 250 Narrative Features* with IMDb ratings and metadata.

- **Stremio Addon Protocol & Multi-Addon Swarm:**
  - Native integration with **Cinemeta** for movie and TV series catalogs.
  - Aggregation across **Torrentio**, **RealDebrid**, **Cyberflix**, **Anime Kitsu**, **Comet**, **Annatar**, and **OpenSubtitles**.
  - Intelligent stream resolution with quality badges (`4K Ultra HD`, `1080p Full HD`, `720p`), audio format specs (Dolby Atmos, DTS-HD), file sizes, and seeder health.

- **Dual-Pipeline Playback Engine:**
  - **Built-in Minimalist Web Player:** Apple TV frosted HUD, smooth white progress scrubber, stream switcher drawer (categorized by addon and quality), and subtitle track picker.
  - **Port 11470 Streaming Engine:** Direct handshake with local Stremio background engine for hardware-accelerated video decoding (VideoToolbox) and RFC 7233 range-request streaming.
  - **1-Click Desktop MPV Handshake:** Native protocol deep linking (`stremio:///detail/{type}/{id}`) to seamlessly transition playback to desktop Stremio.

- **Personalization & Cloud Sync:**
  - **Stremio Account Cloud Sync:** Connect your Stremio email/password or authKey to auto-sync your library, installed addons, and continue-watching timestamps.
  - **Offline Watchlist:** Local storage fallback to keep titles saved across sessions.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- (Optional) [Stremio Desktop](https://www.stremio.com/) running locally for port 11470 torrent decoding

### Installation

```bash
# Clone the repository
git clone https://github.com/Ayan645/stremiow.git
cd stremiow

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

### Run Automated QA Test Suite

```bash
node tests/qa-runner.mjs
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Turbopack, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Custom Apple TV Frosted Glass Tokens
- **State Management:** Zustand
- **Video Engine:** Hls.js + HTML5 Video + Stremio Local Engine (Port 11470)
- **Icons:** Lucide React
- **Protocol:** Stremio Addon Protocol v3 & Stremboxd Letterboxd API

---

## 📄 License

MIT License. Engineered for cinematic clarity and decentralized streaming.
