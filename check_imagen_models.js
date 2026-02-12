import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log('Searching for Imagen models...');
        let models = [];
        // Try getting models again, assuming SDK handles pagination or returns full list
        // If not, we might miss some, but let's try.
        const response = await ai.models.list();

        if (Array.isArray(response)) {
            models = response;
        } else if (response.models && Array.isArray(response.models)) {
            models = response.models;
        } else if (response.data && response.data.models) {
            models = response.data.models;
        }

        const imagenModels = models.filter(m => m.name.includes('imagen'));

        if (imagenModels.length > 0) {
            console.log('Found Imagen models:', imagenModels.map(m => m.name).join(', '));
        } else {
            // Fallback: check all models again just in case
            // Note: In previous turn, "Gemini Models: " was empty too. 
            // This suggests the list() call isn't returning models properly or the key has NO access?
            // But valid key usually has access.
            // Maybe the response object structure is trickier.
            console.log('No Imagen models found in straightforward list.');
            console.log('Full response keys:', Object.keys(response));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
