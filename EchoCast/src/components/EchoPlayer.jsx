import { useState, Suspense } from 'react';
import { generatePodcastScript } from '../utils/groqService';
import NeuralOrb from './NeuralOrb';
import { PERSONAS } from '../config/personas'; // Import the config

// Helper: Plays audio file
const playAudio = (src) => {
    return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.volume = 0.3;
        audio.onended = resolve;
        audio.onerror = () => resolve(); // Don't crash if file missing
        audio.play();
    });
};

const EchoPlayer = () => {
    const [topic, setTopic] = useState("");
    const [status, setStatus] = useState("idle");
    // UPDATED: Default to Shravan
    const [currentPersona, setCurrentPersona] = useState(PERSONAS.shravan);

    // Smart Voice Function (ElevenLabs -> Fallback)
    const speakAI = async (text) => {
        const ELEVEN_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

        try {
            if (!ELEVEN_KEY) throw new Error("No ElevenLabs Key");

            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${currentPersona.voiceId}`,
                {
                    method: "POST",
                    headers: {
                        "xi-api-key": ELEVEN_KEY,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: "eleven_monolingual_v1",
                        voice_settings: { stability: 0.5, similarity_boost: 0.7 },
                    }),
                }
            );

            if (!response.ok) throw new Error("API Limit / Error");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            return new Promise((resolve) => {
                audio.onended = resolve;
                audio.play();
            });

        } catch (error) {
            console.warn("⚠️ Fallback to Browser Voice:", error);
            return new Promise((resolve) => {
                const utterance = new SpeechSynthesisUtterance(text);
                // Try to match gender for fallback
                const voices = window.speechSynthesis.getVoices();
                const genderKeyword = currentPersona.id === 'vaani' ? 'Female' : 'Male';
                utterance.voice = voices.find(v => v.name.includes(genderKeyword)) || voices[0];

                utterance.rate = 1;
                utterance.onend = resolve;
                window.speechSynthesis.speak(utterance);
            });
        }
    };

    const handleGenerate = async () => {
        if (!topic) return;
        setStatus("generating");

        try {
            // 1. Generate Script
            const script = await generatePodcastScript(topic, currentPersona);

            setStatus("playing");

            // 2. Audio Pipeline
            await playAudio('/intro.mp3');
            await speakAI(script);
            await playAudio('/outro.mp3');
        } catch (error) {
            console.error("Error generating episode:", error);
        }

        setStatus("idle");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 font-sans text-white relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black pointer-events-none"></div>

            {/* Main Card */}
            <div className="z-10 w-full max-w-lg flex flex-col items-center gap-6">

                {/* Header Display */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        ECHOCAST
                    </h1>
                    <p className="text-xs font-mono text-cyan-500 tracking-widest">
                        {status === 'idle' ? "SYSTEM ONLINE" : status === 'generating' ? "NEURAL UPLINK..." : "BROADCASTING"}
                    </p>
                </div>

                {/* 3D Orb (Center Stage) */}
                <div className="relative w-full h-64 flex items-center justify-center">
                    {/* Glow effect */}
                    <div className={`absolute w-40 h-40 bg-cyan-500 rounded-full blur-[100px] transition-opacity duration-500 ${status === 'playing' ? 'opacity-40' : 'opacity-10'}`}></div>
                    <Suspense fallback={<div className="animate-pulse text-cyan-500">Initializing Core...</div>}>
                        <NeuralOrb isPlaying={status === 'playing'} />
                    </Suspense>
                </div>

                {/* Controls */}
                <div className="w-full bg-gray-800/50 backdrop-blur-md p-6 rounded-2xl border border-gray-700 space-y-4 shadow-2xl">

                    {/* Persona Switcher - UPDATED FOR SHRAVAN/VAANI */}
                    <div className="flex justify-between items-center bg-gray-900 p-2 rounded-lg border border-gray-700">
                        <span className="text-xs text-gray-400 font-mono ml-2">HOST_ID:</span>
                        <select
                            value={currentPersona.id}
                            onChange={(e) => setCurrentPersona(PERSONAS[e.target.value])}
                            disabled={status !== 'idle'}
                            className="bg-gray-800 text-cyan-400 text-sm font-bold py-1 px-3 rounded focus:outline-none border border-transparent focus:border-cyan-500 cursor-pointer"
                        >
                            <option value="shravan">SHRAVAN (TECH)</option>
                            <option value="vaani">VAANI (EXPERT)</option>
                        </select>
                    </div>

                    {/* Input */}
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic..."
                        className="w-full bg-gray-900 text-white p-4 rounded-xl border border-gray-600 focus:border-cyan-500 focus:outline-none transition-all"
                        disabled={status !== 'idle'}
                    />

                    {/* Action Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={status !== 'idle'}
                        className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all ${status === 'idle'
                                ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                                : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {status === 'idle' ? "GENERATE EPISODE" : "ON AIR"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EchoPlayer;