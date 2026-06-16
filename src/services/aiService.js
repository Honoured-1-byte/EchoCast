/**
 * AI Service - Script generation using Groq APIs
 * Delegates audio generation to deepgramService
 */

import * as deepgramService from './deepgramService';

// --- CONFIGURATION ---
const MODELS = {
    SCRIPT: {
        PRIMARY: 'llama-3.3-70b-versatile', // Groq: Smartest (Expert/Creative)
        FALLBACK: 'llama-3.1-8b-instant'    // Groq: Fast (Host/Concise)
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
     * Uses Groq Llama 3.3 70B (Primary) -> Llama 3.1 8B (Fallback)
     */
    generateScript: async (systemPrompt, keys) => {
        let script = null;
        let usedModel = '';

        if (!keys.groq) throw new Error("Groq API Key is Missing.");

        // 1. TRY GROQ PRIMARY (Llama 70b)
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

        // 2. TRY GROQ FALLBACK (Llama 8b)
        if (!script) {
            try {
                console.log(`[AI] Engaging Fallback: ${MODELS.SCRIPT.FALLBACK}`);
                const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${keys.groq}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [{ role: "system", content: systemPrompt }],
                        model: MODELS.SCRIPT.FALLBACK
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    script = parseAIResponse(data.choices[0].message.content);
                    usedModel = MODELS.SCRIPT.FALLBACK;
                }
            } catch (e) { console.warn("[AI] Fallback Failed:", e); }
        }

        if (!script) throw new Error("All AI Models Failed. Please check your Groq API Key.");
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
