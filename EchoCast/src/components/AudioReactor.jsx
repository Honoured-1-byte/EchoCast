import React from 'react';
import { Sparkles, User } from '../utils/icons.jsx';

// AudioReactor: Visual indicator for when host/expert is speaking
export const AudioReactor = ({ isSpeaking, color, type }) => (
    <div className="relative w-24 h-24 md:w-40 md:h-40 flex items-center justify-center transition-all duration-500">
        <div
            className={`absolute inset-0 rounded-full opacity-20 blur-xl transition-all duration-300 ${
                isSpeaking ? 'scale-125 opacity-40' : 'scale-100'
            }`}
            style={{ backgroundColor: color }}
        ></div>
        <div
            className={`absolute inset-0 rounded-full border border-dashed opacity-30 ${
                isSpeaking ? 'animate-[spin_4s_linear_infinite]' : 'animate-[spin_10s_linear_infinite]'
            }`}
            style={{ borderColor: color }}
        ></div>
        {isSpeaking && (
            <div className="absolute inset-[-10px] flex items-center justify-center">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 bg-current rounded-full origin-bottom animate-pulse"
                        style={{
                            height: `${Math.random() * 30 + 10}px`,
                            transform: `rotate(${i * 30}deg) translateY(-50px)`,
                            color: color,
                            animationDuration: `${Math.random() * 0.5 + 0.2}s`
                        }}
                    />
                ))}
            </div>
        )}
        <div
            className="relative z-10 w-20 h-20 md:w-32 md:h-32 rounded-full border-2 bg-black/50 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl"
            style={{ borderColor: color }}
        >
            {type === 'host' ? (
                <User className={`w-8 h-8 transition-all duration-200 ${isSpeaking ? 'scale-110' : 'scale-100'}`} style={{ color }} />
            ) : (
                <Sparkles className={`w-8 h-8 transition-all duration-200 ${isSpeaking ? 'scale-110' : 'scale-100'}`} style={{ color }} />
            )}
        </div>
    </div>
);
