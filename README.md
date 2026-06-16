# EchoCast - AI-Powered Podcast Generator

A modern web application that generates, plays, and visualizes AI-powered podcasts. EchoCast transforms text prompts into engaging audio content with real-time visualization and interactive controls.

## Features

- **AI Script Generation** - Powered by Groq (Llama 3.3 70B & Llama 3.1 8B)
- **Text-to-Speech Audio** - High-quality audio via Deepgram TTS
- **Real-Time Visualization** - 3D particle effects and audio-reactive visuals
- **Multiple AI Personas** - 6 unique voice personas with distinct characteristics
- **History Management** - Save and replay previously generated episodes
- **Customizable Themes** - Cool, Warm, and Neon aesthetic options
- **Local Storage** - Persist your API keys and episode history
- **Robust Fallback** - Automatic switching between Llama models for reliability

## Tech Stack

- **Frontend**: React 18.x with Vite
- **Styling**: Tailwind CSS
- **Visualization**: HTML5 Canvas Rendering
- **APIs**: Groq (Intelligence), Deepgram (Audio)
- **Build Tool**: Vite 7.3.0

## Project Structure

```text
src/
├── App.jsx                          # Root component with error boundary
├── App.css                          # Global styles
├── main.jsx                         # Application entry point
├── components/
│   ├── common/
│   │   └── Icons.jsx               # Reusable SVG icon library
│   ├── layout/
│   │   ├── EchoCastTerminal.jsx    # Main orchestrator component
│   │   └── SettingsModal.jsx       # Global settings & auth dialog
│   ├── library/
│   │   └── Library.jsx             # Historical archive viewer
│   └── studio/
│       ├── AudioReactor.jsx        # Speaker indicator component
│       ├── CoverArt.jsx            # Algorithmic cover art generator
│       ├── StudioView.jsx          # Creation studio & live broadcast UI
│       └── TerminalVisualizer.jsx  # Interactive background visualizations
├── config/
│   ├── personas.js                 # AI persona definitions
│   └── themes.js                   # Theme color schemes
└── services/
    ├── aiService.js                # Groq LLM script generation wrapper
    └── deepgramService.js          # Deepgram TTS orchestration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **Groq API Key**: [Get it here](https://console.groq.com)
- **Deepgram API Key** (Optional): [Get it here](https://console.deepgram.com)

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
   Edit `.env` and add your keys:
   - `VITE_GROQ_API_KEY`: Required for script generation.
   - `VITE_DEEPGRAM_API_KEY`: Required for AI voices (optional, defaults to system TTS if missing).

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

### Component Architecture

The application follows a modular, domain-driven architecture:

- **Layout (`components/layout/`)**: Orchestrates global functionality, authentication, and the core routing shell (`EchoCastTerminal`).
- **Studio (`components/studio/`)**: The main creative engine. Handles script generation, timeline logic, and the live broadcast view containing dynamic visualizers and audio reactors.
- **Library (`components/library/`)**: Manages and displays previously archived episode transcripts and generation history.
- **Common (`components/common/`)**: Reusable UI primitives like our centralized SVG `Icons` component.

### API Services

#### `services/aiService.js`
Handles script generation using Groq's high-performance models:
1. **Primary**: `llama-3.3-70b-versatile` (Expert reasoning & creativity)
2. **Fallback**: `llama-3.1-8b-instant` (Speed & reliability)

#### `services/deepgramService.js`
Primary audio generation service:
- Converts scripts to speech using Deepgram TTS API
- Supports 6 voice personas with custom voice mapping
- Handles base64 encoding/decoding for audio data

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
- Try a different browser (Chrome, Firefox)
- Disable browser extensions that might interfere with rendering

## Performance Optimization

- Visualization is rendered only when needed
- localStorage persists data locally, reducing API calls
- Vite optimizes code splitting for faster initial load

## License

MIT License

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Version**: 1.0.0  
**Status**: Production Ready
