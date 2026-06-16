
/**
 * Deepgram Service - Unified audio generation using Deepgram TTS API
 * Primary audio provider for EchoCast podcast generation
 */

// Voice mapping from persona names to Deepgram voices
const VOICE_MAP = {
    'Puck': 'aura-2-orion-en',      // Male, conversational (Host: Skeptic)
    'Orus': 'aura-2-orion-en',      // Male, conversational (Host: Enthusiast)
    'Fenrir': 'aura-2-perseus-en',  // Male, authoritative (Host: Anchor)
    'Zephyr': 'aura-2-thalia-en',   // Female, warm (Expert: Philosopher)
    'Kore': 'aura-2-thalia-en',     // Female, warm (Expert: Techie)
    'Aoede': 'aura-2-thalia-en'     // Female, warm (Expert: Historian)
};

/**
 * Generate speech audio from text using Deepgram TTS REST API
 * @param {string} text - The text to convert to speech
 * @param {string} voiceName - Persona voice name (Puck, Zephyr, etc.)
 * @param {string} deepgramKey - Deepgram API key
 * @returns {Promise<string|null>} Base64 encoded audio or null if failed
 */
export const generateAudio = async (text, voiceName, deepgramKey) => {
    if (!deepgramKey) {
        console.warn('[deepgramService] No API key provided, audio generation skipped');
        return null;
    }

    // Sanitize: Remove "SpeakerName:" prefix if present
    const cleanText = text.replace(/^[\w\s]+:\s*/, '').trim();

    // Get Deepgram voice model from persona voice name
    const deepgramVoice = VOICE_MAP[voiceName] || 'aura-2-thalia-en';

    try {
        console.log(`[deepgramService] Generating audio with voice: ${deepgramVoice}`);
        
        // Use Deepgram REST API directly
        const response = await fetch('https://api.deepgram.com/v1/speak?model=' + deepgramVoice, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${deepgramKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: cleanText })
        });

        if (!response.ok) {
            throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Convert to base64 for storage/transmission
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);

        console.log(`[deepgramService] SUCCESS - Generated ${uint8Array.length} bytes of audio`);
        return base64;
    } catch (error) {
        console.error('[deepgramService] Audio generation failed:', error);
        return null; // Return null to trigger fallback to browser TTS
    }
};

/**
 * Convert base64 audio string to Blob
 * @param {string} base64 - Base64 encoded audio data
 * @param {string} type - MIME type (default: audio/wav)
 * @returns {Blob} Audio blob
 */
export const base64ToBlob = (base64, type = "audio/wav") => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
};
