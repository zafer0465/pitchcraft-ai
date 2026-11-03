# PitchCraft AI ⚡

> **Freelance Platformları (Upwork) İçin Yapay Zekâ Destekli Akıllı Teklif Asistanı**  
> **Google Chrome Manifest V3**, **React**, **TypeScript** ve **Google Gemini 3.5 Flash** ile güçlendirilmiş güvenli **Node.js/Express** proxy mimarisi.

---

## 📌 Genel Bakış

**PitchCraft AI**, serbest çalışanların Upwork gibi platformlarda saniyeler içinde doğrudan işe odaklanan, kişiselleştirilmiş ve dönüşüm oranı yüksek teklifler (proposal / cover letter) hazırlamasını sağlayan açık kaynaklı bir Chrome tarayıcı uzantısıdır.

Klasik ve kalıp yapay zekâ metinleri yerine; iş ilanındaki spesifik teknik gereksinimleri, müşteri problemlerini ve eleme sorularını doğrudan analiz eder; bunları geliştiricinin veya serbest çalışanın yetenek seti ve deneyimleriyle eşleştirir.

---

## ✨ Öne Çıkan Özellikler

- ⚡ **3 Saniyede Teklif Üretimi:** Upwork iş ilanını otomatik analiz ederek optimize edilmiş teklif taslağı çıkarır.
- 🎯 **Kişiselleştirilmiş Eşleştirme:** İlan gereksinimlerini profilinizdeki yetenek ve portföy verileriyle bağlar.
- 🛡️ **Güvenli Proxy Mimarisi:** API anahtarlarını tarayıcıda tutmaz; sunucu tarafında güvenli bir şekilde saklar.
- 🧩 **Manifest V3 Uyumlu:** Modern Chrome uzantı standartlarına, servis çalışanlarına (service workers) ve sıkı izin politikalarına tam uyumludur.
- 🤖 **Doğal Prompt Mühendisliği:** Gemini `systemInstruction` API'si ile prompt sızıntılarını (prompt injection) önler.

---

## 🏗️ Mimari ve Güvenlik

Chrome uzantıları istemci tarafında (client-side) çalıştığı için kaynak kodları incelenebilir. API anahtarının yetkisiz kişilerin eline geçmesini ve kötüye kullanımını önlemek amacıyla PitchCraft **Secure Proxy Backend** mimarisini kullanır:

```
┌──────────────────────────────────────────┐
│       Chrome Tarayıcısı (Manifest V3)    │
│       • Açılır Pencere UI (React + TS)   │
│       • Sayfa İçi Betikler (DOM Hook)    │
│       • Yerel Durum Yönetimi (Storage)   │
└────────────────────┬─────────────────────┘
                     │  x-pitchcraft-secret (Doğrulama Başlığı)
                     ▼
┌──────────────────────────────────────────┐
│       Güvenli Proxy Sunucusu (Express)   │
│       • İstek Sınırlama (Rate Limit)     │
│       • CORS ve Kota Koruması            │
│       • Prompt İşleme & Formatlama       │
└────────────────────┬─────────────────────┘
                     │  Sunucudan Sunucuya HTTPS
                     ▼
┌──────────────────────────────────────────┐
│            Google Gemini 3.5 Flash       │
│       • systemInstruction Bağlamı        │
│       • Düşük Gecikmeli Metin Üretimi    │
└──────────────────────────────────────────┘
```

---

## 🚀 Teknoloji Yığını

| Katman | Teknolojiler |
| :--- | :--- |
| **Frontend (Extension)** | React 18, TypeScript, [Plasmo Framework](https://www.plasmo.com/) (Manifest V3) |
| **Backend (Proxy API)** | Node.js, Express.js, `express-rate-limit`, CORS |
| **Yapay Zekâ Motoru** | Google Gemini 3.5 Flash (`v1beta`) |
| **Veritabanı (Opsiyonel)** | Supabase (PostgreSQL with RLS) |
| **Ödeme / Kota Hook'u** | Lemon Squeezy (Freemium 10 kredi modeli) |

---

## 📂 Dizin Yapısı

```bash
pitchcraft-ai/
├── extension/                 # Chrome Uzantı Kaynak Kodları (Plasmo)
│   ├── popup.tsx              # Uzantı ana kullanıcı arayüzü & profil formu
│   ├── background.ts          # Backend iletişimini sağlayan Service Worker
│   ├── contents/              # Upwork DOM'una bağlanan içerik betikleri
│   ├── assets/                # İkonlar ve görsel varlıklar (16-128px)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                   # Güvenli Express.js Proxy Sunucusu
│   ├── api/
│   │   └── index.js           # API uç noktaları (/api/generate, /api/user/sync)
│   ├── supabase_setup.sql     # Kota ve kullanıcı tabloları için SQL şeması
│   ├── vercel.json            # Vercel tek tıkla dağıtım konfigürasyonu
│   ├── .env.example           # Örnek ortam değişkenleri
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Ön Koşullar
- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- npm veya pnpm paket yöneticisi
- Google Chrome tarayıcısı
- [Google AI Studio](https://aistudio.google.com/) üzerinden alınmış bir Gemini API anahtarı

---

### 2. Arka Yüz (Backend) Kurulumu

```bash
cd backend

# Bağımlılıkları yükleyin
npm install

# Ortam değişkenleri dosyasını oluşturun
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
GEMINI_API_KEY=your_gemini_api_key_here
EXTENSION_SECRET=your_custom_secret_key_here
PORT=3001
```

Geliştirme sunucusunu başlatın:
```bash
npm run dev
# Sunucu: [http://127.0.0.1:3001](http://127.0.0.1:3001)
# Sağlık Kontrolü: [http://127.0.0.1:3001/health](http://127.0.0.1:3001/health)
```

---

### 3. Uzantı (Extension) Kurulumu ve Derleme

```bash
cd ../extension

# Bağımlılıkları yükleyin
npm install

# Chrome Manifest V3 için derleyin
npm run build
```

Derleme çıktısı `extension/build/chrome-mv3-prod` dizininde üretilecektir.

---

### 4. Chrome'a Yükleme

1. Tarayıcınızda `chrome://extensions` adresine gidin.
2. Sağ üst köşedeki **Geliştirici modu** (Developer mode) anahtarını aktif edin.
3. Sol üstteki **Paketlenmemiş öğe yükle** (Load unpacked) butonuna tıklayın.
4. `pitchcraft-ai/extension/build/chrome-mv3-prod` klasörünü seçin.
5. Uzantıyı araç çubuğuna sabitleyerek kullanmaya başlayabilirsiniz.

---

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına göz atabilirsiniz.
