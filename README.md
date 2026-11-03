PitchCraft AI ⚡
Serbest Çalışan (Freelance) Platformları (Upwork) İçin Yapay Zekâ Destekli Teklif Asistanı

Google Chrome Manifest V3, React, TypeScript ve Google Gemini 3.5 Flash ile güçlendirilmiş güvenli bir Node.js/Express arka ucu ile geliştirilmiştir.

📌 Genel Bakış
PitchCraft AI, serbest çalışanların Upwork gibi platformlarda 3 saniyenin altında özlü, yüksek oranda kişiselleştirilmiş ve dönüşüm oranı yüksek teklifler hazırlamasına yardımcı olmak için tasarlanmış açık kaynaklı bir verimlilik uzantısıdır.

Kalıp ve jenerik yapay zekâ ön yazı taslakları üretmek yerine; müşterinin özel gereksinimlerini, teknik zorluklarını ve eleme sorularını analiz ederek bunları doğrudan serbest çalışanın portföyü, yetenek seti ve iletişim tarzıyla eşleştirir.

🏗️ Mimari ve Güvenlik
Chrome uzantıları kullanıcının tarayıcısında çalışır; bu da istemci tarafı (client-side) kodlarının kaynak kod incelemesine veya tersine mühendisliğe açık olması anlamına gelir. API anahtarının sızmasını ve kötüye kullanımını önlemek amacıyla PitchCraft, Güvenli Proxy Arka Uç Mimarisi (Secure Proxy Backend Architecture) kullanır:

┌──────────────────────────────────────────┐
│       Chrome Tarayıcısı (Manifest V3)    │
│       • Açılır Arayüz (React + TS)       │
│       • İçerik Betikleri (DOM Hook)      │
│       • Yerel Depolama (State Sync)      │
└────────────────────┬─────────────────────┘
                     │  x-pitchcraft-secret (Doğrulama Başlığı)
                     ▼
┌──────────────────────────────────────────┐
│       Güvenli Proxy Sunucusu (Express)   │
│       • İstek Sınırlama & CORS Kalkanı   │
│       • Kullanım Sayacı & Kota Koruması  │
│       • Prompt Mühendisliği Motoru       │
└────────────────────┬─────────────────────┘
                     │  Sunucudan Sunucuya HTTPS
                     ▼
┌──────────────────────────────────────────┐
│            Google Gemini 3.5 Flash       │
│       • systemInstruction Bağlamı        │
│       • Düşük Gecikmeli İçerik Üretimi   │
└──────────────────────────────────────────┘
Temel Mühendislik Kararları:
Sıfır Gizli Anahtar Sızıntısı: Google Gemini API anahtarı yalnızca sunucudaki .env dosyasında barındırılır. Uzantı, sunucuyla yalnızca kimlik doğrulaması yapılmış proxy uç noktaları üzerinden iletişim kurar.

Manifest V3 Standartları: Service worker mimarisini (background.ts) ve kapsamı sınırlandırılmış izinleri (activeTab, storage) kullanır.

Akıllı Prompt Mühendisliği: Prompt injection (komut enjeksiyonu) saldırılarını engellemek ve yüksek dönüşümlü metin yazarlığı standartlarını garanti altına almak için Gemini'nin yerel systemInstruction API'sini kullanır.

🚀 Teknoloji Yığını
Ön Yüz (Frontend): React 18, TypeScript, Plasmo Framework (Manifest V3)

Arka Yüz (Backend): Node.js, Express, express-rate-limit, CORS

Yapay Zekâ Motoru: Google Gemini 3.5 Flash API (v1beta)

Veritabanı (İsteğe Bağlı): Supabase (Satır Düzeyi Güvenlik / RLS destekli PostgreSQL)

Ödeme & Gelir Modeli: Lemon Squeezy (Freemium 10 kredi kotası)

📂 Dizin Yapısı
pitchcraft-ai/
├── extension/                 # Chrome Uzantısı (Plasmo + React + TypeScript)
│   ├── popup.tsx              # Uzantı açılır pencere arayüzü ve profil yönetimi
│   ├── background.ts          # Arka uç iletişimini yöneten Service Worker
│   ├── contents/              # Upwork DOM'u için sayfa içi içerik komut dosyaları
│   ├── assets/                # Uzantı ikonları (16, 32, 48, 64, 128px)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # Güvenli Express.js Proxy Sunucusu
│   ├── api/
│   │   └── index.js           # Express API uç noktaları (/api/generate, /api/user/sync)
│   ├── supabase_setup.sql     # Kalıcı kullanıcı kotaları için veritabanı şeması
│   ├── vercel.json            # Vercel için tek tıkla dağıtım yapılandırması
│   ├── .env.example           # Ortam değişkenleri şablonu
│   └── package.json
│
├── .gitignore
└── README.md
🛠️ Kurulum ve Başlangıç
1. Ön Koşullar
Node.js (v18 veya üzeri)

npm veya pnpm

Google Chrome tarayıcısı

Google Gemini API Anahtarı (Google AI Studio)

2. Arka Uç (Backend) Kurulumu
Bash
cd backend

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenleri şablonunu kopyalayın
cp .env.example .env
.env dosyasını açıp ilgili anahtarları tanımlayın:

Kod snippet'i
GEMINI_API_KEY=buraya_gemini_api_anahtariniz
EXTENSION_SECRET=buraya_pitchcraft_gizli_anahtari
PORT=3001
Sunucuyu başlatın:

Bash
npm run dev
# Sunucu şu adreste çalışır: http://127.0.0.1:3001
# Sağlık kontrolü uç noktası: http://127.0.0.1:3001/health
3. Uzantı (Extension) Kurulumu
Bash
cd ../extension

# Bağımlılıkları yükleyin
npm install

# Chrome Manifest V3 için uzantıyı derleyin
npm run build
Yayına hazır uzantı dosyaları extension/build/chrome-mv3-prod klasörüne derlenecektir.

4. Google Chrome'a Yükleme
Chrome'u açın ve adres çubuğuna chrome://extensions yazın.

Sağ üst köşedeki Geliştirici modu (Developer mode) anahtarını açın.

Sol üstteki Paketlenmemiş öğe yükle (Load unpacked) butonuna tıklayın.

extension/build/chrome-mv3-prod klasörünü seçin.

PitchCraft AI uzantısını araç çubuğuna sabitleyip kullanmaya başlayın!

📄 Lisans
Bu proje MIT Lisansı ile lisanslanmıştır - ayrıntılar için LICENSE dosyasına bakabilirsiniz.
