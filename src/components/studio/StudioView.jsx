import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/aiService';
import TerminalVisualizer from './TerminalVisualizer';
import CoverArt from './CoverArt';
import AudioReactor from './AudioReactor';
import { ARCHETYPES } from '../../config/personas';
import { THEMES } from '../../config/themes';
import { Play, Pause, Power, Activity, History, Settings, Brain, Zap, Mic, Feather, Cpu, Hourglass, Maximize, Minimize, SkipBack, SkipForward } from '../common/Icons';

// --- MAIN COMPONENT ---
export default function StudioView({ keys, episodeToLoad, onClearEpisodeToLoad, onOpenSettings }) {
    // STATE: KEYS & AUTH - REMOVED (Managed by EchoCastTerminal)
    const [view, setView] = useState('DASHBOARD'); // DASHBOARD, EDITOR, LIVE

    // STATE: CONFIG
    const [topic, setTopic] = useState('');
    const [sourceMaterial, setSourceMaterial] = useState('');
    const [mode, setMode] = useState('CREATIVE'); // CREATIVE, DEEP_DIVE
    const [config, setConfig] = useState({
        vibe: 'cool',
        hostId: 'skeptic',
        expertId: 'philosopher',
        length: 10 // Default to 10 exchanges (approx 5 mins)
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
    // const [showSettings, setShowSettings] = useState(false); // MOVED UP

    const audioRef = useRef(new Audio());
    const playbackTimeout = useRef(null);
    const playbackSessionRef = useRef(0);
    const utteranceRef = useRef(null);

    // Derived
    const currentTheme = THEMES[config.vibe] || THEMES['cool'];
    const currentHost = ARCHETYPES.host.find(h => h.id === config.hostId) || ARCHETYPES.host[0];
    const currentExpert = ARCHETYPES.expert.find(e => e.id === config.expertId) || ARCHETYPES.expert[0];

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

    // Load History
    useEffect(() => {
        const h = localStorage.getItem('echocast_history');
        if (h) setHistory(JSON.parse(h));
    }, []);

    // --- WATCH: EPISODE TO LOAD ---
    useEffect(() => {
        if (episodeToLoad) {
            handleLoadEpisode(episodeToLoad);
            if (onClearEpisodeToLoad) onClearEpisodeToLoad();
        }
    }, [episodeToLoad]); // eslint-disable-line

    // --- ACTIONS: PREVIEW ---
    const previewVoice = async (role) => {
        const persona = role === 'host' ? currentHost : currentExpert;
        if (!persona) return;

        const text = `Hello, I am ${persona.name}.`;

        try {
            const base64 = await aiService.generateAudio(text, persona.voiceName, keys.deepgram);
            if (base64) {
                const blob = aiService.base64ToBlob(base64);
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.play();
            } else {
                const u = new SpeechSynthesisUtterance(text);
                const v = window.speechSynthesis.getVoices().find(x =>
                    role === 'host'
                        ? (x.name.includes('Male') || x.name.includes('David'))
                        : (x.name.includes('Female') || x.name.includes('Zira'))
                );
                if (v) u.voice = v;
                window.speechSynthesis.speak(u);
            }
        } catch (e) {
            console.error("Preview failed", e);
        }
    };

    const handleGenerate = async () => {
        const input = mode === 'CREATIVE' ? topic : sourceMaterial;
        if (!input.trim()) return;
        setIsGenerating(true);

        const count = config.length || 10;

        const systemPrompt = `You are a podcast scriptwriter creating a dialogue between a Host and Expert.

Host Name: ${currentHost.name}. Personality: ${currentHost.prompt}
Expert Name: ${currentExpert.name}. Personality: ${currentExpert.prompt}

Create a podcast script with EXACTLY ${count} dialogue exchanges alternating Host/Expert about:
"${input.slice(0, 5000)}"

RULES:
- Output ONLY a JSON array with ${count} objects
- Format: [{"speaker":"host","text":"..."},{"speaker":"expert","text":"..."},...]
- Each message 20-50 words
- Host starts, Expert responds, continue for ${count} turns
- The conversation must have a clear beginning, middle, and end.
- The Expert should have the final word or a wrap-up from the Host.
- Be engaging and informative
- NO MARKDOWN, NO BACKTICKS, PURE JSON ONLY

Do not include any explanation, code fence, or text outside the JSON array.`;

        try {
            const scriptData = await aiService.generateScript(systemPrompt, keys);
            setScript(scriptData);
            setUsedModel('Llama 3.3 / 3.1 (Groq)');
            setView('EDITOR');
        } catch (e) {
            console.error(e);
            alert("Generation Failed: " + e.message); // Simple alert since Auth Error state is gone
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

    // --- ACTIONS: EXPORT ---
    const exportScript = (scriptData = script, topicName = topic) => {
        if (!scriptData || scriptData.length === 0) return;

        let content = `# ${topicName}\n\n`;
        content += `> Produced by EchoCast\n\n`;
        content += `---\n\n`;

        scriptData.forEach(line => {
            content += `**${line.speaker.toUpperCase()}**: ${line.text}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${topicName.replace(/\s+/g, '_')}_transcript.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadScript = () => {
        const textContent = script.map(line => `${line.speaker.toUpperCase()}: ${line.text}`).join('\n\n');
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `echocast-${Date.now()}.txt`;
        a.click();
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
                const url = URL.createObjectURL(audioBlob);
                audioRef.current.src = url;
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

    // --- ACTIONS: NAVIGATION ---
    const nextLine = () => {
        if (currentLine < script.length - 1) {
            window.speechSynthesis.cancel();
            if (audioRef.current) audioRef.current.pause();
            setCurrentLine(prev => prev + 1);
        }
    };

    const prevLine = () => {
        if (currentLine > 0) {
            window.speechSynthesis.cancel();
            if (audioRef.current) audioRef.current.pause();
            setCurrentLine(prev => prev - 1);
        }
    };

    // --- ACTIONS: UI ---
    const [isFullscreen, setIsFullscreen] = useState(false);
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Hide cursor when idle in LIVE mode
    useEffect(() => {
        if (view !== 'LIVE') return;
        let timeout;
        const resetCursor = () => {
            document.body.style.cursor = 'auto';
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                document.body.style.cursor = 'none';
            }, 3000);
        };
        window.addEventListener('mousemove', resetCursor);
        return () => {
            window.removeEventListener('mousemove', resetCursor);
            document.body.style.cursor = 'auto';
            clearTimeout(timeout);
        };
    }, [view]);

    // --- HANDLERS FOR MODULAR COMPONENTS ---
    const handleLoadEpisode = (ep) => {
        if (!ep) return;
        setScript(ep.script);
        setConfig(ep.config || config);
        setTopic(ep.topic || '');
        setCurrentLine(0);
        setView('LIVE');
        setShowHistory(false);
        setIsPlaying(true); // Auto-play when loaded from library
    };

    // --- RENDER ---
    return (
        <div className="h-full w-full relative overflow-hidden font-sans bg-black text-white" style={{ backgroundColor: currentTheme.bg }}>
            {/* BACKGROUND */}
            <TerminalVisualizer config={config} currentTheme={currentTheme} speakingPersona={speakingPersona} isPlaying={isPlaying} />
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_120%)] pointer-events-none"></div>

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
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center relative group">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 flex justify-between">
                                    Host
                                    <button onClick={() => previewVoice('host')} className="hover:text-cyan-400 transition-colors" title="Preview Voice">
                                        <Play className="w-3 h-3" />
                                    </button>
                                </label>
                                <select value={config.hostId} onChange={e => setConfig({ ...config, hostId: e.target.value })} className="bg-transparent text-sm outline-none text-white w-full cursor-pointer">
                                    {ARCHETYPES.host.map(h => <option key={h.id} value={h.id} className="bg-black">{h.name}</option>)}
                                </select>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col justify-center relative group">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 flex justify-between">
                                    Expert
                                    <button onClick={() => previewVoice('expert')} className="hover:text-purple-400 transition-colors" title="Preview Voice">
                                        <Play className="w-3 h-3" />
                                    </button>
                                </label>
                                <select value={config.expertId} onChange={e => setConfig({ ...config, expertId: e.target.value })} className="bg-transparent text-sm outline-none text-white w-full cursor-pointer">
                                    {ARCHETYPES.expert.map(h => <option key={h.id} value={h.id} className="bg-black">{h.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* DURATION SELECTOR */}
                    {/* GENERATION CONTROLS */}
                    <div className="flex items-end gap-4 pt-6 w-full max-w-3xl mx-auto">
                        {/* DURATION SLIDER - CONTINUOUS */}
                        <div className="flex flex-col gap-2 flex-1 relative group">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 flex justify-between">
                                Duration
                                <span className="text-cyan-400">{config.length || 10} Exchanges (~{Math.round((config.length || 10) / 2)} Mins)</span>
                            </label>
                            <div className="h-[52px] bg-black/40 border border-white/5 rounded-xl flex items-center px-6 relative overflow-hidden">
                                {/* Track Background */}
                                <div className="absolute left-6 right-6 h-1 bg-white/10 rounded-full"></div>
                                {/* Active Track */}
                                <div
                                    className="absolute h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-300"
                                    style={{
                                        left: '24px',
                                        width: `calc(${((config.length - 4) / 26) * 100}% - 48px + 24px)`
                                    }}
                                ></div>

                                <input
                                    type="range"
                                    min="4"
                                    max="30"
                                    step="2"
                                    value={config.length || 10}
                                    onChange={(e) => setConfig({ ...config, length: parseInt(e.target.value) })}
                                    className="w-full absolute inset-0 opacity-0 cursor-pointer z-20"
                                />

                                {/* Visual Stamen/Thumb */}
                                <div
                                    className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10 pointer-events-none transition-all duration-300 transform -translate-y-1/2 top-1/2"
                                    style={{
                                        left: `calc(1.5rem + ${((config.length - 4) / 26) * (100 - 0)}% - ${((config.length - 4) / 26) * 3}rem)`
                                    }}
                                ></div>

                                {/* Labels Overlay (Simplified) */}
                                <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none opacity-30">
                                    <div className="w-0.5 h-2 bg-white"></div>
                                    <div className="w-0.5 h-2 bg-white"></div>
                                    <div className="w-0.5 h-2 bg-white"></div>
                                    <div className="w-0.5 h-2 bg-white"></div>
                                    <div className="w-0.5 h-2 bg-white"></div>
                                </div>
                            </div>
                            <div className="flex justify-between px-2 text-[10px] uppercase font-bold text-slate-500 font-mono">
                                <span>Short</span>
                                <span>Long</span>
                            </div>
                        </div>

                        {/* GENERATE BUTTON */}
                        <button onClick={handleGenerate} disabled={isGenerating} className="h-[74px] flex items-center justify-center gap-3 px-10 rounded-xl font-bold text-black transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/20 text-lg tracking-wide flex-1 max-w-sm" style={{ backgroundColor: currentTheme.accent }}>
                            {isGenerating ? <Activity className="animate-spin w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                            {isGenerating ? "TUNING..." : "GENERATE SCRIPT"}
                        </button>
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
                                <button onClick={() => exportScript()} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors border border-dashed border-slate-600 hover:border-cyan-400">EXPORT MD</button>
                                <button onClick={downloadScript} className="px-4 py-2 rounded-lg text-xs font-bold border border-white/20 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    EXPORT TXT
                                </button>
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
            )
            }

            {/* LIVE STUDIO */}
            {
                view === 'LIVE' && (
                    <div className="relative z-20 h-full flex flex-col animate-in zoom-in duration-500">
                        {/* GOLDEN WAVES BACKGROUND */}
                        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-amber-500/20 to-transparent"></div>
                            <svg className="absolute bottom-0 w-[200%] h-48 animate-float opacity-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
                                <path fill="rgba(251, 191, 36, 0.3)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                        </div>

                        {/* HEADER (Now simplified) */}
                        <header className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20 backdrop-blur-sm z-10">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 border border-red-500/30 bg-red-500/10 rounded text-red-400 text-[10px] font-bold tracking-widest">
                                    {isPlaying ? <><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> ON AIR</> : <><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> PAUSED</>}
                                </div>
                                <h1 className="text-sm font-medium text-slate-400 uppercase tracking-widest hidden md:block truncate max-w-xs">{mode === 'CREATIVE' ? topic : 'Deep Dive Analysis'}</h1>
                            </div>
                        </header>

                        <div className="absolute top-[42%] left-0 w-full transform -translate-y-1/2 flex flex-col md:flex-row items-center justify-around px-4 md:px-20 z-0 opacity-80 gap-8 md:gap-0 pointer-events-none">
                            {/* HOST (Left) */}
                            <div className={`flex flex-col items-center transition-all duration-700 ${speakingPersona === 'host' ? 'scale-110 opacity-100' : 'scale-90 opacity-40 grayscale'}`}>
                                <AudioReactor isSpeaking={speakingPersona === 'host' && isPlaying} color={currentTheme.accent} iconName={currentHost.icon} />
                                <div className="mt-6 text-center"><h2 className="text-xl font-bold tracking-widest" style={{ color: currentTheme.accent }}>{currentHost.name.toUpperCase()}</h2></div>
                            </div>

                            {/* EXPERT (Right) */}
                            <div className={`flex flex-col items-center transition-all duration-700 ${speakingPersona === 'expert' ? 'scale-110 opacity-100' : 'scale-90 opacity-40 grayscale'}`}>
                                <AudioReactor isSpeaking={speakingPersona === 'expert' && isPlaying} color={currentTheme.accentSecond} iconName={currentExpert.icon} />
                                <div className="mt-6 text-center"><h2 className="text-xl font-bold tracking-widest" style={{ color: currentTheme.accentSecond }}>{currentExpert.name.toUpperCase()}</h2></div>
                            </div>
                        </div>

                        {/* LIVE CAPTIONS - ABSOLUTE POSITIONED IN LOWER HALF */}
                        <div className="absolute top-[60%] bottom-28 left-0 right-0 flex flex-col items-center justify-start p-8 text-center z-20 overflow-y-auto">
                            {script[currentLine] && (
                                <div key={currentLine} className="max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-300">
                                    <p
                                        className="text-lg md:text-3xl font-light leading-relaxed tracking-tight drop-shadow-lg transition-colors duration-300"
                                        style={{
                                            color: script[currentLine].speaker.toLowerCase().includes('host')
                                                ? currentTheme.accent
                                                : currentTheme.accentSecond
                                        }}
                                    >
                                        "{script[currentLine].text}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* PLAYER CONTROL BAR */}
                        <div className="absolute bottom-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 z-50 flex items-center justify-between gap-4">
                            {/* LEFT: VISUAL CARD (Replaces Mics) */}
                            <div className="flex items-center gap-4 w-1/3 min-w-0">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-lg group">
                                    {/* Miniature Visualizer / Artwork */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-black to-[#05070a] opacity-50"></div>
                                    <CoverArt topic={topic} theme={currentTheme} size="sm" />
                                    {/* Small Audio Reactor Overlay */}
                                    {(speakingPersona && isPlaying) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                            <div className={`w-3 h-3 rounded-full animate-ping`} style={{ backgroundColor: speakingPersona === 'host' ? currentTheme.accent : currentTheme.accentSecond }}></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="font-bold text-sm text-white truncate">{topic || "Untitled Transmission"}</h3>
                                    <p className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                        ON AIR • {config.vibe.toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* CENTER: SCRUBBER (Top) -> CONTROLS (Bottom) */}
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="w-full max-w-md flex items-center gap-3 text-[10px] font-mono text-slate-500 mb-1">
                                    <span>{currentLine + 1}</span>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
                                        <div className="h-full bg-white transition-all duration-300 group-hover:bg-cyan-400" style={{ width: `${((currentLine + 1) / script.length) * 100}%` }}></div>
                                    </div>
                                    <span>{script.length}</span>
                                </div>

                                <div className="flex items-center gap-6">
                                    <button onClick={prevLine} className="text-slate-400 hover:text-white transition-colors">
                                        <SkipBack className="w-5 h-5" />
                                    </button>
                                    <button onClick={togglePlay} className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform">
                                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                                    </button>
                                    <button onClick={nextLine} className="text-slate-400 hover:text-white transition-colors">
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT: ACTIONS */}
                            <div className="flex items-center justify-end gap-3 w-1/3">
                                <button onClick={toggleFullScreen} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                </button>
                                <div className="w-px h-6 bg-white/10 mx-2"></div>
                                <button onClick={() => {
                                    setIsPlaying(false);
                                    playbackSessionRef.current++;
                                    window.speechSynthesis.cancel();
                                    if (audioRef.current) audioRef.current.pause();
                                    setSpeakingPersona(null);
                                    setView('DASHBOARD');
                                }} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors" title="Exit Broadcast">
                                    <Power className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODULAR COMPONENTS */}
            {/* SettingsModal removed (LIFTED) */}
            {/* HistoryPanel removed */}
        </div >
    );
}
