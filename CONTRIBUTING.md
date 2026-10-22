# Contributing to Stremio tv 📺

First off, thank you for taking the time to contribute! 🎉

Stremio tv is a community-driven, open-source streaming frontend designed to bring the elegance of Apple TV to the decentralized Stremio addon ecosystem and Letterboxd cinephile community.

## 📋 Code of Conduct

This project is dedicated to providing a welcoming, harassment-free environment for everyone. Please be respectful, inclusive, and collaborative.

---

## 🛠️ How Can I Contribute?

### 1. Reporting Bugs
- Check the [GitHub Issues](https://github.com/Ayan645/stremiow/issues) to verify if the issue has already been reported.
- If not, create a new issue detailing:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser and device environment
  - Screenshots or console logs if applicable

### 2. Suggesting Features & Addon Integrations
- Open a feature request describing the use case and why it benefits the cinephile / Stremio community.
- Addon integration ideas (new scrapers, subtitle sources, tracking services) are welcome!

### 3. Submitting Pull Requests
1. Fork the repository on GitHub.
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/stremiow.git
   cd stremiow
   ```
3. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Ensure your code conforms to the project's styling and anti-slop guidelines:
   - Stick to Apple Cupertino frosted glass aesthetics and pure white capsule buttons.
   - Avoid generic AI tropes (no neon green `#D2FF00` highlights, no random developer monospace tags in standard copy).
   - Maintain full TypeScript typing.
6. Run the automated QA test suite before submitting:
   ```bash
   npm run build
   npm run test:qa
   ```
7. Commit your changes with conventional commit messages (`feat: ...`, `fix: ...`, `docs: ...`):
   ```bash
   git commit -m "feat: add Trakt.tv two-way scrobbling support"
   ```
8. Push to your branch and open a Pull Request against `main`.

---

## 🏗️ Architecture Overview

- **`src/lib/stremio/`**: Low-level Stremio addon protocol client, stream aggregator, and local port 11470 hardware passthrough engine.
- **`src/lib/letterboxd/`**: Stremboxd protocol integration for syncing user watchlists and generating diary logging deep links.
- **`src/components/`**: Apple TV UI component library (Top Shelf hero banner, focus cards with hover preview trailers, frosted glass navbar island, minimalist player HUD).
- **`src/store/`**: Lightweight Zustand stores for global app state, watch history, Stremio cloud sync, and Letterboxd session.
- **`tests/qa-runner.mjs`**: Comprehensive automated test harness validating all HTTP routes, stream classification algorithms, and live addon connections.

---

## 📄 License

By contributing to Stremio tv, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
