# 🔮 Smart Medicine Companion — Suggested Features

This document outlines four high-impact feature recommendations designed to enhance accessibility, care coordination, and health tracking in the Smart Medicine Companion.

---

## 1. 🔊 Voice Read-Aloud for Medication Schedules
### Goal
Provide a text-to-speech option to read the daily schedule, dosage instructions, and critical safety warnings out loud. 

### Why it Matters
Elderly or visually impaired patients may struggle to read small text on screens. An auditory playback option dramatically increases accessibility.

### Implementation Strategy
1. **Core API**: Use the browser's native **Web Speech Synthesis API** (`window.speechSynthesis`), which is fully supported offline and requires no external API keys.
2. **Text Formatting**: Format the schedule data into natural, spoken English sentences.
3. **UI Elements**:
   - Add a "Listen" button with dynamic volume icons (`Volume2` / `VolumeX`) next to "Today's Schedule".
   - Show an active audio-pulse wave or glowing outline when speaking is in progress.
   - Stop reading automatically if the user leaves the page or clicks "Stop".

---

## 2. 👥 Caregiver Sharing & Refill Alerts
### Goal
Enable patients to easily share their active medications, daily adherence logs, or low-refill alerts (≤ 7 pills left) with family members or caregivers.

### Why it Matters
Many elderly patients rely on family or caregivers to coordinate refills and check if medications are taken.

### Implementation Strategy
1. **Caregiver Profile**: Add a "Caregiver Email/Phone" section in `UserProfile.jsx`.
2. **Refill Auto-Compile**: Scan medications to find those with low quantities.
3. **Sharing Interface**:
   - Create a pre-formatted message button: *"Hi, I have only 5 Metformin tablets left. Please help me refill this soon."*
   - Launch native sharing via the Web Share API (`navigator.share`) or direct links to WhatsApp (`https://wa.me/...`) and Email (`mailto:...`).

---

## 3. 📅 Adherence History Calendar
### Goal
Add a dedicated calendar page that tracks dosage compliance over the last 30 days and lets patients retroactively log doses.

### Why it Matters
Users may forget to log their medication in the app at the exact time they took it, resulting in inaccurate "Missed Dose" warnings and skewed adherence scores.

### Implementation Strategy
1. **Analytics Engine**: Map adherence logs to a 30-day grid calendar view.
2. **Retroactive Modals**: Let users tap on any past day in the calendar to:
   - Mark a previously missed dose as **taken late** or **taken retroactively**.
   - Edit the exact time they took the medication.
3. **Aesthetic Graphs**: Add a monthly trend graph indicating progress streaks and high-compliance weeks.

---

## 4. 📸 Pill Visual Verification Assistant
### Goal
Allow patients to take a photo of a physical pill and use Gemini Vision to verify if its characteristics (shape, color, imprint) match their active prescriptions.

### Why it Matters
Patients taking multiple medications can easily mix up their pills, which presents a high clinical safety risk.

### Implementation Strategy
1. **Vision Prompting**: Send the photo of the pill alongside the list of active prescriptions to the `gemini-2.5-flash` model.
2. **Assistant Prompt**:
   - *"Verify if this physical pill matches any medication in the patient's active cabinet: [Metformin, Aspirin]. Compare color, shape, and markings. Provide a confidence rating."*
3. **Safety Disclaimer**: Display a highly visible warnings panel reminding patients never to take unidentified pills without consulting a pharmacist.
