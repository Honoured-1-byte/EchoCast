import React from 'react';

// Icons (using dummy if Lucide still broken, but assuming fixed or using backup)
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const SparkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
);

const BroadcasterUI = ({ script, currentLine, isPlaying, speakingPersona, togglePlay, onSeek }) => {
    const currentText = script[currentLine]?.text || "Initializing...";
    const isHostSpeaking = isPlaying && speakingPersona === 'host';
    const isExpertSpeaking = isPlaying && speakingPersona === 'expert';

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-8">

            {/* GOLDEN WAVES BACKGROUND (CSS/SVG) */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-amber-500/20 to-transparent"></div>
                {/* Simulated Wave SVG */}
                <svg className="absolute bottom-0 w-[200%] h-48 animate-float opacity-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill="rgba(251, 191, 36, 0.3)" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            {/* AVATAR STAGE */}
            <div className="relative z-10 flex w-full max-w-4xl justify-between items-center mb-16 px-10">

                {/* HOST (LEFT) */}
                <div className="flex flex-col items-center gap-4 relative">
                    <div className={`relative w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isHostSpeaking ? 'border-amber-400 border-gold-glow scale-110' : 'border-gray-700 opacity-50'}`}>
                        {isHostSpeaking && (
                            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ripple"></div>
                        )}
                        <UserIcon />
                    </div>
                    <div className="text-center">
                        <h3 className={`text-2xl font-display font-bold tracking-widest ${isHostSpeaking ? 'text-amber-400 text-gold-glow' : 'text-gray-600'}`}>SHRAVAN</h3>
                        <p className="text-xs font-mono text-gray-500">HOST INTERFACE</p>
                    </div>
                </div>

                {/* CONNECTION LINE */}
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-8 relative">
                    {/* Signal Packet */}
                    {isPlaying && <div className="absolute top-1/2 left-0 w-2 h-2 bg-amber-400 rounded-full -translate-y-1/2 animate-[ping_1s_infinite]"></div>}
                </div>

                {/* EXPERT (RIGHT) */}
                <div className="flex flex-col items-center gap-4 relative">
                    <div className={`relative w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isExpertSpeaking ? 'border-amber-400 border-gold-glow scale-110' : 'border-gray-700 opacity-50'}`}>
                        {isExpertSpeaking && (
                            <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ripple"></div>
                        )}
                        <SparkIcon />
                    </div>
                    <div className="text-center">
                        <h3 className={`text-2xl font-display font-bold tracking-widest ${isExpertSpeaking ? 'text-amber-400 text-gold-glow' : 'text-gray-600'}`}>VAANI</h3>
                        <p className="text-xs font-mono text-gray-500">EXPERT SYSTEM</p>
                    </div>
                </div>

            </div>

            {/* SUBTITLES (LARGE) */}
            <div className="relative z-10 w-full max-w-3xl text-center min-h-[120px]">
                <p className="text-2xl md:text-3xl font-light leading-relaxed text-gray-200 transition-all duration-300">
                    "{currentText}"
                </p>
            </div>

            {/* CONTROLS (Floating Bottom) */}
            <div className="mt-12 flex items-center gap-6 z-20">
                <button onClick={() => onSeek(currentLine - 1)} className="p-4 text-gray-500 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m11 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></svg>
                </button>

                <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-transparent border-2 border-amber-500 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                    {isPlaying ? (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                    ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    )}
                </button>

                <button onClick={() => onSeek(currentLine + 1)} className="p-4 text-gray-500 hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m13 17 5-5-5-5" /><path d="m6 17 5-5-5-5" /></svg>
                </button>
            </div>

            <div className="mt-4 text-xs font-mono text-amber-500/50">
                LINE {currentLine + 1} / {script.length}
            </div>

        </div>
    );
};

export default BroadcasterUI;
