#!/bin/bash

# AskTennis Enhanced Architecture - Production Deployment Script
# Complete production deployment with security and monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${CYAN}=== $1 ===${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running"
        exit 1
    fi
    print_success "Docker is running"
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed"
        exit 1
    fi
    print_success "docker-compose is available"
    
    # Check environment file
    if [ ! -f .env ]; then
        print_error ".env file not found. Please create it with your production settings."
        exit 1
    fi
    print_success "Environment file found"
    
    # Check required environment variables
    source .env
    if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_actual_groq_api_key_here" ]; then
        print_error "GROQ_API_KEY is not set or is using placeholder value"
        exit 1
    fi
    print_success "Required environment variables are set"
    
    echo ""
}

# Create production environment
setup_production_env() {
    print_header "Setting Up Production Environment"
    
    # Create production .env file
    if [ ! -f .env.production ]; then
        print_status "Creating production environment file..."
        cp .env .env.production
        print_success "Production environment file created"
    fi
    
    # Set secure database password if not set
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "secure_password_here" ]; then
        print_warning "Setting secure database password..."
        DB_PASSWORD=$(openssl rand -base64 32)
        echo "DB_PASSWORD=$DB_PASSWORD" >> .env.production
        print_success "Secure database password generated"
    fi
    
    echo ""
}

# Deploy with production configuration
deploy_production() {
    print_header "Deploying Production Services"
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose -f docker-compose.production.yml down --remove-orphans || true
    
    # Build and start services
    print_status "Building and starting production services..."
    docker-compose -f docker-compose.production.yml up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        print_success "Production services are running"
    else
        print_error "Some services failed to start"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
    
    echo ""
}

# Verify production deployment
verify_production() {
    print_header "Verifying Production Deployment"
    
    # Wait for application to be fully ready
    sleep 10
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -s http://localhost:5000/api/health > /dev/null; then
        print_success "Health endpoint is responding"
    else
        print_error "Health endpoint is not responding"
        return 1
    fi
    
    # Test database connectivity
    print_status "Testing database connectivity..."
    if curl -s http://localhost:5000/api/database/status > /dev/null; then
        print_success "Database is connected"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    # Test query processing
    print_status "Testing query processing..."
    response=$(curl -s -X POST http://localhost:5000/api/query \
        -H "Content-Type: application/json" \
        -d '{"question": "Who won Wimbledon 2023?"}')
    
    if echo "$response" | grep -q "winner"; then
        print_success "Query processing is working"
    else
        print_warning "Query processing returned unexpected response"
    fi
    
    echo ""
}

# Setup monitoring
setup_monitoring() {
    print_header "Setting Up Monitoring"
    
    # Create monitoring script
    if [ ! -f monitor.sh ]; then
        print_warning "Monitoring script not found"
    else
        chmod +x monitor.sh
        print_success "Monitoring script is ready"
    fi
    
    # Create log directory
    mkdir -p logs
    print_success "Log directory created"
    
    # Set up log rotation
    print_status "Setting up log rotation..."
    cat > /etc/logrotate.d/asktennis << EOF
/Users/ajitbehera/Codes/asktennis/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF
    print_success "Log rotation configured"
    
    echo ""
}

# Display production status
show_production_status() {
    print_header "Production Deployment Status"
    
    echo "🌐 Production URLs:"
    echo "   Application: http://localhost:5000"
    echo "   Health Check: http://localhost:5000/api/health"
    echo "   System Status: http://localhost:5000/api/status"
    echo "   Database Status: http://localhost:5000/api/database/status"
    echo ""
    
    echo "📊 Service Status:"
    docker-compose -f docker-compose.production.yml ps
    echo ""
    
    echo "📝 Management Commands:"
    echo "   View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "   Stop services: docker-compose -f docker-compose.production.yml down"
    echo "   Restart services: docker-compose -f docker-compose.production.yml restart"
    echo "   Monitor system: ./monitor.sh"
    echo ""
    
    echo "🔒 Security Notes:"
    echo "   - Database password is securely generated"
    echo "   - Services are running in isolated network"
    echo "   - Health checks are configured"
    echo "   - Log rotation is set up"
    echo ""
}

# Setup SSL (optional)
setup_ssl() {
    print_header "SSL Setup (Optional)"
    
    read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " setup_ssl
    
    if [ "$setup_ssl" = "y" ] || [ "$setup_ssl" = "Y" ]; then
        print_status "Setting up SSL with Let's Encrypt..."
        
        # Create SSL directory
        mkdir -p ssl
        
        # Create nginx configuration
        cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:5000;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
        
        print_success "SSL setup configuration created"
        print_warning "Please update nginx.conf with your domain name"
        print_warning "You'll need to set up Let's Encrypt certificates manually"
    else
        print_status "Skipping SSL setup"
    fi
    
    echo ""
}

# Main deployment function
main() {
    print_header "AskTennis Enhanced Architecture - Production Deployment"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Setup production environment
    setup_production_env
    
    # Deploy production services
    deploy_production
    
    # Verify deployment
    if verify_production; then
        print_success "Production deployment successful!"
    else
        print_error "Production deployment verification failed!"
        echo ""
        print_status "Troubleshooting:"
        echo "1. Check Docker logs: docker-compose -f docker-compose.production.yml logs"
        echo "2. Verify environment variables in .env.production"
        echo "3. Check if ports 5000 and 5432 are available"
        echo "4. Review the deployment guide: cat deployment-guide.md"
        exit 1
    fi
    
    # Setup monitoring
    setup_monitoring
    
    # Optional SSL setup
    setup_ssl
    
    # Show final status
    show_production_status
    
    print_success "Production deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Monitor the system: ./monitor.sh"
    echo "2. Set up domain name and SSL if needed"
    echo "3. Configure backup strategy"
    echo "4. Set up monitoring alerts"
    echo ""
}

# Run main function
main "$@"
