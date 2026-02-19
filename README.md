# 💊 Smart Medicine Companion

**AI-powered healthcare assistant for medication management using Google Gemini**

A hackathon-winning project that transforms medication management from passive reminders into an intelligent, conversational, and proactive care system.

## 🌟 Features

- **📸 AI Prescription Scanner** - Upload prescription images and let Gemini Vision extract medication details
- **💬 AI Health Chat** - Natural language Q&A about medications powered by Gemini
- **⏰ Smart Reminders** - Browser notifications for medication schedules
- **🧠 Missed Dose Advisor** - AI reasoning engine for handling missed doses
- **💊 Medication Dashboard** - Track adherence and manage all medications
- **🎯 Elderly-Friendly UX** - Large fonts, high contrast, simple navigation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key ([Get one free](https://makersuite.google.com/app/apikey))

### Installation

1. **Navigate to project directory**
   ```bash
   cd "/Users/nishtha/Desktop/DevForge/smart medicine"
   ```

2. **Install dependencies** (already done if you followed setup)
   ```bash
   npm install
   ```

3. **Configure API Key**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Visit `http://localhost:5173`

## 🎯 Core User Flows

### 1. Add First Medication
1. Click "Scan Prescription" on dashboard
2. Upload or capture prescription image
3. AI extracts medication details
4. Review and confirm
5. Medication added to dashboard

### 2. Get Medication Guidance
1. Click "Ask AI" or "AI Assistant"
2. Type your question (e.g., "Can I take ibuprofen with my meds?")
3. Get instant, contextual AI response

### 3. Handle Missed Dose
1. App detects missed dose
2. Alert shown on dashboard
3. Click "Get AI Guidance"
4. Gemini analyzes and provides safe recommendation
5. Follow AI advice (take now, skip, call doctor)

## 🛠 Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **CSS Variables** - Healthcare color system
- **Lucide React** - Icons

### AI/ML
- **Google Gemini 2.0 Flash** - Multimodal AI
- **Vision API** - Prescription image analysis
- **Text Generation** - Chat and reasoning

### State Management
- **React Context** - Global medication state
- **LocalStorage** - Data persistence

### Notifications
- **Browser Notification API** - Medication reminders

## 📁 Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx              # Main dashboard with schedule
│   ├── PrescriptionScanner.jsx    # AI prescription image analysis
│   ├── ChatAssistant.jsx          # Gemini-powered chat
│   ├── MissedDoseAdvisor.jsx      # AI missed dose reasoning
│   └── MedicationList.jsx         # Medication management
├── context/
│   └── MedicationContext.jsx      # Global state management
├── utils/
│   ├── gemini.js                  # Gemini AI integration
│   └── notifications.js           # Browser notifications
├── styles/
│   └── main.css                   # Healthcare-focused styling
├── App.jsx                        # Main app component
└── main.jsx                       # Entry point
```

## 🎨 Design Principles

- **Elderly-First**: Large 18px+ fonts, 48px+ touch targets, high contrast
- **Trustworthy**: Medical blue (#0066CC), professional color palette
- **Accessible**: WCAG AA compliant, keyboard navigation, reduced motion support
- **Premium**: Subtle shadows, smooth transitions, modern glassmorphism

## 🧪 Testing the App

### Test Prescription Scanning
1. Use a sample prescription image or create one
2. Test with different image qualities
3. Verify extracted medication details are accurate
4. Confirm medications appear on dashboard

### Test AI Chat
1. Ask: "Can I take these medications together?"
2. Ask: "What should I do if I miss a dose?"
3. Test multilingual support (if configured)
4. Verify responses are safe and helpful

### Test Reminders
1. Add a medication with a schedule 1 minute from now
2. Grant notification permissions
3. Wait for notification to appear
4. Click notification and verify app interaction

### Test Missed Dose Logic
1. Set medication time in the past
2. Refresh app
3. Check for missed dose alert
4. Click "Get AI Guidance"
5. Verify AI provides contextual advice

## 🔐 Privacy & Security

- **Local-first**: All data stored in browser LocalStorage
- **No backend**: Frontend-only for hackathon MVP
- **API key security**: Configure via .env (never commit .env)
- **HIPAA-ready**: Architecture designed for future compliance

## 🏆 Hackathon Demo Tips

1. **Setup Demo Data**: Pre-load 2-3 medications before presenting
2. **Prepare Test Prescription**: Have a clear prescription image ready
3. **Enable Notifications**: Grant permission before demo starts
4. **Showcase AI**: Demo the chat with interesting questions
5. **Highlight Missed Dose**: Show the AI reasoning in action

## 📝 Future Enhancements

- [ ] User authentication (Firebase/Auth0)
- [ ] Backend API for scalability
- [ ] Caregiver dashboard (multi-patient management)
- [ ] WhatsApp integration
- [ ] Wearable device sync (Apple Health, Fitbit)
- [ ] Emergency 112 integration
- [ ] Voice commands (Speech Recognition API)
- [ ] PWA with offline mode

## 🐛 Troubleshooting

### API Key Error
```
⚠️ Gemini API key not found
```
**Solution**: Create `.env` file with `VITE_GEMINI_API_KEY=your_key`

### Notifications Not Working
**Solution**: Click "Allow" when browser asks for notification permission

### Images Not Processing
**Solution**: Check API key is valid and has Gemini Vision access

### Port Already in Use
**Solution**: Kill existing process or change port:
```bash
npm run dev -- --port 3000
```

## 📄 License

MIT License - Built for educational and hackathon purposes

## 🙏 Acknowledgments

- **Google Gemini** - Multimodal AI platform
- **React Team** - UI framework
- **Vite Team** - Lightning-fast build tool
- **Healthcare Community** - Inspiration for solving real problems

## 👨‍💻 Author

Built with ❤️ for improving healthcare accessibility

---

**Note**: This is a hackathon MVP. For production use, implement proper backend, authentication, HIPAA compliance, and medical professional validation.
