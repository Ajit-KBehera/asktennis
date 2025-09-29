#!/bin/bash

# AskTennis Enhanced Architecture - Monitoring Script
# Real-time monitoring of system health and performance

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
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo -e "${CYAN}=== $1 ===${NC}"
}

# Check if services are running
check_services() {
    print_header "Docker Services Status"
    
    if docker-compose -f docker-compose.local.yml ps | grep -q "Up"; then
        print_success "Docker services are running"
        docker-compose -f docker-compose.local.yml ps
    else
        print_error "Docker services are not running"
        return 1
    fi
    echo ""
}

# Check application health
check_health() {
    print_header "Application Health Check"
    
    local health_url="http://localhost:3000/api/health"
    
    if curl -s "$health_url" > /dev/null; then
        print_success "Application is responding"
        
        # Get detailed health info
        local health_data=$(curl -s "$health_url")
        local status=$(echo "$health_data" | jq -r '.status // "unknown"')
        local db_connected=$(echo "$health_data" | jq -r '.database.connected // false')
        
        if [ "$status" = "healthy" ]; then
            print_success "Application status: $status"
        else
            print_warning "Application status: $status"
        fi
        
        if [ "$db_connected" = "true" ]; then
            print_success "Database connection: active"
        else
            print_error "Database connection: inactive"
        fi
    else
        print_error "Application is not responding"
        return 1
    fi
    echo ""
}

# Check database status
check_database() {
    print_header "Database Status"
    
    local db_url="http://localhost:3000/api/database/status"
    
    if curl -s "$db_url" > /dev/null; then
        print_success "Database status endpoint responding"
        
        # Get database info
        local db_data=$(curl -s "$db_url")
        local is_connected=$(echo "$db_data" | jq -r '.isConnected // false')
        local reconnect_attempts=$(echo "$db_data" | jq -r '.reconnectAttempts // 0')
        local total_connections=$(echo "$db_data" | jq -r '.poolStats.totalCount // 0')
        local idle_connections=$(echo "$db_data" | jq -r '.poolStats.idleCount // 0')
        
        if [ "$is_connected" = "true" ]; then
            print_success "Database connected"
            print_status "Reconnection attempts: $reconnect_attempts"
            print_status "Total connections: $total_connections"
            print_status "Idle connections: $idle_connections"
        else
            print_error "Database not connected"
        fi
    else
        print_error "Database status endpoint not responding"
        return 1
    fi
    echo ""
}

# Check system performance
check_performance() {
    print_header "System Performance"
    
    local status_url="http://localhost:3000/api/status"
    
    if curl -s "$status_url" > /dev/null; then
        print_success "System status endpoint responding"
        
        # Get system info
        local system_data=$(curl -s "$status_url")
        local uptime=$(echo "$system_data" | jq -r '.system.uptime // 0')
        local memory_rss=$(echo "$system_data" | jq -r '.system.memory.rss // 0')
        local memory_heap=$(echo "$system_data" | jq -r '.system.memory.heapUsed // 0')
        local node_version=$(echo "$system_data" | jq -r '.system.nodeVersion // "unknown"')
        
        print_status "Uptime: $(printf "%.2f" $uptime) seconds"
        print_status "Memory RSS: $(($memory_rss / 1024 / 1024)) MB"
        print_status "Memory Heap: $(($memory_heap / 1024 / 1024)) MB"
        print_status "Node Version: $node_version"
    else
        print_error "System status endpoint not responding"
        return 1
    fi
    echo ""
}

# Test query processing
test_queries() {
    print_header "Query Processing Test"
    
    local query_url="http://localhost:3000/api/query"
    local test_queries=(
        "Who won Wimbledon 2023?"
        "Head to head between Federer and Nadal"
        "Current ATP rankings"
    )
    
    for query in "${test_queries[@]}"; do
        print_status "Testing: \"$query\""
        
        local response=$(curl -s -X POST "$query_url" \
            -H "Content-Type: application/json" \
            -d "{\"question\": \"$query\"}")
        
        if echo "$response" | grep -q "error"; then
            print_warning "Query returned error: $(echo "$response" | jq -r '.error // "unknown"')"
        else
            print_success "Query processed successfully"
        fi
    done
    echo ""
}

