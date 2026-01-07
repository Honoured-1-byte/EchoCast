# EchoCast - AI-Powered Podcast Generator

A modern web application that generates, plays, and visualizes AI-powered podcasts. EchoCast transforms text prompts into engaging audio content with real-time visualization and interactive controls.

## Features

- **AI Script Generation** - Create podcast scripts using Groq or Google Gemini
- **Text-to-Speech Audio** - Generate natural-sounding audio with Deepgram TTS
- **Real-Time Visualization** - 3D particle effects and audio-reactive visuals
- **Multiple AI Personas** - 6 unique voice personas with distinct characteristics
- **History Management** - Save and replay previously generated episodes
- **Customizable Themes** - Cool, Warm, and Neon aesthetic options
- **Local Storage** - Persist your API keys and episode history
- **Fallback Chain** - Graceful degradation when primary services are unavailable

## Tech Stack

- **Frontend**: React 18.x with Vite
- **Styling**: Tailwind CSS
- **Visualization**: Three.js-compatible 3D rendering
- **APIs**: Groq, Google Gemini, Deepgram, ElevenLabs
- **Build Tool**: Vite 7.3.0

## Project Structure

```
src/
├── App.jsx                          # Root component with error boundary
├── App.css                          # Global styles
├── main.jsx                         # Application entry point
├── components/
│   ├── EchoCastTerminal.jsx        # Main orchestrator component
│   ├── AudioVisualizer.jsx         # Audio player and controls
│   ├── CanvasVisualization.jsx     # 3D particle effects visualization
│   ├── AudioReactor.jsx            # Speaker indicator component
│   ├── SettingsModal.jsx           # Settings dialog
│   ├── HistoryPanel.jsx            # Episode history sidebar
│   ├── EchoPlayer.jsx              # Audio playback wrapper
│   └── Starfield.jsx               # Background starfield effect
├── config/
│   ├── personas.js                 # AI persona definitions
│   └── themes.js                   # Theme color schemes
└── utils/
    ├── aiService.js                # Script generation service
    ├── deepgramService.js          # Audio generation service
    └── icons.jsx                   # SVG icon components
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API keys for the services you plan to use (see below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd EchoCast
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your actual API keys:
   - [Groq API](https://console.groq.com) - For script generation
   - [Google Gemini API](https://aistudio.google.com) - For fallback script generation
   - [Deepgram API](https://console.deepgram.com) - For text-to-speech
   - [ElevenLabs API](https://elevenlabs.io) - For alternative TTS

4. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

### Component Architecture

The application follows a modular component structure:

- **EchoCastTerminal.jsx**: Orchestrates all functionality, manages application state
- **AudioVisualizer.jsx**: Handles audio player UI, playback controls, and progress tracking
- **CanvasVisualization.jsx**: Renders real-time 3D particle effects synced to audio
- **AudioReactor.jsx**: Displays speaking/idle state indicator
- **SettingsModal.jsx**: Manages configuration UI for API keys and theme selection
- **HistoryPanel.jsx**: Browse and replay previously generated episodes
- **EchoPlayer.jsx**: Wraps the audio element with playback state management

### API Services

#### `aiService.js`
Handles script generation with fallback logic:
1. Attempts Groq API first (faster, cheaper)
2. Falls back to Google Gemini if Groq fails
3. Falls back to browser speech synthesis if both fail
4. Delegates audio generation to `deepgramService`

#### `deepgramService.js`
Primary audio generation service:
- Converts scripts to speech using Deepgram TTS API
- Supports 6 voice personas with custom voice mapping
- Handles base64 encoding/decoding for audio data
- Provides voice selection for each persona

### Configuration

#### Personas (`config/personas.js`)
Define unique AI personas with:
- Name and description
- Tone and speaking style
- Voice ID for audio generation

#### Themes (`config/themes.js`)
Three aesthetic themes:
- **Cool**: Blue/cyan color palette
- **Warm**: Orange/amber color palette
- **Neon**: Vibrant neon color palette

## API Keys & Security

### Important Security Notes

- **Never commit `.env` file** - It contains sensitive API keys
- The `.gitignore` file prevents `.env` from being committed
- Always use `.env.example` as a template for new developers
- Rotate API keys if they're accidentally exposed

### Environment Variables

All API keys are accessed via `import.meta.env.VITE_*`:

```javascript
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
```

This ensures secrets are:
- Not bundled in the client code
- Only available at build/runtime when set
- Safely excluded from version control

## Data Storage

The application uses browser `localStorage` for:

- **API Keys** (`echocast_keys_v2`): Stores user's API keys locally
- **Episode History** (`echocast_history`): Persists generated episodes for replay

**Note**: Keys stored locally are accessible via browser DevTools. For production, consider using a backend API to manage credentials.

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory ready for deployment.

## Troubleshooting

### "API key not found" error
- Verify your `.env` file exists and has the correct API keys
- Make sure the variable names match exactly (case-sensitive)
- Restart the dev server after updating `.env`

### Audio not playing
- Check that Deepgram API key is valid and has quota remaining
- Try switching themes or personas
- Check browser console for error messages
- Verify internet connection is stable

### Visualization not rendering
- Ensure your browser supports WebGL
- Try a different browser (Chrome, Firefox)
- Disable browser extensions that might interfere with rendering

## Performance Optimization

- Visualization is rendered only when needed (LazyLoad pattern)
- Audio caching prevents re-generating the same script+voice combination
- localStorage persists data locally, reducing API calls
- Vite optimizes code splitting for faster initial load

## Future Enhancements

- [ ] Multi-language support
- [ ] Advanced audio effects (echo, reverb, compression)
- [ ] Podcast scheduling and automation
- [ ] Social sharing and episode distribution
- [ ] Backend API for credential management
- [ ] Analytics and engagement tracking

## License

[Add your license here]

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready
