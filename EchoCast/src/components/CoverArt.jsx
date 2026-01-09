import React, { useMemo } from 'react';

const CoverArt = ({ topic, theme, size = "md" }) => {
    // Deterministic random
    const seed = useMemo(() => {
        let h = 0;
        for (let i = 0; i < topic.length; i++) h = Math.imul(31, h) + topic.charCodeAt(i) | 0;
        return h;
    }, [topic]);

    const colors = useMemo(() => {
        const c = [theme.accent, theme.accentSecond, '#ffffff', '#000000'];
        // Shuffle based on seed
        return c.sort(() => (seed % 2) - 0.5);
    }, [seed, theme]);

    // Generate patterns
    const shapes = useMemo(() => {
        const s = [];
        const count = 5 + (Math.abs(seed) % 5);
        for (let i = 0; i < count; i++) {
            s.push({
                type: (seed + i) % 3, // 0=circle, 1=rect, 2=line
                x: Math.abs((seed * (i + 1)) % 100),
                y: Math.abs((seed * (i + 2)) % 100),
                size: 10 + Math.abs((seed * (i + 3)) % 40),
                color: colors[i % colors.length],
                rotation: (seed * i) % 360
            });
        }
        return s;
    }, [seed, colors]);

    const dim = size === "lg" ? "w-64 h-64" : (size === "sm" ? "w-12 h-12" : "w-32 h-32");
    const fontSize = size === "lg" ? "text-2xl" : (size === "sm" ? "text-[8px]" : "text-sm");

    return (
        <div className={`${dim} relative overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center group select-none`}>
            {/* Abstract Background */}
            <div className={`absolute inset-0 bg-gradient-to-br from-black to-[${theme.bg}] opacity-50`}></div>
            {shapes.map((s, i) => (
                <div key={i} className="absolute opacity-60 mix-blend-screen" style={{
                    left: `${s.x}%`, top: `${s.y}%`,
                    width: `${s.size}%`, height: `${s.size}%`,
                    backgroundColor: s.type !== 2 ? s.color : 'transparent',
                    border: s.type === 2 ? `2px solid ${s.color}` : 'none',
                    borderRadius: s.type === 0 ? '50%' : '0',
                    transform: `rotate(${s.rotation}deg)`
                }} />
            ))}

            {/* Title Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className={`${fontSize} font-bold text-white uppercase tracking-widest line-clamp-2 leading-tight drop-shadow-md`}>
                    {topic}
                </h3>
            </div>

            {/* Vinyl Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>
        </div>
    );
};

export default CoverArt;
