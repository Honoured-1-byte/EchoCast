import React from 'react';
import { X } from '../utils/icons.jsx';

// SettingsModal: Displays API keys and logout functionality
export const SettingsModal = ({ isOpen, keys, onLogout, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">System Configuration</h3>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Groq Key</label>
                        <input
                            type="password"
                            value={keys.groq}
                            readOnly
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-slate-500 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Gemini Key</label>
                        <input
                            type="password"
                            value={keys.gemini}
                            readOnly
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-slate-500 text-xs"
                        />
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/50 rounded hover:bg-red-500/20 transition-colors"
                    >
                        Reset Keys & Logout
                    </button>
                </div>
            </div>
        </div>
    );
};
