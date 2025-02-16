# Verse Catch

A real-time Bible verse detection system that processes audio streams from sermons and automatically identifies and extracts Bible verse references.

## Features

- 🎤 Real-time audio streaming and processing
- 📖 Automatic Bible verse detection using AI
- ⚡ Real-time updates with Pusher
- 🔍 Support for explicit, implicit, and contextual verse references
- 📊 Processing statistics and performance monitoring
- 🔄 Automatic database warmup with uptime monitoring

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**:
  - Development: SQLite with Prisma
  - Production: PostgreSQL (Neon) with Prisma
- **Real-time**: Pusher
- **Monitoring**: Uptime Robot
- **AI/ML**:
  - OpenAI Whisper (Speech-to-Text)
  - Google Gemini (Verse Detection)

## Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Google Gemini API key
- Pusher account and credentials
- PostgreSQL database for production (Neon)
- Uptime Robot account (for database warmup)

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL="file:./bible.db"  # Local development
# DATABASE_URL="postgresql://..." # Production PostgreSQL URL

# OpenAI (Server-side only)
OPENAI_API_KEY="your_openai_api_key"

# Google Gemini (Server-side only)
GEMINI_API_KEY="your_gemini_api_key"

# Pusher Configuration
PUSHER_APP_ID="your_pusher_app_id"          # Server-side only
PUSHER_SECRET="your_pusher_secret"          # Server-side only
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"    # Available client-side
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"   # Available client-side

# Monitoring (optional)
MONITOR_KEY="your_monitor_key"              # For securing warmup endpoint

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
   # For local development with SQLite:
   npm run db:import

   # For production with PostgreSQL:
   npm run db:migrate-postgres
   ```

   Note: The Bible translations import may take several minutes depending on your system.

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

The project supports both SQLite and PostgreSQL:

### Local Development (SQLite)

- `npm run db:check` - Checks/clones the BibleTranslations repository
- `npm run db:setup` - Generates Prisma client and pushes schema
- `npm run db:import` - Full database setup and import

### Production (PostgreSQL)

- `npm run db:migrate-postgres` - Migrates data from SQLite to PostgreSQL
- Automatic database warmup every 5 minutes via Uptime Robot

## Deployment

The project is optimized for Vercel deployment with PostgreSQL support:

1. Set up PostgreSQL database:

   - Create a Neon account and database
   - Set up the database schema and import data using `db:migrate-postgres`
   - Add the PostgreSQL connection string to your environment variables

2. Set up database monitoring:

   - Create an Uptime Robot account
   - Add a monitor for the `/api/warmup` endpoint
   - Set 5-minute check interval
   - (Optional) Add monitor key to environment variables

3. Deploy to Vercel:
   - Add all required environment variables
   - Deploy your application
   - Verify database connection and monitoring

## API Routes

- `POST /api/audio` - Process audio chunks and detect verses
- `GET /api/warmup` - Database warmup endpoint (monitored by Uptime Robot)
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

Please ensure you keep your API keys and credentials secure. Never commit the `.env` file or database credentials to version control.
