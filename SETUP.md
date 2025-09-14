# 🎾 AskTennis Setup Guide

## Prerequisites

Before setting up AskTennis, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher) - Optional but recommended for caching
- **OpenAI API Key** - Required for AI functionality

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

Or use the setup script:
```bash
npm run setup
```

### 2. Database Setup

#### PostgreSQL Setup
```bash
# Create database
createdb asktennis

# Or using psql
psql -U postgres
CREATE DATABASE asktennis;
\q
```

#### Redis Setup (Optional)
```bash
# Install Redis (macOS)
brew install redis

# Start Redis
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### 3. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=asktennis
DB_USER=postgres
DB_PASSWORD=your_password_here

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Seed the Database

```bash
npm run seed
```

This will create the database schema and populate it with sample tennis data.

### 5. Start the Application

#### Development Mode (Both Frontend and Backend)
```bash
npm run dev
```

#### Or Start Separately
```bash
# Backend only
npm run server

# Frontend only (in another terminal)
npm run client
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## Testing the System

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Test Query
```bash
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who has the most aces in Grand Slam finals?", "userId": "test-user"}'
```

### 3. Example Questions to Try

- "Who has the most aces in Grand Slam finals?"
- "What is Novak Djokovic's record against Rafael Nadal?"
- "Who has won the most Wimbledon titles?"
- "Which player has the highest first serve percentage?"
- "Who was the youngest player to win a Grand Slam?"

## Project Structure

```
asktennis/
├── src/
│   ├── database.js          # PostgreSQL connection and schema
│   ├── cache.js             # Redis caching layer
│   ├── queryHandler.js      # AI query processing
│   └── seedData.js          # Sample data for testing
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx          # Main application
│   │   └── index.tsx        # Entry point
│   └── package.json
├── server.js                # Express server
├── seed.js                  # Database seeding script
├── package.json
└── README.md
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Redis Connection Error**
   - Redis is optional - the app will work without it
   - If using Redis, ensure it's running on port 6379

3. **OpenAI API Error**
   - Verify your API key is correct
   - Check you have sufficient API credits
   - Ensure the key has GPT-3.5-turbo access

4. **Frontend Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

### Logs and Debugging

- Backend logs appear in the terminal running `npm run server`
- Frontend logs appear in the browser console
- Database queries are logged in the backend terminal

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=your_production_db_host
DB_PASSWORD=your_secure_password
OPENAI_API_KEY=your_production_api_key
```

### Build for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## API Endpoints

- `POST /api/query` - Submit a tennis question
- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the logs for error messages
- Ensure all prerequisites are installed correctly

---

**Happy Tennis Querying! 🎾**
