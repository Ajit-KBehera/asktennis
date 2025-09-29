#!/bin/bash

# AskTennis Enhanced Architecture - Quick Start Script
# One-command deployment for development and testing

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${GREEN}🎾 AskTennis Enhanced Architecture - Quick Start${NC}"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    print_warning "Creating .env file from template..."
    cp env.example .env
    print_warning "Please update .env with your GROQ_API_KEY before continuing"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Choose deployment type
echo "Select deployment type:"
echo "1. Development (Local testing)"
echo "2. Production (Full deployment)"
echo ""
read -p "Enter choice (1-2): " choice

case $choice in
    1)
        print_status "Starting development deployment..."
        ./deploy.sh
        ;;
    2)
        print_status "Starting production deployment..."
        ./deploy-production.sh
        ;;
    *)
        print_warning "Invalid choice. Starting development deployment..."
        ./deploy.sh
        ;;
esac

echo ""
print_success "Quick start completed!"
echo ""
echo "📚 Available commands:"
echo "  ./monitor.sh          - Monitor system health"
echo "  ./deploy.sh           - Development deployment"
echo "  ./deploy-production.sh - Production deployment"
echo ""
echo "📖 Documentation:"
echo "  cat deployment-guide.md - Complete deployment guide"
echo "  cat ARCHITECTURE.md     - Architecture documentation"
echo ""
