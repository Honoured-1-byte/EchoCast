import React, { useState, useEffect } from 'react';
import StudioView from '../studio/StudioView';
import Library from '../library/Library';
import { SettingsModal } from './SettingsModal';
import { Radio, Mic, LayoutGrid, Settings } from '../common/Icons';

// --- MAIN APP SHELL ---
export default function EchoCastTerminal() {
    // --- STATE: AUTH & GLOBAL ---
    // We lift auth here so it persists across views and we can show settings from sidebar
    const [keys, setKeys] = useState({ groq: '', deepgram: '' });
    const [view, setView] = useState('AUTH'); // AUTH, APP
    const [activeTab, setActiveTab] = useState('STUDIO'); // STUDIO, LIBRARY
    const [showSettings, setShowSettings] = useState(false);

    // Auth Form State (Temporary)
    const [tempKeys, setTempKeys] = useState({ groq: '', deepgram: '' });
    const [authError, setAuthError] = useState('');

    // Coordination
    const [episodeToLoad, setEpisodeToLoad] = useState(null);

    // --- EFFECT: INIT ---
    // Check for keys on load
    useEffect(() => {
        const k = localStorage.getItem('echocast_keys_v2');
        if (k) {
            const storedKeys = JSON.parse(k);
            setKeys({
                groq: import.meta.env.VITE_GROQ_API_KEY || storedKeys.groq || '',
                deepgram: import.meta.env.VITE_DEEPGRAM_API_KEY || storedKeys.deepgram || ''
            });
            setView('APP');
        } else {
            // Check env
            const envKeys = {
                groq: import.meta.env.VITE_GROQ_API_KEY || '',
                deepgram: import.meta.env.VITE_DEEPGRAM_API_KEY || ''
            };
            // Only Groq is mandatory for "APP" view entry, though TTS will fail without Deepgram
            if (envKeys.groq) {
                setKeys(envKeys);
                localStorage.setItem('echocast_keys_v2', JSON.stringify(envKeys));
                setView('APP');
            }
        }
    }, []);

    // --- ACTIONS: AUTH ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (!tempKeys.groq.trim()) return setAuthError("Groq API Key is required.");

        const finalKeys = {
            groq: tempKeys.groq,
            deepgram: tempKeys.deepgram || import.meta.env.VITE_DEEPGRAM_API_KEY || ''
        };

        localStorage.setItem('echocast_keys_v2', JSON.stringify(finalKeys));
        setKeys(finalKeys);
        setView('APP');
    };

    const handleLogout = () => {
        localStorage.removeItem('echocast_keys_v2');
        setKeys({ groq: '', deepgram: '' });
        setView('AUTH');
        setShowSettings(false);
    };

    // --- ACTIONS: NAVIGATION ---
    const handlePlayEpisode = (episode) => {
        setEpisodeToLoad(episode);
        setActiveTab('STUDIO');
    };

    // --- RENDER: AUTH SCREEN ---
    if (view === 'AUTH') {
        return (
            <div className="h-screen w-full bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_120%)] z-0"></div>

                {/* Visual Flair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>

                <div className="relative z-20 w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-full bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                <Radio className="w-8 h-8 text-cyan-400" />
                            </div>
                        </div>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">ECHOCAST</h1>
                            <p className="text-slate-400 text-sm tracking-widest uppercase mt-2">Groq-Powered Production</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider block ml-1">Groq API Key (Required)</label>
                                <input
                                    type="password"
                                    value={tempKeys.groq}
                                    onChange={e => { setTempKeys({ ...tempKeys, groq: e.target.value }); setAuthError(''); }}
                                    placeholder="gsk_..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-purple-400 uppercase tracking-wider block ml-1">Deepgram API Key (Optional)</label>
                                <input
                                    type="password"
                                    value={tempKeys.deepgram}
                                    onChange={e => setTempKeys({ ...tempKeys, deepgram: e.target.value })}
                                    placeholder="Used for AI Voices..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-mono text-sm"
                                />
                                <p className="text-[10px] text-slate-500 px-1">If omitted, system TTS voices will be used.</p>
                            </div>
                        </div>

                        {authError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center animate-shake">
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-sm"
                        >
                            Initialize System
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- RENDER: APP ---
    return (
        <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
            {/* SIDEBAR */}
            <nav className="w-16 md:w-20 border-r border-white/10 flex flex-col items-center py-8 gap-8 z-50 bg-black/80 backdrop-blur-md">
                <div className="p-3 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 text-white shadow-lg shadow-cyan-500/20 mb-4 cursor-pointer hover:scale-110 transition-transform" onClick={() => setActiveTab('STUDIO')}>
                    <Radio className="w-6 h-6" />
                </div>

                <div className="flex-1 flex flex-col gap-6 w-full px-2">
                    <NavButton
                        active={activeTab === 'STUDIO'}
                        onClick={() => setActiveTab('STUDIO')}
                        icon={Mic}
                        label="Studio"
                    />
                    <NavButton
                        active={activeTab === 'LIBRARY'}
                        onClick={() => setActiveTab('LIBRARY')}
                        icon={LayoutGrid}
                        label="Library"
                    />
                </div>

                <button
                    onClick={() => setShowSettings(true)}
                    className="p-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    title="Settings"
                >
                    <Settings className="w-6 h-6" />
                </button>
            </nav>

            {/* MAIN CONTENT */}
            <main className="flex-1 relative bg-black">
                {activeTab === 'STUDIO' ? (
                    <StudioView
                        keys={keys}
                        episodeToLoad={episodeToLoad}
                        onClearEpisodeToLoad={() => setEpisodeToLoad(null)}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                ) : (
                    <Library onPlayEpisode={handlePlayEpisode} />
                )}
            </main>

            {/* GLOBAL MODALS */}
            <SettingsModal isOpen={showSettings} keys={keys} onLogout={handleLogout} onClose={() => setShowSettings(false)} />
        </div>
    );
}

const NavButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${active
            ? 'bg-white/10 text-white shadow-inner shadow-white/5 ring-1 ring-white/10'
            : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
    >
        <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'group-hover:scale-110'}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{label}</span>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />}
    </button>
);