# Show real-time logs
show_logs() {
    print_header "Real-time Application Logs"
    print_status "Press Ctrl+C to stop monitoring logs"
    echo ""
    
    docker-compose -f docker-compose.local.yml logs -f app
}

# Show cache statistics
show_cache_stats() {
    print_header "Cache Statistics"
    
    local health_url="http://localhost:3000/api/health"
    
    if curl -s "$health_url" > /dev/null; then
        local health_data=$(curl -s "$health_url")
        local service_cache_size=$(echo "$health_data" | jq -r '.cache.serviceCache.size // 0')
        local repository_cache_size=$(echo "$health_data" | jq -r '.cache.repositoryCache.size // 0')
        
        print_status "Service cache size: $service_cache_size"
        print_status "Repository cache size: $repository_cache_size"
        
        if [ "$service_cache_size" -gt 0 ] || [ "$repository_cache_size" -gt 0 ]; then
            print_success "Caching is active"
        else
            print_warning "No cached data found"
        fi
    else
        print_error "Cannot retrieve cache statistics"
    fi
    echo ""
}

# Clear caches
clear_caches() {
    print_header "Cache Management"
    
    local cache_url="http://localhost:3000/api/cache/clear"
    
    print_status "Clearing all caches..."
    
    local response=$(curl -s -X POST "$cache_url")
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [ "$success" = "true" ]; then
        print_success "Caches cleared successfully"
    else
        print_error "Failed to clear caches"
    fi
    echo ""
}

# Main monitoring menu
show_menu() {
    echo -e "${CYAN}AskTennis Enhanced Architecture - Monitoring Dashboard${NC}"
    echo "=================================================="
    echo ""
    echo "1. Full System Check"
    echo "2. Check Services"
    echo "3. Check Health"
    echo "4. Check Database"
    echo "5. Check Performance"
    echo "6. Test Queries"
    echo "7. Show Cache Stats"
    echo "8. Clear Caches"
    echo "9. Show Real-time Logs"
    echo "10. Exit"
    echo ""
}

# Full system check
full_check() {
    print_header "Full System Check"
    echo ""
    
    check_services
    check_health
    check_database
    check_performance
    show_cache_stats
    
    print_success "Full system check completed"
    echo ""
}

# Interactive monitoring
interactive_monitor() {
    while true; do
        show_menu
        read -p "Select an option (1-10): " choice
        
        case $choice in
            1)
                full_check
                ;;
            2)
                check_services
                ;;
            3)
                check_health
                ;;
            4)
                check_database
                ;;
            5)
                check_performance
                ;;
            6)
                test_queries
                ;;
            7)
                show_cache_stats
                ;;
            8)
                clear_caches
                ;;
            9)
                show_logs
                ;;
            10)
                print_success "Exiting monitoring dashboard"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-10."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

# Continuous monitoring
continuous_monitor() {
    print_header "Continuous Monitoring"
    print_status "Monitoring every 30 seconds. Press Ctrl+C to stop."
    echo ""
    
    while true; do
        echo "$(date): Running health check..."
        check_health
        check_database
        echo "---"
        sleep 30
    done
}

# Main function
main() {
    case "${1:-interactive}" in
        "interactive")
            interactive_monitor
            ;;
        "continuous")
            continuous_monitor
            ;;
        "check")
            full_check
            ;;
        "logs")
            show_logs
            ;;
        *)
            echo "Usage: $0 [interactive|continuous|check|logs]"
            echo ""
            echo "  interactive  - Interactive monitoring dashboard (default)"
            echo "  continuous   - Continuous monitoring every 30 seconds"
            echo "  check        - Run full system check once"
            echo "  logs         - Show real-time application logs"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
