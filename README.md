# 💊 Smart Medicine Companion

> **AI-powered medication management assistant built with React + Google Gemini + Firebase**

A personal project that transforms medication management from passive reminders into an intelligent, conversational, and proactive healthcare companion — designed with elderly patients in mind.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## ✨ Features

### 🤖 AI-Powered Core
| Feature | Description |
|---|---|
| **📸 Prescription Scanner** | Upload a photo → Gemini Vision extracts drug name, dosage, frequency, warnings |
| **💬 AI Health Chat** | Conversational Q&A with full medication + patient profile context |
| **🧠 Missed Dose Advisor** | AI reasoning engine — suggests take/skip/call doctor based on timing |
| **⚡ Drug Interaction Detector** | Scans all current medications for interactions (high/moderate/low severity) |

### 📊 Medication Management
| Feature | Description |
|---|---|
| **📋 7-Day Adherence Chart** | Visual bar chart of daily adherence with colour-coded severity |
| **💊 Refill Tracker** | Per-medication pill counter with low-supply alerts (≤7 pills) |
| **✏️ Edit Medications** | Full inline edit form — schedule, dosage, warnings, quantity |
| **🗓 Today's Schedule** | Real-time dose status: pending / taken / missed |

### 🚨 Emergency Features
| Feature | Description |
|---|---|
| **🪪 Emergency Card** | Printable card with all critical info + QR code |
| **📄 PDF Export** | One-tap PDF with name, blood type, meds, allergies, contacts |
| **📱 Share API** | Share emergency card via native device share sheet |
| **👤 User Profile** | Name, DOB, blood type, gender — auto-fills Emergency Card |

### 🔐 Authentication & Storage
| Feature | Description |
|---|---|
| **🔑 Login / Sign Up** | Premium glassmorphic auth page with email/password registration |
| **🟢 Google Sign-In** | One-click authentication via Google account |
| **🔒 Password Reset** | "Forgot password?" flow with email reset link |
| **☁️ Cloud Firestore** | All data stored in Google Cloud — syncs across devices |
| **👤 Per-User Isolation** | Each user has their own medications, profiles, and logs |
| **📦 Data Export** | Download all your data as a JSON backup from the Profile page |
| **💾 Offline Fallback** | App works without Firebase using localStorage with local auth |

### ⏰ Smart Reminders
- Browser notifications at scheduled dose times
- **Daily recurrence** — reminders self-reschedule every 24 hours
- **Hourly re-evaluation** — keeps reminders alive during long sessions
- Notification click navigates directly to the dashboard

