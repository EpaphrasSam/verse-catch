# Verse Catch

A real-time Bible verse detection system that processes audio streams from sermons and automatically identifies and extracts Bible verse references.

## Features

- 🎤 Real-time audio streaming and processing
- 📖 Automatic Bible verse detection using AI
- ⚡ Real-time updates with Pusher
- 🔍 Support for explicit, implicit, and contextual verse references
- 📊 Processing statistics and performance monitoring

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma
- **Real-time**: Pusher
- **AI/ML**:
  - OpenAI Whisper (Speech-to-Text)
  - Google Gemini (Verse Detection)

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Google Gemini API key
- Pusher account and credentials
- Git

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL="file:./bible.db"

# OpenAI
NEXT_PUBLIC_OPENAI_API_KEY="your_openai_api_key"

# Google Gemini
NEXT_PUBLIC_GEMINI_API_KEY="your_gemini_api_key"

# Pusher Configuration
NEXT_PUBLIC_PUSHER_APP_ID="your_pusher_app_id"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_SECRET="your_pusher_secret"
NEXT_PUBLIC_PUSHER_CLUSTER="your_pusher_cluster"

# App Config
NEXT_PUBLIC_NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/epaphrassam/verse-catch.git
   cd verse-catch
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the Bible database:

   ```bash
   # Clone the Bible translations repository
   git clone https://github.com/jadenzaleski/BibleTranslations.git

   # Generate Prisma client
   npm run db:generate

   # Create database schema
   npm run db:push

   # Import Bible translations
   npm run db:import
   ```

   Note: The Bible translations import may take several minutes depending on your system.

## Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click the "Start Listening" button to begin capturing audio
2. Speak or play sermon audio
3. The system will automatically:
   - Transcribe the audio in real-time
   - Detect Bible verse references
   - Display detected verses with confidence scores

## API Routes

- `POST /api/audio` - Process audio chunks and detect verses
- `WebSocket` - Real-time verse updates via Pusher

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security Note

Please ensure you keep your API keys and credentials secure. Never commit the `.env` file to version control.
