import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log('Searching for Gemini 2.0 models...');
        const response = await ai.models.list();

        let models = [];
        if (Array.isArray(response)) {
            models = response;
        } else if (response.models && Array.isArray(response.models)) {
            models = response.models;
        } else if (response.data && response.data.models) {
            models = response.data.models;
        }

        const v2Models = models.filter(m => m.name.includes('gemini-2.0'));

        if (v2Models.length > 0) {
            console.log('Found Gemini 2.0 models:', v2Models.map(m => m.name).join(', '));
        } else {
            console.log('No Gemini 2.0 models found.');
            // List all to be sure what we have
            const geminis = models.filter(m => m.name.includes('gemini'));
            console.log('All Gemini models:', geminis.map(m => m.name).join(', '));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
