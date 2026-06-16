import React, { useState, useEffect } from 'react';
import { Play, Calendar, Clock, LayoutGrid, List } from '../common/Icons';

export default function Library({ onPlayEpisode }) {
    // Placeholder Data until we have real history migration
    // In real app, this would read from localStorage 'echocast_history'
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    useEffect(() => {
        const saved = localStorage.getItem('echocast_history');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-md p-8 overflow-hidden animate-in fade-in duration-500">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-light text-white tracking-tight">Transmission Archive</h2>
                    <p className="text-slate-500 text-sm mt-1">Access past broadcasts and generated scripts.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                        title="List View"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* CONTENT */}
            <div className={`flex-1 overflow-y-auto pb-20 scrollbar-thin scrollbar-thumb-white/10 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-2'}`}>
                {history.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-600 space-y-4 pt-20">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <LayoutGrid className="w-8 h-8 opacity-50" />
                        </div>
                        <p>No transmissions archived yet.</p>
                    </div>
                ) : (
                    history.map((ep) => (
                        <div key={ep.id} className={`group relative bg-white/5 border border-white/5 overflow-hidden hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 ${viewMode === 'grid' ? 'rounded-2xl hover:-translate-y-1' : 'rounded-lg flex items-center p-4 hover:translate-x-1'}`}>

                            {/* GRID CARD CONTENT */}
                            {viewMode === 'grid' && (
                                <div className="flex flex-col h-full w-full">
                                    <div className="h-32 bg-slate-800 relative overflow-hidden flex items-end p-4">
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50"></div>
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white uppercase tracking-wider font-bold backdrop-blur-sm z-10">
                                            {ep.config?.vibe || 'VOID'}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-white leading-tight mb-2 line-clamp-2 drop-shadow-md">
                                                {ep.topic || "Untitled Transmission"}
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ep.date}</span>
                                                {ep.script && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil(ep.script.length * 4 / 60)} min</span>}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onPlayEpisode(ep)}
                                            className="mt-4 w-full py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-4 h-4 fill-current" /> LOAD TRANSMISSION
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* LIST ROW CONTENT */}
                            {viewMode === 'list' && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate pr-4">{ep.topic || "Untitled"}</h3>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-wider">
                                            <span>{ep.date}</span>
                                            <span>•</span>
                                            <span>{ep.config?.vibe}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onPlayEpisode(ep)}
                                        className="p-2 rounded-full bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black"
                                        title="Play Episode"
                                    >
                                        <Play className="w-3 h-3 fill-current" />
                                    </button>
                                </>
                            )}

                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
