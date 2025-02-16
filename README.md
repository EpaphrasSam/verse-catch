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
- **Database**: SQLite with Prisma (read-only in production)
- **Real-time**: Pusher
- **AI/ML**:
  - OpenAI Whisper (Speech-to-Text)
  - Google Gemini (Verse Detection)

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Google Gemini API key
- Pusher account and credentials

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL="file:./bible.db"  # Prisma will look in the prisma directory by default

# OpenAI (Server-side only)
OPENAI_API_KEY="your_openai_api_key"

# Google Gemini (Server-side only)
GEMINI_API_KEY="your_gemini_api_key"

# Pusher Configuration
PUSHER_APP_ID="your_pusher_app_id"          # Server-side only
PUSHER_SECRET="your_pusher_secret"          # Server-side only
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"    # Available client-side
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"   # Available client-side

# App Config
NEXT_PUBLIC_NODE_ENV="development"          # Available client-side
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/verse-catch.git
   cd verse-catch
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the Bible database:

   ```bash
   # This will:
   # 1. Clone BibleTranslations if not present
   # 2. Generate Prisma client
   # 3. Create database schema
   # 4. Import Bible translations
   npm run db:import
   ```

   Note: The Bible translations import may take several minutes depending on your system.

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

The project uses SQLite for fast, local database operations. There are several database-related scripts:

- `npm run db:check` - Checks/clones the BibleTranslations repository
- `npm run db:setup` - Generates Prisma client and pushes schema
- `npm run db:import` - Full database setup and import (combines above commands)

## Deployment

The project is optimized for Vercel deployment with a pre-built database strategy:

1. Build database locally:

   ```bash
   npm run db:import
   ```

2. Upload the generated `prisma/bible.db` to GitHub Releases

   - Create a new release in your GitHub repository
   - Upload the bible.db file
   - Note the download URL (will be something like `https://github.com/username/verse-catch/releases/download/tag/bible.db`)

3. Deploy to Vercel:
   - The deployment will automatically download the pre-built database using curl
   - No database building during deployment
   - Fast, read-only database access in production

Note: The deployment process uses `curl` to download the database file from GitHub Releases. Make sure your release is publicly accessible.

## API Routes

- `POST /api/audio` - Process audio chunks and detect verses
- Real-time updates via Pusher

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
