import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log('Checking ai.models methods...');
console.log('ai.models.predict exists?', typeof ai.models.predict);
console.log('ai.models.generateContent exists?', typeof ai.models.generateContent);

// Also check if there's an `imagen` namespace or similar if predict is missing
// console.log('ai.imagen exists?', typeof ai.imagen);
