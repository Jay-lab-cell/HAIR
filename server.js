import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

import { ANALYZE_PROMPT, getStyleEditPrompt } from './prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Initialize Gemini
// using gemini-2.0-flash as it is stable and cost-effective (free tier compatible)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ==========================================
// POST /api/analyze — 얼굴형 분석 + 추천 스타일
// ==========================================
app.post('/api/analyze', upload.single('selfie'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: '이미지가 필요합니다' });

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        console.log('🔍 얼굴형 분석 요청 (Gemini 2.0 Flash)...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: ANALYZE_PROMPT },
                        { inlineData: { mimeType, data: base64Image } }
                    ]
                }
            ]
        });

        const text = response.candidates[0].content.parts
            .filter(p => p.text)
            .map(p => p.text)
            .join('');

        // Parse JSON from response (handle markdown code blocks)
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1];

        const analysis = JSON.parse(jsonStr.trim());

        console.log('✅ 얼굴형 분석 완료:', analysis.faceType);
        res.json(analysis);

    } catch (error) {
        console.error('❌ 분석 오류:', error);
        res.status(500).json({ error: '분석 중 오류가 발생했습니다: ' + error.message });
    }
});

// ==========================================
// POST /api/generate-style — 헤어스타일 합성 (Gemini 3 Pro Image)
// ==========================================
const IMAGEN_API_KEY = process.env.IMAGEN_API_KEY;
const imagenAi = new GoogleGenAI({ apiKey: IMAGEN_API_KEY });

app.post('/api/generate-style', upload.single('selfie'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: '이미지가 필요합니다' });

        const { stylePrompt, styleName } = req.body;
        console.log(`🎨 스타일 이미지 생성 요청: ${styleName} (Gemini 3 Pro Image)...`);

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        const editPrompt = getStyleEditPrompt(stylePrompt);

        const response = await imagenAi.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: editPrompt },
                        { inlineData: { mimeType, data: base64Image } }
                    ]
                }
            ],
            config: {
                responseModalities: ['TEXT', 'IMAGE']
            }
        });

        // Extract generated image from response
        let generatedImage = null;
        let textResponse = '';

        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                textResponse += part.text;
            } else if (part.inlineData) {
                generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        if (generatedImage) {
            console.log(`✅ 스타일 이미지 생성 완료: ${styleName}`);
            res.json({
                image: generatedImage,
                text: textResponse || `${styleName} 스타일이 적용되었습니다.`
            });
        } else {
            // Fallback: return original image with text description
            console.log(`⚠️ 이미지 생성 실패, 텍스트만 반환: ${styleName}`);
            res.json({
                image: `data:${mimeType};base64,${base64Image}`,
                text: textResponse || '이미지 생성에 실패했습니다.'
            });
        }

    } catch (error) {
        console.error('❌ 이미지 생성 오류:', error);
        res.status(500).json({ error: '생성 중 오류가 발생했습니다: ' + error.message });
    }
});

// ==========================================
// Serve frontend
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'code.html'));
});

// Vercel serverless export
export default app;

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`
🚀 AI 헤어스타일 서버 시작! (Real AI RESTORED)
📍 http://localhost:${PORT}
🔑 API 키: ${process.env.GEMINI_API_KEY ? '설정됨 ✅' : '미설정 ❌'}
    `);
    });
}
