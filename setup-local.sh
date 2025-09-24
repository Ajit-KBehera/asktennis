#!/bin/bash

echo "🎾 Setting up AskTennis Local AI System..."

# Create data directory if it doesn't exist
mkdir -p data

# Copy environment file
cp .env.local .env

# Start the local system
echo "🚀 Starting local development environment..."
docker-compose -f docker-compose.local.yml up -d --build

echo "✅ AskTennis Local AI System is starting up!"
echo "📱 Open: http://localhost:3000"
echo "🤖 Features: Full AI Mode with Local Database"
echo "💾 Database: PostgreSQL with tennis data"
echo "🔄 Data: GitHub tennis datasets loaded locally"
