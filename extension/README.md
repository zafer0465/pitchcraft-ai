# PitchCraft AI - Upwork Proposal Assistant ⚡

AI-powered Chrome Extension designed to help freelancers craft winning, personalized Upwork proposals in under 10 seconds.

---

## 🚀 Quick Start (Development)

### 1. Install Dependencies
Open your terminal in this directory and run:
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Plasmo will build the extension in development mode and watch for changes with live-reloading.

### 3. Load into Google Chrome
1. Open Google Chrome and navigate to: `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (Paketlenmemiş öğe yükle).
4. Select the directory:
   `C:\Users\asus\.gemini\antigravity\scratch\proposal-craft-extension\build\chrome-mv3-dev`
5. Pin **PitchCraft AI** to your Chrome toolbar!

---

## 📁 Project Structure

```
proposal-craft-extension/
├── popup.tsx              # Extension popup UI (React + Tailwind-ready inline styles)
├── background.ts          # Chrome Manifest V3 Service Worker (AI API & logic)
├── contents/
│   └── upwork.ts          # Content script injected into Upwork job pages
├── package.json           # Dependencies and Plasmo configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

---

## 💡 Monetization & Roadmap

1. **Freemium Quota:** 10 free proposals for every user stored in `chrome.storage`.
2. **Pro Upgrade:** Lemon Squeezy integration for $9/month unlimited plan.
3. **AI Backend:** Direct Google Gemini 1.5 Flash integration (high speed, near-zero cost).

