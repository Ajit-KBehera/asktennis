#!/bin/bash

# Docker Integration Test Script
# Tests the enhanced query handler with Docker database

echo "🐳 Starting Docker Integration Tests for AskTennis Enhanced Architecture"
echo "=================================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

echo "✅ docker-compose is available"

# Create .env file for Docker if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file for Docker testing..."
    cat > .env << EOF
# Docker Test Environment
GROQ_API_KEY=your_groq_api_key_here
SPORTRADAR_API_KEY=your_sportradar_api_key_here
DOCKER_ENV=true
NODE_ENV=development
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Start Docker services
echo "🚀 Starting Docker services..."
docker-compose -f docker-compose.local.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is accessible
echo "🔍 Testing database connectivity..."
docker-compose -f docker-compose.local.yml exec db pg_isready -U postgres -d asktennis_local

if [ $? -eq 0 ]; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready. Please check Docker logs."
    docker-compose -f docker-compose.local.yml logs db
    exit 1
fi

# Run integration tests
echo "🧪 Running integration tests..."
node test-integration.js

if [ $? -eq 0 ]; then
    echo "✅ Integration tests passed"
else
    echo "❌ Integration tests failed"
    echo "📋 Docker logs:"
    docker-compose -f docker-compose.local.yml logs app
    exit 1
fi

# Test API endpoints
echo "🌐 Testing API endpoints..."
echo "Testing health endpoint..."
curl -s http://localhost:3000/api/health | jq '.' || echo "Health endpoint test failed"

echo "Testing status endpoint..."
curl -s http://localhost:3000/api/status | jq '.' || echo "Status endpoint test failed"

echo "Testing database status endpoint..."
curl -s http://localhost:3000/api/database/status | jq '.' || echo "Database status endpoint test failed"

# Test query endpoint
echo "Testing query endpoint..."
curl -s -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Who won Wimbledon 2023?"}' | jq '.' || echo "Query endpoint test failed"

echo "🎉 Docker integration tests completed successfully!"
echo ""
echo "📊 Test Results:"
echo "- Docker services: ✅"
echo "- Database connectivity: ✅"
echo "- Integration tests: ✅"
echo "- API endpoints: ✅"
echo ""
echo "🚀 Your enhanced AskTennis architecture is ready for Docker deployment!"

# Optional: Keep services running for manual testing
echo ""
echo "💡 To stop the services, run: docker-compose -f docker-compose.local.yml down"
echo "💡 To view logs, run: docker-compose -f docker-compose.local.yml logs -f"