### 🎨 UX & Accessibility
- **Dark mode** toggle (persisted across sessions)
- **Voice input** — Mic button in chat uses Web Speech API
- **Elderly-friendly** — 18px+ fonts, 48px+ touch targets, high contrast
- Fully responsive (mobile-first)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key → [Get one free](https://makersuite.google.com/app/apikey)
- (Optional) Firebase project → [Create one free](https://console.firebase.google.com)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/smart-medicine.git
cd smart-medicine

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set your keys (see below)

# 4. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Environment Variables

```env
# Required — AI features
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional — Cloud storage & auth (app works without these using localStorage)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **Without Firebase keys**, the app runs in **offline mode** — using localStorage for storage and a lightweight client-side auth. All features work identically; data just stays on the device.

### Firebase Setup (5 minutes)

If you want cloud storage and real authentication:

1. **Create project** at [Firebase Console](https://console.firebase.google.com)
2. **Enable Auth** → Build → Authentication → Email/Password (+ optionally Google)
3. **Create Firestore** → Build → Firestore Database → Start in test mode
4. **Get config** → Project Settings → Your apps → Web app → Copy config values
5. **Paste into `.env`** and restart the dev server

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + Vite 7 |
| **AI** | Google Gemini 2.5 Flash (multimodal) |
| **Backend** | Firebase (Auth + Cloud Firestore) |
| **Styling** | Vanilla CSS with custom properties, split into component files |
| **Icons** | Lucide React |
| **PDF** | jsPDF |
| **QR Code** | `qrcode` npm package |
| **State** | React Context API + Firestore real-time listeners |
| **Notifications** | Browser Notification API |
| **Voice** | Web Speech API |

---

## 📁 Project Structure

```
smart-medicine/
├── .env.example               # API key template (Gemini + Firebase)
├── index.html
├── vite.config.js
│
└── src/
    ├── App.jsx                # Auth gate + providers + dark mode
    ├── main.jsx
    │
    ├── components/
    │   ├── AuthPage.jsx       # Login / Sign-Up page (glassmorphic)
    │   ├── Dashboard.jsx      # Stats, schedule, interactions, chart
    │   ├── UserProfile.jsx    # Profile, sign out, data export
    │   ├── ChatAssistant.jsx  # AI chat + voice input
    │   ├── ConfirmModal.jsx   # Reusable confirmation dialog
    │   ├── MedicationList.jsx # View / edit / delete + refill tracker
    │   ├── PrescriptionScanner.jsx
    │   ├── ManualMedicationEntry.jsx
    │   ├── MissedDoseAdvisor.jsx
    │   ├── EmergencyProfile.jsx
    │   ├── EmergencyCard.jsx
    │   ├── EmergencyContactForm.jsx
    │   ├── AllergyForm.jsx
    │   ├── MedicalConditionForm.jsx
    │   ├── Onboarding.jsx
    │   ├── NotificationPanel.jsx
    │   ├── CaregiverShare.jsx
    │   ├── AdherenceCalendar.jsx
    │   └── PillVerifier.jsx
    │
    ├── context/               # 4 global state providers
    │   ├── AuthContext.jsx    # Firebase Auth (login, register, Google)
    │   ├── UserProfileContext.jsx
    │   ├── MedicationContext.jsx
    │   └── EmergencyProfileContext.jsx
    │
    ├── utils/
    │   ├── firebase.js        # Firebase initialization + config
    │   ├── StorageService.js   # Firestore CRUD wrapper + localStorage fallback
    │   ├── gemini.js          # All Gemini AI calls
    │   ├── notifications.js   # Scheduling + recurring reminders
    │   ├── schedule.js        # Medication scheduling logic
    │   ├── emergencyPdf.js    # PDF generation
    │   └── qrCode.js          # QR encode/decode
    │
    └── styles/
        ├── main.css           # @import index (entry point)
        └── components/        # Per-component CSS files
            ├── _variables.css
            ├── _base.css
            ├── buttons.css
            ├── auth.css       # Auth page glassmorphic styles
            ├── dashboard.css
            ├── scanner.css
            ├── chat.css
            ├── missed-dose.css
            ├── medication-list.css
            ├── manual-entry.css
            ├── emergency.css
            ├── calendar.css
            ├── caregiver.css
            ├── pill-verifier.css
            └── app-overlays.css
```

---

## 🎯 Core User Flows

### Add a Medication
1. Dashboard → **Scan Prescription** or **Add Manually**
2. AI extracts drug name, dosage, frequency, warnings from the image
3. Review → Confirm → appears on dashboard with reminders scheduled

### Get AI Guidance
1. Click **Ask AI** or the chat button
2. Ask in natural language: *"Can I take ibuprofen with my current meds?"*
3. AI responds with full context of your medications and profile

### Missed Dose
1. App detects a missed dose (checked every 60 seconds)
2. Alert banner appears → click **Get AI Guidance**
3. Gemini reasons over the drug name, timing, and half-life
4. Returns one of: *take now / skip / call doctor*

### Emergency Card
1. Fill out **User Profile** (name, DOB, blood type)
2. Add contacts and allergies in **Emergency Profile**
3. Open **Emergency Card** → Download as PDF or Share

---

## 🎨 Design System

- **Primary blue** `#0066CC` — trust, medicine, reliability
- **Success green** `#00A86B` — taken doses, good adherence
- **Warning orange** `#FF8C00` — missed doses, interactions
- **Dark mode** — full CSS variable override on `.app.dark`
- **Typography** — system-ui stack, 18px base, 700 weight headings

---

## 🔐 Privacy & Security

- **Firebase Auth** — industry-standard authentication powered by Google (bcrypt password hashing, JWT tokens)
- **Per-user data isolation** — each user's data is stored under their own Firestore namespace (`users/{uid}/...`)
- **Offline-capable** — Firestore IndexedDB cache keeps the app working without internet
- **Local fallback** — without Firebase configured, all data stays in `localStorage` with client-side auth
- **API calls** — only the Gemini API and Firebase services are contacted
- **Never commit `.env`** — API keys and Firebase config are kept out of version control

> ⚠️ **Note:** For a production healthcare app, you would need Firestore security rules, end-to-end encryption, and HIPAA compliance. This is a personal/portfolio project.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `⚠️ Gemini API Key Required` banner | Create `.env` from `.env.example` and add your Gemini key |
| Login page appears but Firebase isn't set up | The app works without Firebase — register with email/password using the local fallback |
| Google Sign-In not working | Ensure Firebase is configured and Google provider is enabled in Firebase Console → Authentication |
| Data not syncing across devices | Verify all `VITE_FIREBASE_*` keys are set in `.env` and Firestore database is created |
| Notifications not appearing | Click **Allow** when the browser prompts for permission |
| Prescription scan returns no meds | Ensure image is clear and well-lit; verify API key has Gemini Vision access |
| Dark mode not persisting | Clear localStorage (`localStorage.clear()` in browser console) and retry |
| Port 5173 already in use | `npm run dev -- --port 3000` |

---

## 🔮 Future Improvements

- [x] **Authentication** — Firebase Auth with email/password + Google Sign-In ✅
- [x] **Cloud Storage** — Cloud Firestore with real-time sync + offline persistence ✅
- [ ] **PWA / Service Worker** — true offline mode + background push notifications
- [ ] **Firestore Security Rules** — production-ready read/write rules per user
- [ ] **Wearable sync** — Apple Health / Fitbit / Google Fit
- [ ] **Multi-language** — i18n for non-English speaking elderly patients
- [ ] **Caregiver dashboard** — manage multiple patient profiles
- [ ] **WhatsApp / SMS alerts** — fallback when browser notifications fail
- [ ] **CSS Modules** — migrate from single CSS bundle to scoped styles

---

## 👩‍💻 Author

**Nishtha Agarwal**

Built with ❤️ as a personal project exploring AI in healthcare accessibility.

---

*MIT License — built for learning and portfolio purposes.*
