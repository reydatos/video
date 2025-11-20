# AI Video Podcast - Interactive Recording App

A beautiful web application that turns video recording into an interactive conversation with AI. Perfect for content creators, podcasters, and anyone who wants engaging AI-guided video recording.

## Features

- **AI-Powered Prompts**: Gemini AI generates thoughtful questions to guide your recording
- **Live Interactive Questions**: AI listens to you in real-time and asks follow-up questions
- **Multiple Aspect Ratios**: Choose from 9:16 (Stories), 16:9 (Landscape), 3:4 (Portrait), or 1:1 (Square)
- **Real-Time Transcription**: See what you're saying live with Web Speech API
- **Video Download**: Save your recordings as video files
- **Pastel Design**: Beautiful, classy UI with calming pastel colors
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile

## How It Works

1. **Setup**: Enter your Gemini API key and choose your preferred video aspect ratio
2. **Record**: The AI presents an opening question to get you started
3. **Interact**: As you speak, AI listens and generates relevant follow-up questions
4. **Download**: Save your video recording when done

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Edge, Safari, or Firefox)
- Gemini API key from Google

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Running the App

#### Option 1: Local Development

1. Clone this repository
2. Open `index.html` in your web browser
3. Enter your Gemini API key
4. Allow camera and microphone permissions when prompted
5. Start recording!

#### Option 2: Using a Local Server

```bash
# Python 3
python -m http.server 8000

# Node.js (with npx)
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## Usage Guide

### 1. Initial Setup

- **API Key**: Enter your Gemini API key (stored locally in your browser)
- **Aspect Ratio**: Choose your video format:
  - 9:16 - Perfect for Instagram Stories, TikTok, Reels
  - 16:9 - Standard YouTube, landscape videos
  - 3:4 - Portrait format for social media
  - 1:1 - Square format for Instagram posts

### 2. Recording

- Click "Start Recording Session" to access your camera
- AI will present an opening question
- Click the red "Start Recording" button when ready
- Speak naturally - AI will listen and ask follow-up questions
- Questions appear as text overlays at the bottom of your video
- Watch your live transcript on the right panel

### 3. AI Interaction

The AI:
- Generates an engaging opening question
- Listens to your speech in real-time
- Asks relevant follow-up questions every ~30 words
- Maintains conversation context for natural flow
- Questions appear smoothly as text overlays

### 4. After Recording

- Click "Stop" to end recording
- Review your transcript
- Click "Download MP4" to save your video
- Click "New Recording" to start fresh

## Technical Details

### Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari**: Full support
- **Firefox**: Full support
- **Mobile Browsers**: Supported with camera access

### APIs Used

- **MediaDevices API**: Camera and microphone access
- **MediaRecorder API**: Video recording
- **Web Speech API**: Real-time speech recognition
- **Gemini API**: AI-powered question generation

### Privacy & Security

- API key stored locally in browser (localStorage)
- No data sent to third parties except Google Gemini API
- Recordings stay on your device
- No server-side storage

### Video Format

- Recording format: WebM (widely supported)
- Download format: WebM with .webm extension
- For MP4 conversion, use online tools like CloudConvert or HandBrake

## Customization

### Changing Colors

Edit `styles.css` and modify the CSS variables:

```css
:root {
    --pastel-pink: #FFD6E8;
    --pastel-blue: #C7CEEA;
    /* ... more colors */
}
```

### Adjusting AI Behavior

In `app.js`, modify:
- Question frequency: Line ~216 (`if (currentLength - lastTranscriptLength > 30)`)
- AI temperature: Line ~153 (`temperature: 0.9`)
- Question length: Line ~237 (`max 20 words`)

## Troubleshooting

### Camera Not Working
- Ensure you've granted camera permissions
- Check if another app is using the camera
- Try a different browser

### Speech Recognition Not Working
- Speak clearly and at a moderate pace
- Check microphone permissions
- Ensure you're in a quiet environment
- Web Speech API works best in Chrome

### API Errors
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you have API quota remaining

### Download Issues
- Some browsers may block automatic downloads
- Check your browser's download settings
- Try right-clicking the video preview and "Save Video As"

## Limitations

- Video download is in WebM format (requires conversion for MP4)
- Speech recognition requires internet connection
- Best experience in Chrome/Edge browsers
- Gemini API rate limits apply

## Future Enhancements

- True MP4 export using ffmpeg.wasm
- Custom prompt templates
- Background blur/effects
- Multi-language support
- Export transcript as text file
- Social media direct upload

## Credits

Built with:
- Gemini 1.5 Flash API
- Web Speech API
- MediaRecorder API
- Pure vanilla JavaScript (no frameworks)

## License

MIT License - feel free to use and modify for your projects!

## Support

For issues or questions, please open an issue on GitHub.

---

**Enjoy creating amazing AI-guided video content!**
