import React, { useEffect, useRef } from 'react';
import { THEMES } from '../config/themes';

// Animated background canvas component that handles all three visualization modes
export const CanvasVisualization = ({ vibe = 'cool', isPlaying, speakingPersona }) => {
    const canvasRef = useRef(null);
    const currentTheme = THEMES[vibe];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const init = () => {
            particles = [];
            const count = vibe === 'neon' ? 100 : (vibe === 'cool' ? 200 : 60);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    z: Math.random() * canvas.width,
                    size: Math.random() * 2,
                    speed: Math.random() * 2 + 0.5,
                    char: String.fromCharCode(0x30A0 + Math.random() * 96) // For Matrix
                });
            }
        };
        init();

        const render = () => {
            // Clear based on vibe trace effect
            ctx.fillStyle = vibe === 'neon' ? 'rgba(0, 0, 0, 0.1)' : currentTheme.surface.replace('0.9', '0.2');
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            // --- 1. COOL MODE: WARP TUNNEL ---
            if (vibe === 'cool') {
                ctx.fillStyle = '#fff';
                particles.forEach(p => {
                    p.z -= p.speed * (isPlaying && speakingPersona ? 8 : 2); // Fast warp when speaking
                    if (p.z <= 0) {
                        p.z = canvas.width;
                        p.x = Math.random() * canvas.width;
                        p.y = Math.random() * canvas.height;
                    }

                    const perspective = 300 / p.z;
                    const x2d = (p.x - cx) * perspective + cx;
                    const y2d = (p.y - cy) * perspective + cy;
                    const alpha = (1 - p.z / canvas.width);

                    if (alpha > 0) {
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.arc(x2d, y2d, p.size * perspective, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }

            // --- 2. WARM MODE: GOLDEN WAVES & EMBERS ---
            else if (vibe === 'warm') {
                // Sine Waves
                const time = Date.now() * 0.001;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(251, 191, 36, ${0.1 - i * 0.015})`;
                    ctx.lineWidth = 2;
                    for (let x = 0; x < canvas.width; x += 10) {
                        const y = cy + Math.sin(x * 0.005 + time + i) * (50 + i * 20) * (isPlaying ? 1.5 : 1);
                        if (x === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }

                // Floating Embers
                ctx.fillStyle = '#fbbf24';
                particles.forEach(p => {
                    p.y -= p.speed * 0.5; // Float up
                    p.x += Math.sin(p.z) * 0.5; // Wiggle
                    if (p.y < 0) {
                        p.y = canvas.height;
                        p.x = Math.random() * canvas.width;
                    }

                    const alpha = Math.sin(p.y * 0.01);
                    ctx.globalAlpha = Math.abs(alpha) * 0.5 + 0.2;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            // --- 3. NEON MODE: MATRIX RAIN & GRID ---
            else if (vibe === 'neon') {
                // Grid Floor
                ctx.strokeStyle = 'rgba(217, 70, 239, 0.15)';
                ctx.lineWidth = 1;
                const time = Date.now() * 0.002;
                const horizon = canvas.height * 0.8;

                // Moving vertical lines
                for (let x = -500; x < canvas.width + 500; x += 100) {
                    const perspectiveX = (x - cx) * 2 + cx; // Fake perspective spread
                    const offset = (time * 50) % 100;
                    ctx.beginPath();
                    ctx.moveTo(x + offset, horizon);
                    ctx.lineTo((x - cx) * 4 + cx, canvas.height); // Fan out
                    ctx.stroke();
                }
                // Horizontal lines
                for (let y = horizon; y < canvas.height; y += 40) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }

                // Matrix Rain
                ctx.font = '14px monospace';
                ctx.fillStyle = '#d946ef';
                particles.forEach(p => {
                    p.y += p.speed * 4;
                    if (p.y > canvas.height) {
                        p.y = -20;
                        p.x = Math.random() * canvas.width;
                    }

                    // Random character switching
                    if (Math.random() > 0.95) p.char = String.fromCharCode(0x30A0 + Math.random() * 96);

                    ctx.globalAlpha = 0.8;
                    ctx.fillText(p.char, p.x, p.y);
                });
            }

            requestAnimationFrame(render);
        };
        render();

        return () => window.removeEventListener('resize', resize);
    }, [currentTheme, speakingPersona, isPlaying, vibe]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-60" />;
};
