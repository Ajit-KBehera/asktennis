#!/bin/bash

# AskTennis Enhanced Architecture - Deployment Script
# Automated deployment with health checks and verification

set -e  # Exit on any error

echo "🚀 AskTennis Enhanced Architecture - Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
    print_success "docker-compose is available"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_warning "Please update .env file with your actual API keys before continuing."
        print_warning "Required: GROQ_API_KEY"
        print_warning "Optional: SPORTRADAR_API_KEY"
        read -p "Press Enter to continue after updating .env file..."
    fi
    print_success "Environment configuration ready"
}

# Deploy database
deploy_database() {
    print_status "Deploying PostgreSQL database..."
    
    # Start database service
    docker-compose -f docker-compose.local.yml up -d db
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Check database connectivity
    if docker-compose -f docker-compose.local.yml exec db pg_isready -U postgres -d asktennis_local; then
        print_success "Database is ready"
    else
        print_error "Database failed to start. Check logs:"
        docker-compose -f docker-compose.local.yml logs db
        exit 1
    fi
}

# Deploy application
deploy_application() {
    print_status "Deploying AskTennis application..."
    
    # Build and start application
    docker-compose -f docker-compose.local.yml up -d app
    
    # Wait for application to start
    print_status "Waiting for application to start..."
    sleep 15
    
    # Check if application is running
    if docker-compose -f docker-compose.local.yml ps app | grep -q "Up"; then
        print_success "Application is running"
    else
        print_error "Application failed to start. Check logs:"
        docker-compose -f docker-compose.local.yml logs app
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait for application to be fully ready
    sleep 5
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -s http://localhost:5000/api/health > /dev/null; then
        print_success "Health endpoint is responding"
    else
        print_error "Health endpoint is not responding"
        return 1
    fi
    
    # Test database status
    print_status "Testing database status..."
    if curl -s http://localhost:5000/api/database/status > /dev/null; then
        print_success "Database status endpoint is responding"
    else
        print_error "Database status endpoint is not responding"
        return 1
    fi
    
    # Test query endpoint
    print_status "Testing query endpoint..."
    response=$(curl -s -X POST http://localhost:5000/api/query \
        -H "Content-Type: application/json" \
        -d '{"question": "Who won Wimbledon 2023?"}')
    
    if echo "$response" | grep -q "winner"; then
        print_success "Query endpoint is working"
    else
        print_warning "Query endpoint returned unexpected response"
        echo "Response: $response"
    fi
}

# Display deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Health Check: http://localhost:5000/api/health"
    echo "   System Status: http://localhost:5000/api/status"
    echo "   Database Status: http://localhost:5000/api/database/status"
    echo "   Query Endpoint: http://localhost:5000/api/query"
    echo ""
    echo "📊 Docker Services:"
    docker-compose -f docker-compose.local.yml ps
    echo ""
    echo "📝 Useful Commands:"
    echo "   View logs: docker-compose -f docker-compose.local.yml logs -f"
    echo "   Stop services: docker-compose -f docker-compose.local.yml down"
    echo "   Restart services: docker-compose -f docker-compose.local.yml restart"
    echo ""
}

# Main deployment process
main() {
    echo ""
    print_status "Starting AskTennis Enhanced Architecture deployment..."
    echo ""
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Deploy database
    deploy_database
    
    # Step 3: Deploy application
    deploy_application
    
    # Step 4: Verify deployment
    if verify_deployment; then
        print_success "Deployment completed successfully!"
        echo ""
        show_status
    else
        print_error "Deployment verification failed!"
        echo ""
        print_status "Troubleshooting:"
        echo "1. Check Docker logs: docker-compose -f docker-compose.local.yml logs"
        echo "2. Verify environment variables in .env file"
        echo "3. Check if ports 5000 and 5432 are available"
        echo "4. Review the deployment guide: cat deployment-guide.md"
        exit 1
    fi
}

# Run main function
main "$@"
