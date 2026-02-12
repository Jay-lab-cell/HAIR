import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log('Keys of ai instance:', Object.keys(ai));
console.log('Keys of ai.models instance:', Object.keys(ai.models));
// Check prototype?
console.log('Prototype keys of ai:', Object.getOwnPropertyNames(Object.getPrototypeOf(ai)));
