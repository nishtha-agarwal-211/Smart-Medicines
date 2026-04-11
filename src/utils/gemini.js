import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Analyze prescription image and extract medication information
 * @param {File} imageFile - The prescription image file
 * @returns {Promise<Object>} Extracted medication data
 */
export async function analyzePrescription(imageFile) {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert image to base64
    const imageData = await fileToGenerativePart(imageFile);

    const prompt = `You are a medical AI assistant analyzing a prescription image. Extract ALL medication information in JSON format.

For EACH medication found, provide:
- drugName: Full medication name
- dosage: Exact dosage (e.g., "500mg", "10ml")
- frequency: How often (e.g., "twice daily", "once daily", "three times daily")
- timing: Array of times (e.g., ["morning", "evening"])
- withFood: Boolean - should be taken with food
- duration: Treatment duration if specified (e.g., "30 days", "ongoing")
- warnings: Array of important warnings or side effects
- prescribedBy: Doctor's name if visible
- prescriptionDate: Date if visible

Return ONLY valid JSON with an array called "medications". If you can't read the prescription clearly, return an empty array.

Example format:
{
  "medications": [
    {
      "drugName": "Metformin",
      "dosage": "500mg",
      "frequency": "twice daily",
      "timing": ["morning", "evening"],
      "withFood": true,
      "duration": "ongoing",
      "warnings": ["May cause nausea", "Monitor blood sugar"],
      "prescribedBy": "Dr. Sharma",
      "prescriptionDate": "2026-02-05"
    }
  ]
}`;

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data.medications || [];
    }

    return [];
  } catch (error) {
    console.error('Error analyzing prescription:', error);
    throw new Error('Failed to analyze prescription. Please try again.');
  }
}

/**
 * Chat with Gemini about medications and health queries
 * @param {string} message - User's question
 * @param {Array} medications - User's current medications for context
 * @param {Object} userProfile - Optional user profile for personalised context
 * @returns {Promise<string>} AI response
 */
export async function chatWithGemini(message, medications = [], userProfile = {}) {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const medicationContext = medications.length > 0
      ? `\n\nCurrent medications:\n${medications.map(m => `- ${m.drugName} ${m.dosage} (${m.frequency})`).join('\n')}`
      : '';

    // Build patient context from profile
    const age = userProfile.dob
      ? Math.floor((Date.now() - new Date(userProfile.dob)) / (365.25 * 24 * 3600 * 1000))
      : userProfile.age || null;

    const patientContext = [
      userProfile.name   ? `Patient name: ${userProfile.name}` : null,
      age                ? `Age: ${age} years old` : null,
      userProfile.gender ? `Gender: ${userProfile.gender}` : null,
      userProfile.bloodType ? `Blood type: ${userProfile.bloodType}` : null,
    ].filter(Boolean).join(', ');

    const prompt = `You are a helpful, empathetic healthcare AI assistant for medication management. 

IMPORTANT SAFETY GUIDELINES:
- Always encourage users to consult their doctor for serious concerns
- Never diagnose conditions or recommend prescription medications
- Focus on medication adherence, general health education, and support
- Be clear about drug interactions and safety concerns
- Use simple, elderly-friendly language${patientContext ? `\n\nPatient profile: ${patientContext}` : ''}${medicationContext}

User question: ${message}

Provide a helpful, concise response (2-3 paragraphs max). Use ✅ ⚠️ 💊 emojis when appropriate to make it easy to read.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error chatting with Gemini:', error);
    throw new Error('Failed to get response. Please try again.');
  }
}

/**
 * Analyze missed dose and provide reasoning on what to do
 * @param {Object} medication - The medication that was missed
 * @param {number} hoursLate - How many hours late
 * @param {string} nextDoseTime - When the next dose is scheduled
 * @returns {Promise<Object>} Advice and reasoning
 */
export async function analyzeMissedDose(medication, hoursLate, nextDoseTime) {
  if (!genAI) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a medication safety AI. A patient missed their medication dose.

Medication: ${medication.drugName} ${medication.dosage}
Frequency: ${medication.frequency}
Hours late: ${hoursLate}
Next scheduled dose: ${nextDoseTime}

Provide guidance in JSON format:
{
  "action": "take_now" | "skip_and_continue" | "take_half" | "call_doctor",
  "reasoning": "Detailed reasoning for the recommendation",
  "safetyNotes": "Important safety considerations",
  "advice": "Simple actionable advice for the patient"
}

IMPORTANT:
- If very late (>12 hours for daily meds), usually best to skip
- If close to next dose (within 4 hours), skip this one
- For critical medications (blood thinners, heart meds, insulin), advise calling doctor
- Always prioritize patient safety`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback response
    return {
      action: 'call_doctor',
      reasoning: 'Unable to determine safe action',
      safetyNotes: 'Please consult your healthcare provider',
      advice: 'Contact your doctor or pharmacist for guidance on this missed dose.'
    };
  } catch (error) {
    console.error('Error analyzing missed dose:', error);
    throw new Error('Failed to analyze missed dose. Please consult your doctor.');
  }
}

/**
 * Check for drug interactions
 * @param {Array} medications - All user medications
 * @returns {Promise<Array>} List of potential interactions
 */
export async function detectDrugInteractions(medications) {
  if (!genAI || medications.length < 2) {
    return [];
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const medList = medications.map(m => `${m.drugName} ${m.dosage}`).join(', ');

    const prompt = `You are a pharmacology AI. Check for drug interactions between these medications:

${medList}

Return JSON array of interactions:
[
  {
    "drug1": "Drug A",
    "drug2": "Drug B",
    "severity": "high" | "moderate" | "low",
    "description": "Brief description of the interaction",
    "recommendation": "What the patient should do"
  }
]

Only report clinically significant interactions. Return empty array [] if no significant interactions found.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error('Error detecting interactions:', error);
    return [];
  }
}

/**
 * Helper function to convert file to Gemini-compatible format
 */
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default {
  analyzePrescription,
  chatWithGemini,
  analyzeMissedDose,
  detectDrugInteractions
};
