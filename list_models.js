import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log('Fetching models...');
        const response = await ai.models.list();

        // It seems the SDK returns a custom object with internal pagination state
        // Let's try to access 'pageInternal' or see if there is a method to get all

        if (response.pageInternal) {
            console.log('Found pageInternal, inspecting...');
            // Assuming pageInternal has the array of models
            // The previous JSON output showed it had models array directly?
            // Let's just stringify pageInternal
            console.log(JSON.stringify(response.pageInternal, null, 2));
        } else {
            // Fallback: the SDK might allow iteration via .next() or similar?
            console.log('No pageInternal found. Full response keys:', Object.keys(response));
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
