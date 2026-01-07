const AudioVisualizer = ({ isPlaying }) => {
    return (
        <div className="flex items-end justify-center h-16 space-x-1 mt-6">
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className={`w-3 rounded-t-md transition-all duration-100 ${isPlaying
                            ? "bg-gradient-to-t from-amber-600 to-yellow-300 animate-bounce-custom"
                            : "bg-gray-700 h-2 opacity-30"
                        }`}
                    style={{
                        animationDelay: `${i * 0.1}s`,
                        height: isPlaying ? '100%' : '10%', // Fallback height
                    }}
                ></div>
            ))}
        </div>
    );
};

export default AudioVisualizer;
