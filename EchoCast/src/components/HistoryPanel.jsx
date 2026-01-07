import React from 'react';
import { X } from '../utils/icons.jsx';

// HistoryPanel: Displays past broadcasts and allows loading them
export const HistoryPanel = ({ isOpen, history, config, onLoadEpisode, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in slide-in-from-right duration-300">
            <div className="w-full max-w-sm bg-slate-900 h-full border-l border-white/10 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-light tracking-widest text-white">ARCHIVES</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4">
                    {history.length === 0 && (
                        <p className="text-slate-600 text-sm italic">No recordings.</p>
                    )}
                    {history.map(ep => (
                        <button
                            key={ep.id}
                            onClick={() => onLoadEpisode(ep)}
                            className="w-full text-left p-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all group"
                        >
                            <h3 className="text-sm font-bold text-slate-200 mb-1 line-clamp-1">{ep.topic}</h3>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase">
                                <span>{ep.date}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
