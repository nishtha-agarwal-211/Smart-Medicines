import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error('⚠️ Gemini API key not found');
    process.exit(1);
} else {
    const genAI = new GoogleGenerativeAI(API_KEY);

    async function listAvailableModels() {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Available Gemini Models:');
            console.log('========================');

            if (data.models && data.models.length > 0) {
                data.models.forEach(model => {
                    console.log(`\n• ${model.name}`);
                    console.log(`  Display Name: ${model.displayName}`);
                    console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
                });

                // Find suitable models for generateContent
                const contentModels = data.models.filter(m =>
                    m.supportedGenerationMethods?.includes('generateContent')
                );

                console.log('\n\n✅ Recommended models for chat:');
                contentModels.slice(0, 5).forEach(m => {
                    console.log(`   - ${m.name.replace('models/', '')}`);
                });
            } else {
                console.log('No models found');
            }
        } catch (error) {
            console.error('Error listing models:', error);
        }
    }

    listAvailableModels();
}
