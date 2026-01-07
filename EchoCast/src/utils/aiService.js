/**
 * AI Service - Script generation using Groq and Gemini APIs
 * Delegates audio generation to deepgramService
 */

import * as deepgramService from './deepgramService';

// --- CONFIGURATION ---
const MODELS = {
    SCRIPT: {
        PRIMARY: 'llama-3.3-70b-versatile', // Groq: Smartest
        FALLBACK_1: 'gemini-2.0-flash-exp', // Gemini: Reliable & Large Context
        FALLBACK_2: 'llama-3.1-8b-instant'  // Groq: Fast & Cheap
    }
};

// --- HELPER: JSON CLEANER ---
const parseAIResponse = (text) => {
    try {
        if (!text) return [];
        // Remove Markdown code blocks if present
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find JSON object bounds
        const firstOpen = clean.indexOf('{');
        const lastClose = clean.lastIndexOf('}');
        const firstArr = clean.indexOf('[');
        const lastArr = clean.lastIndexOf(']');

        // Prioritize Array if present
        if (firstArr !== -1 && lastArr !== -1) {
            clean = clean.substring(firstArr, lastArr + 1);
        } else if (firstOpen !== -1 && lastClose !== -1) {
            clean = clean.substring(firstOpen, lastClose + 1);
        }

        const json = JSON.parse(clean);

        // 1. Direct Array
        if (Array.isArray(json)) return json;

        // 2. Known Keys
        if (Array.isArray(json.dialogue)) return json.dialogue;
        if (Array.isArray(json.script)) return json.script;
        if (Array.isArray(json.conversation)) return json.conversation;

        // 3. Search for ANY array property
        for (const key in json) {
            if (Array.isArray(json[key])) return json[key];
        }

        // 4. Force wrapping if object looks like a single item (has speaker/text)
        if (json.speaker && json.text) return [json];

        console.warn("Could not find array in JSON response, got:", JSON.stringify(json).slice(0, 200));
        return []; // Return empty array to prevent crash
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return [];
    }
};

// --- SERVICE: SCRIPT GENERATION ---
export const aiService = {
    /**
     * Generate podcast script from prompt using AI models
     * Falls back from Groq → Gemini → Groq 8B if any fails
     */
    generateScript: async (systemPrompt, keys) => {
        let script = null;
        let usedModel = '';

        // 1. TRY GROQ (PRIMARY)
        if (keys.groq) {
            try {
                console.log(`[AI] Trying Primary: ${MODELS.SCRIPT.PRIMARY}`);
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: "system", content: systemPrompt + " RESPOND IN RAW JSON ONLY." }],
                        model: MODELS.SCRIPT.PRIMARY,
                        response_format: { type: "json_object" }
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    script = parseAIResponse(data.choices[0].message.content);
                    usedModel = MODELS.SCRIPT.PRIMARY;
                }
            } catch (e) { console.warn("[AI] Primary Failed:", e); }
        }

        // 2. TRY GEMINI (FALLBACK 1)
        if (!script && keys.gemini) {
            try {
                console.log(`[AI] Engaging Fallback: ${MODELS.SCRIPT.FALLBACK_1}`);
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELS.SCRIPT.FALLBACK_1}:generateContent?key=${keys.gemini}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: systemPrompt + " Respond with valid JSON array only. Do not use Markdown." }] }]
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    script = parseAIResponse(data.candidates[0].content.parts[0].text);
                    usedModel = MODELS.SCRIPT.FALLBACK_1;
                }
            } catch (e) { console.warn("[AI] Fallback 1 Failed:", e); }
        }

        // 3. TRY GROQ 8B (FALLBACK 2)
        if (!script && keys.groq) {
            try {
                console.log(`[AI] Engaging Safety Net: ${MODELS.SCRIPT.FALLBACK_2}`);
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: "system", content: systemPrompt }],
                        model: MODELS.SCRIPT.FALLBACK_2
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    script = parseAIResponse(data.choices[0].message.content);
                    usedModel = MODELS.SCRIPT.FALLBACK_2;
                }
            } catch (e) { console.warn("[AI] Safety Net Failed:", e); }
        }

        if (!script) throw new Error("All Intelligence Layers Failed.");
        return script;
    },

    /**
     * Generate audio from text using Deepgram service
     * Delegates to deepgramService.generateAudio
     */
    generateAudio: async (text, voiceName, deepgramKey) => {
        return await deepgramService.generateAudio(text, voiceName, deepgramKey);
    },

    /**
     * Convert base64 audio to Blob
     * Delegates to deepgramService.base64ToBlob
     */
    base64ToBlob: (base64, type) => {
        return deepgramService.base64ToBlob(base64, type);
    }
};
