# 💊 Smart Medicine Companion

> **AI-powered medication management assistant built with React + Google Gemini**

A personal project that transforms medication management from passive reminders into an intelligent, conversational, and proactive healthcare companion — designed with elderly patients in mind.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=google)](https://ai.google.dev)
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

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/smart-medicine.git
cd smart-medicine

# 2. Install dependencies
npm install

# 3. Configure API key
cp .env.example .env
# Edit .env and set: VITE_GEMINI_API_KEY=your_actual_key_here

# 4. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 + Vite 7 |
| **AI** | Google Gemini 2.5 Flash (multimodal) |
| **Styling** | Vanilla CSS with custom properties, split into component files |
| **Icons** | Lucide React |
| **PDF** | jsPDF |
| **QR Code** | `qrcode` npm package |
| **State** | React Context API + localStorage |
| **Notifications** | Browser Notification API |
| **Voice** | Web Speech API |

---

## 📁 Project Structure

```
smart-medicine/
├── .env.example               # API key template
├── index.html
├── vite.config.js
│
└── src/
    ├── App.jsx                # Root router + providers + dark mode
    ├── main.jsx
    │
    ├── components/            # 13 UI components
    │   ├── Dashboard.jsx      # Stats, schedule, interactions, chart
    │   ├── UserProfile.jsx    # Name, DOB, blood type, gender
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
    │   └── MedicalConditionForm.jsx
    │
    ├── context/               # 3 global state providers
    │   ├── UserProfileContext.jsx
    │   ├── MedicationContext.jsx
    │   └── EmergencyProfileContext.jsx
    │
    ├── utils/                 # Core logic
    │   ├── gemini.js          # All Gemini AI calls
    │   ├── notifications.js   # Scheduling + recurring reminders
    │   ├── emergencyPdf.js    # PDF generation
    │   └── qrCode.js          # QR encode/decode
    │
    └── styles/
        ├── main.css           # @import index (entry point)
        └── components/        # Per-component CSS files
            ├── _variables.css
            ├── _base.css
            ├── buttons.css
            ├── dashboard.css
            ├── scanner.css
            ├── chat.css
            ├── missed-dose.css
            ├── medication-list.css
            ├── manual-entry.css
            ├── emergency.css
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

- **Local-first** — all data lives in the browser's `localStorage`
- **No backend, no accounts** — nothing leaves your device
- **API calls** — only the Gemini API is contacted (for AI features)
- **Never commit `.env`** — the API key is kept out of version control

> ⚠️ **Note:** For a production healthcare app, you would need a secure backend, end-to-end encryption, and HIPAA compliance. This is a personal/portfolio project.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| `⚠️ Gemini API Key Required` banner | Create `.env` from `.env.example` and add your key |
| Notifications not appearing | Click **Allow** when the browser prompts for permission |
| Prescription scan returns no meds | Ensure image is clear and well-lit; verify API key has Gemini Vision access |
| Dark mode not persisting | Clear localStorage (`localStorage.clear()` in browser console) and retry |
| Port 5173 already in use | `npm run dev -- --port 3000` |

---

## 🔮 Future Improvements

- [ ] **PWA / Service Worker** — true offline mode + background push notifications
- [ ] **Authentication** — Firebase/Auth0 for multi-device sync
- [ ] **Backend API** — secure storage + HIPAA-ready architecture
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
