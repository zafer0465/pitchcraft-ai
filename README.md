# PitchCraft AI ⚡

> **AI-Powered Proposal Assistant for Freelance Platforms (Upwork)**  
> Built with **Google Chrome Manifest V3**, **React**, **TypeScript**, and a secure **Node.js/Express backend** powered by **Google Gemini 3.5 Flash**.

---

## 📌 Overview

**PitchCraft AI** is an open-source productivity extension designed to help freelancers craft concise, highly personalized, and high-converting proposals on platforms like Upwork in under 3 seconds.

Instead of generic boilerplate AI cover letters, PitchCraft AI analyzes the client's specific requirements, technical challenges, and screening questions, pairing them directly with the freelancer's portfolio, skillset, and communication style.

---

## 🏗️ Architecture & Security

Chrome extensions run in the user's browser, meaning client-side code can be inspected and decompiled. To prevent API key leakage and abuse, PitchCraft implements a **Secure Proxy Backend Architecture**:

```
┌─────────────────────────────────┐
│   Chrome Browser (Manifest V3)  │
│   • Popup UI (React + TS)       │
│   • Content Scripts (DOM Hook)  │
│   • Local Storage (State Sync)  │
└────────────────┬────────────────┘
                 │  x-pitchcraft-secret (Auth Header)
                 ▼
┌─────────────────────────────────┐
│   Secure Backend Proxy (Express)│
│   • Rate Limiting & CORS Shield │
│   • Usage Counter & Quota Guard │
│   • Prompt Engineering Engine   │
└────────────────┬────────────────┘
                 │  Server-to-Server HTTPS
                 ▼
┌─────────────────────────────────┐
│     Google Gemini 3.5 Flash     │
│   • systemInstruction Context   │
│   • Low-latency Generation      │
└─────────────────────────────────┘
```

### Key Engineering Decisions:
1. **Zero Secret Leakage:** The Google Gemini API key resides solely on the server in `.env`. The extension only communicates through authenticated proxy endpoints.
2. **Manifest V3 Standards:** Uses service workers (`background.ts`) and scoped permissions (`activeTab`, `storage`).
3. **Smart Prompt Engineering:** Utilizes Gemini's native `systemInstruction` API to prevent prompt injection and guarantee high-converting copywriting standards.

---

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, [Plasmo Framework](https://www.plasmo.com/) (Manifest V3)
- **Backend:** Node.js, Express, `express-rate-limit`, CORS
- **AI Engine:** Google Gemini 3.5 Flash API (`v1beta`)
- **Database (Optional):** Supabase (PostgreSQL with Row Level Security)
- **Payment / Monetization Hook:** Lemon Squeezy (Freemium 10 credits quota)

---

## 📂 Repository Structure

```
pitchcraft-ai/
├── extension/                 # Chrome Extension (Plasmo + React + TypeScript)
│   ├── popup.tsx              # Extension popup interface & profile management
│   ├── background.ts          # Service Worker handling backend communication
│   ├── contents/              # In-page content scripts for Upwork DOM
│   ├── assets/                # Extension icons (16, 32, 48, 64, 128px)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # Secure Express.js Proxy Server
│   ├── api/
│   │   └── index.js           # Express API endpoints (/api/generate, /api/user/sync)
│   ├── supabase_setup.sql     # Database schema for persistent user quotas
│   ├── vercel.json            # One-click deployment config for Vercel
│   ├── .env.example           # Environment template
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm
- Google Chrome browser
- A Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Open `.env` and configure your keys:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
EXTENSION_SECRET=pitchcraft_secret_key_here
PORT=3001
```

Start the backend server:
```bash
npm run dev
# Server runs at http://127.0.0.1:3001
# Test endpoint: http://127.0.0.1:3001/health
```

---

### 3. Extension Setup

```bash
cd ../extension

# Install dependencies
npm install

# Build extension for Chrome Manifest V3
npm run build
```

The production-ready extension will be compiled into `extension/build/chrome-mv3-prod`.

---

### 4. Load into Google Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked** (Paketlenmemiş öğe yükle).
4. Select the `extension/build/chrome-mv3-prod` folder.
5. Pin **PitchCraft AI** to your toolbar and launch it!

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
