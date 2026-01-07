import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../utils/aiService';
import { ARCHETYPES } from '../config/personas';
import { THEMES } from '../config/themes';
import { Radio, Play, Pause, Power, Activity, History, Settings } from '../utils/icons.jsx';
import { CanvasVisualization } from './CanvasVisualization';
import { AudioReactor } from './AudioReactor';
import { SettingsModal } from './SettingsModal';
import { HistoryPanel } from './HistoryPanel';

// --- MAIN APP ---
export default function EchoCastTerminal() {
    // STATE: KEYS & AUTH
    const [view, setView] = useState('AUTH'); // AUTH, DASHBOARD, EDITOR, LIVE
    const [keys, setKeys] = useState({ groq: '', gemini: '', deepgram: '' });
    const [tempKeys, setTempKeys] = useState({ groq: '', gemini: '', deepgram: '' });
    const [authError, setAuthError] = useState('');

    // STATE: CONFIG
    const [topic, setTopic] = useState('');
    const [sourceMaterial, setSourceMaterial] = useState('');
    const [mode, setMode] = useState('CREATIVE'); // CREATIVE, DEEP_DIVE
    const [config, setConfig] = useState({
        vibe: 'cool',
        hostId: 'skeptic',
        expertId: 'philosopher'
    });

    // STATE: DATA
    const [script, setScript] = useState([]);
    const [history, setHistory] = useState([]);

    // STATE: RUNTIME
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentLine, setCurrentLine] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speakingPersona, setSpeakingPersona] = useState(null); // 'host' or 'expert'
    const [usedModel, setUsedModel] = useState('');

    // STATE: UI
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const audioRef = useRef(new Audio());
    const playbackTimeout = useRef(null);
    const playbackSessionRef = useRef(0);
    const utteranceRef = useRef(null); // Fix for GC bug

    // Derived
    const currentTheme = THEMES[config.vibe];
    const currentHost = ARCHETYPES.host.find(h => h.id === config.hostId);
    const currentExpert = ARCHETYPES.expert.find(e => e.id === config.expertId);

    // --- INIT ---
    // Load Voices
    const [voices, setVoices] = useState([]);
    useEffect(() => {
        const load = () => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
                setVoices(v);
            }
        };
        window.speechSynthesis.onvoiceschanged = load;
        load();
        const interval = setInterval(load, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const k = localStorage.getItem('echocast_keys_v2');
        if (k) {
            const storedKeys = JSON.parse(k);
            setKeys({
                ...storedKeys,
                deepgram: import.meta.env.VITE_DEEPGRAM_API_KEY || storedKeys.deepgram || ''
            });
            setView('DASHBOARD');
        } else {
            const envKeys = {
                groq: import.meta.env.VITE_GROQ_API_KEY || '',
                gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
                deepgram: import.meta.env.VITE_DEEPGRAM_API_KEY || ''
            };
            if (envKeys.groq && envKeys.gemini) {
                setKeys(envKeys);
                localStorage.setItem('echocast_keys_v2', JSON.stringify(envKeys));
                setView('DASHBOARD');
            }
        }
        const h = localStorage.getItem('echocast_history');
        if (h) setHistory(JSON.parse(h));
    }, []);

    // --- ACTIONS: AUTH ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (!tempKeys.groq.trim() || !tempKeys.gemini.trim()) return setAuthError("Both API Keys are required.");

        const finalKeys = {
            ...tempKeys,
            deepgram: import.meta.env.VITE_DEEPGRAM_API_KEY || ''
        };

        localStorage.setItem('echocast_keys_v2', JSON.stringify(finalKeys));
        setKeys(finalKeys);
        setView('DASHBOARD');
    };

    const handleLogout = () => {
        localStorage.removeItem('echocast_keys_v2');
        setKeys({ groq: '', gemini: '' });
        setView('AUTH');
        setShowSettings(false);
    };

    // --- ACTIONS: GENERATION ---
    const handleGenerate = async () => {
        const input = mode === 'CREATIVE' ? topic : sourceMaterial;
        if (!input.trim()) return;
        setIsGenerating(true);

        const systemPrompt = `You are a podcast scriptwriter creating a dialogue between a Host and Expert.

Host Name: ${currentHost.name}. Personality: ${currentHost.prompt}
Expert Name: ${currentExpert.name}. Personality: ${currentExpert.prompt}

Create a podcast script with EXACTLY 6 dialogue exchanges alternating Host/Expert about:
"${input.slice(0, 1000)}"

RULES:
- Output ONLY a JSON array with 6 objects
- Format: [{"speaker":"host","text":"..."},{"speaker":"expert","text":"..."},...]
- Each message 20-40 words
- Host starts, Expert responds, repeat 3 times
- Be engaging and informative
- NO MARKDOWN, NO BACKTICKS, PURE JSON ONLY

Do not include any explanation, code fence, or text outside the JSON array.`;

        try {
            const scriptData = await aiService.generateScript(systemPrompt, keys);
            setScript(scriptData);
            setUsedModel('Llama 3.3 + Gemini 2.5');
            setView('EDITOR');
        } catch (e) {
            console.error(e);
            setAuthError("Generation Failed: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const confirmScript = () => {
        const newEntry = {
            id: Date.now(),
            topic: mode === 'CREATIVE' ? topic : 'Deep Dive',
            date: new Date().toLocaleDateString(),
            script,
            config
        };
        const updated = [newEntry, ...history].slice(0, 10);
        setHistory(updated);
        localStorage.setItem('echocast_history', JSON.stringify(updated));

        setCurrentLine(0);
        setIsPlaying(true);
        playbackSessionRef.current++;
        setView('LIVE');
    };

    // --- ACTIONS: PLAYBACK ---
    const togglePlay = () => {
        if (isPlaying) {
            setIsPlaying(false);
            playbackSessionRef.current++;
            window.speechSynthesis.cancel();
            audioRef.current.pause();
            setSpeakingPersona(null);
            clearTimeout(playbackTimeout.current);
            utteranceRef.current = null;
        } else {
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        if (isPlaying && !isGenerating && script.length > 0) {
            playLine(currentLine);
        }
        return () => clearTimeout(playbackTimeout.current);
    }, [isPlaying, currentLine]); // eslint-disable-line

    const playLine = async (index) => {
        if (!isPlaying) return;
        const sessionId = playbackSessionRef.current;
        if (index >= script.length) {
            setIsPlaying(false);
            setSpeakingPersona(null);
            return;
        }

        const line = script[index];
        const speakerRole = line.speaker.toLowerCase().includes('host') || line.speaker.toLowerCase().includes('shravan') ? 'host' : 'expert';
        setSpeakingPersona(speakerRole);

        const text = line.text;
        const voiceName = speakerRole === 'host' ? currentHost.voiceName : currentExpert.voiceName;

        // 1. Try Deepgram TTS
        let audioBlob = null;
        try {
            const base64 = await aiService.generateAudio(text, voiceName, keys.deepgram);
            if (base64) {
                audioBlob = aiService.base64ToBlob(base64);
            }
        } catch (e) {
            console.warn("Deepgram Audio Failed, using fallback", e);
        }

        if (playbackSessionRef.current !== sessionId) return;

        if (audioBlob) {
            // AI Audio
            await new Promise(r => {
                audioRef.current.src = URL.createObjectURL(audioBlob);
                audioRef.current.play().catch(() => r());
                audioRef.current.onended = r;
            });
        } else {
            // Browser Fallback
            await new Promise(r => {
                const u = new SpeechSynthesisUtterance(text);
                const safeVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

                u.voice = speakerRole === 'host'
                    ? safeVoices.find(x => x.name.includes('Male') || x.name.includes('David') || x.name === 'Google US English')
                    : safeVoices.find(x => x.name.includes('Female') || x.name.includes('Zira') || x.name === 'Google UK English Female');

                u.rate = 1.0;

                u.onend = () => {
                    utteranceRef.current = null;
                    r();
                };

                u.onerror = (e) => {
                    console.error("TTS Error:", e);
                    utteranceRef.current = null;
                    r();
                };

                utteranceRef.current = u;

                if (window.speechSynthesis.paused) window.speechSynthesis.resume();
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            });
        }

        if (playbackSessionRef.current === sessionId && isPlaying) {
            playbackTimeout.current = setTimeout(() => {
                setCurrentLine(prev => prev + 1);
            }, 600);
        }
    };

    // --- HANDLERS FOR MODULAR COMPONENTS ---
    const handleLoadEpisode = (ep) => {
        setScript(ep.script);
        setConfig(ep.config || config);
        setCurrentLine(0);
        setView('LIVE');
        setShowHistory(false);
        setIsPlaying(false);
    };

    // --- RENDER ---
    return (
        <div className="h-screen w-full relative overflow-hidden font-sans bg-black text-white" style={{ backgroundColor: currentTheme.bg }}>
            {/* BACKGROUND */}
            <CanvasVisualization vibe={config.vibe} isPlaying={isPlaying} speakingPersona={speakingPersona} />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_120%)] pointer-events-none"></div>

            {/* AUTH SCREEN */}
            {view === 'AUTH' && (
                <div className="relative z-20 h-full flex items-center justify-center p-4">
                    <form onSubmit={handleLogin} className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                        <div className="flex justify-center mb-6"><div className="p-4 rounded-full bg-white/5"><Radio className="w-8 h-8" style={{ color: currentTheme.accent }} /></div></div>
                        <h1 className="text-2xl font-bold text-center mb-2 tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">ECHOCAST</h1>
                        <p className="text-center text-slate-400 text-sm mb-8">Production Studio v4.0</p>
                        <div className="space-y-4">
                            <input type="password" value={tempKeys.groq} onChange={e => setTempKeys({ ...tempKeys, groq: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-cyan-400 outline-none transition-colors" placeholder="Groq API Key (Script)" />
                            <input type="password" value={tempKeys.gemini} onChange={e => setTempKeys({ ...tempKeys, gemini: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:border-purple-400 outline-none transition-colors" placeholder="Gemini API Key (Audio)" />
                        </div>
                        {authError && <p className="text-red-400 text-xs mt-4 text-center">{authError}</p>}
                        <button type="submit" className="w-full mt-8 font-bold py-3 rounded-lg shadow-lg transition-all text-black" style={{ backgroundColor: currentTheme.accent }}>INITIALIZE SYSTEM</button>
                    </form>
                </div>
            )}

            {/* DASHBOARD */}
            {view === 'DASHBOARD' && (
                <div className="relative z-20 h-full flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <div className="w-full max-w-3xl space-y-8">
                        <div className="text-center">
                            <h2 className="text-4xl font-light tracking-tight mb-2">What's on the air?</h2>
                            <p className="text-sm text-slate-500 uppercase tracking-widest">Configure Broadcast</p>
                        </div>
                        <div className="relative group">
                            {mode === 'CREATIVE' ? (
                                <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter a topic (e.g. The Ethics of Mars Colonization)..." className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl py-6 px-8 text-xl text-center shadow-2xl focus:border-cyan-400/50 outline-none transition-all placeholder:text-white/20 resize-none h-32" />
                            ) : (
                                <textarea value={sourceMaterial} onChange={e => setSourceMaterial(e.target.value)} placeholder="Paste article text or notes here for a Deep Dive analysis..." className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl py-6 px-8 text-sm text-left shadow-2xl focus:border-cyan-400/50 outline-none transition-all placeholder:text-white/20 resize-none h-64" />
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2">Mode</label>
                                <div className="flex bg-black/40 rounded-lg p-1">
                                    <button onClick={() => setMode('CREATIVE')} className={`flex-1 text-[10px] py-1 rounded ${mode === 'CREATIVE' ? 'bg-white/20 text-white' : 'text-slate-500'}`}>Creative</button>
                                    <button onClick={() => setMode('DEEP_DIVE')} className={`flex-1 text-[10px] py-1 rounded ${mode === 'DEEP_DIVE' ? 'bg-white/20 text-white' : 'text-slate-500'}`}>Deep Dive</button>
                                </div>
                            </div>
                            <div className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2">Vibe</label>
                                <select value={config.vibe} onChange={e => setConfig({ ...config, vibe: e.target.value })} className="bg-transparent text-sm outline-none text-white w-full">
                                    {Object.values(THEMES).map(t => <option key={t.id} value={t.id} className="bg-black">{t.label}</option>)}
                                </select>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2">Host</label>
                                <select value={config.hostId} onChange={e => setConfig({ ...config, hostId: e.target.value })} className="bg-transparent text-sm outline-none text-white w-full">
                                    {ARCHETYPES.host.map(h => <option key={h.id} value={h.id} className="bg-black">{h.name}</option>)}
                                </select>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2">Expert</label>
                                <select value={config.expertId} onChange={e => setConfig({ ...config, expertId: e.target.value })} className="bg-transparent text-sm outline-none text-white w-full">
                                    {ARCHETYPES.expert.map(h => <option key={h.id} value={h.id} className="bg-black">{h.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={handleGenerate} disabled={isGenerating} className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-black transition-all hover:scale-105" style={{ backgroundColor: currentTheme.accent }}>
                                {isGenerating ? <Activity className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                {isGenerating ? "TUNING..." : "GENERATE SCRIPT"}
                            </button>
                            <button onClick={() => setShowSettings(true)} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"><Settings className="w-5 h-5" /></button>
                            {history.length > 0 && <button onClick={() => setShowHistory(true)} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"><History className="w-5 h-5" /></button>}
                        </div>
                    </div>
                </div>
            )}

            {/* EDITOR */}
            {view === 'EDITOR' && (
                <div className="relative z-20 h-full flex flex-col items-center p-6 animate-in fade-in slide-in-from-right duration-300">
                    <div className="w-full max-w-4xl flex flex-col h-full bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold tracking-widest text-white">SCRIPT REVIEW</h2>
                                <p className="text-xs text-slate-500 uppercase">Review and Edit before Broadcasting</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setView('DASHBOARD')} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors">BACK</button>
                                <button onClick={confirmScript} className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold text-black transition-colors" style={{ backgroundColor: currentTheme.accentSecond }}>
                                    GO LIVE <Play className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {script.map((line, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className={`w-24 text-[10px] font-bold uppercase tracking-wider pt-3 text-right opacity-50 ${line.speaker.toLowerCase().includes('host') ? 'text-cyan-400' : 'text-purple-400'}`}>
                                        {line.speaker.toLowerCase().includes('host') ? currentHost.name : currentExpert.name}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={line.text}
                                            onChange={(e) => {
                                                const newScript = [...script];
                                                newScript[idx].text = e.target.value;
                                                setScript(newScript);
                                            }}
                                            className="w-full bg-white/5 border border-white/5 rounded-lg p-3 text-sm text-slate-200 focus:bg-white/10 focus:border-white/20 outline-none resize-none transition-all"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE STUDIO */}
            {view === 'LIVE' && (
                <div className="relative z-20 h-full flex flex-col animate-in zoom-in duration-500">
                    {/* GOLDEN WAVES BACKGROUND */}
                    <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-amber-500/20 to-transparent"></div>
                        <svg className="absolute bottom-0 w-[200%] h-48 animate-float opacity-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
                            <path fill="rgba(251, 191, 36, 0.3)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                        </svg>
                    </div>

                    <header className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 border border-red-500/30 bg-red-500/10 rounded text-red-400 text-[10px] font-bold tracking-widest">
                                {isPlaying ? <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> ON AIR</> : <><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> PAUSED</>}
                            </div>
                            <h1 className="text-sm font-medium text-slate-400 uppercase tracking-widest hidden md:block truncate max-w-xs">{mode === 'CREATIVE' ? topic : 'Deep Dive Analysis'}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={togglePlay} className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                            </button>
                            <button onClick={() => {
                                setIsPlaying(false);
                                playbackSessionRef.current++;
                                window.speechSynthesis.cancel();
                                if (audioRef.current) audioRef.current.pause();
                                setSpeakingPersona(null);
                                setView('DASHBOARD');
                            }} className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                <Power className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 flex flex-col md:flex-row items-center justify-around px-4 md:px-20 relative gap-8 md:gap-0 py-8 md:py-0">
                        <div className={`flex flex-col items-center transition-all duration-700 ${speakingPersona === 'host' ? 'scale-110 opacity-100' : 'scale-90 opacity-40 grayscale'}`}>
                            <AudioReactor isSpeaking={speakingPersona === 'host' && isPlaying} color={currentTheme.accent} type="host" />
                            <div className="mt-6 text-center"><h2 className="text-xl font-bold tracking-widest" style={{ color: currentTheme.accent }}>{currentHost.name.toUpperCase()}</h2></div>
                        </div>
                        <div className={`flex flex-col items-center transition-all duration-700 ${speakingPersona === 'expert' ? 'scale-110 opacity-100' : 'scale-90 opacity-40 grayscale'}`}>
                            <AudioReactor isSpeaking={speakingPersona === 'expert' && isPlaying} color={currentTheme.accentSecond} type="expert" />
                            <div className="mt-6 text-center"><h2 className="text-xl font-bold tracking-widest" style={{ color: currentTheme.accentSecond }}>{currentExpert.name.toUpperCase()}</h2></div>
                        </div>
                    </div>

                    <div className="min-h-[200px] bg-black/40 backdrop-blur-xl border-t border-white/5 flex flex-col items-center justify-center p-8 text-center relative">
                        {script[currentLine] && (
                            <div className="max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <p className="text-lg md:text-3xl font-light leading-relaxed tracking-tight text-white drop-shadow-lg">"{script[currentLine].text}"</p>
                            </div>
                        )}
                        {usedModel && <div className="absolute top-4 right-4 px-2 py-1 bg-white/5 text-[9px] font-mono text-slate-500 border border-white/10 rounded">MODEL: {usedModel}</div>}
                    </div>
                </div>
            )}

            {/* MODULAR COMPONENTS */}
            <SettingsModal isOpen={showSettings} keys={keys} onLogout={handleLogout} onClose={() => setShowSettings(false)} />
            <HistoryPanel isOpen={showHistory} history={history} config={config} onLoadEpisode={handleLoadEpisode} onClose={() => setShowHistory(false)} />
        </div>
    );
}
