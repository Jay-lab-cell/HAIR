import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testImageGen() {
    try {
        console.log('Testing image generation...');
        // Try to generate a simple image
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'A futuristic haircut on a mannequin',
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1'
            }
        });

        console.log('Response keys:', Object.keys(response));
        if (response.generatedImages && response.generatedImages.length > 0) {
            console.log('Success! Image generated.');
            console.log('Image Base64 length:', response.generatedImages[0].image.base64.length);
        } else {
            console.log('No images returned.');
        }

    } catch (error) {
        console.error('Error generating image:', error);
    }
}

testImageGen();
