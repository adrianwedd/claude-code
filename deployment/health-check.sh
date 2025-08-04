#!/bin/bash

# Claude Code Production Health Check Script
# This script performs comprehensive health checks for all system components

set -euo pipefail

# Configuration
BASE_URL="${HEALTH_CHECK_URL:-http://localhost:3001}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-10}"
RETRY_COUNT="${HEALTH_CHECK_RETRIES:-3}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
EMAIL_ALERTS="${EMAIL_ALERTS:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Health check function with retries
check_endpoint() {
    local url="$1"
    local name="$2"
    local expected_status="${3:-200}"
    local retries=0
    
    while [ $retries -lt $RETRY_COUNT ]; do
        if response=$(curl -s -w "%{http_code}" -o /tmp/health_response --max-time $TIMEOUT "$url" 2>/dev/null); then
            status_code="${response: -3}"
            if [ "$status_code" = "$expected_status" ]; then
                success "$name is healthy (HTTP $status_code)"
                return 0
            else
                warning "$name returned HTTP $status_code, expected $expected_status"
            fi
        else
            warning "$name is unreachable (attempt $((retries + 1))/$RETRY_COUNT)"
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $RETRY_COUNT ]; then
            sleep 2
        fi
    done
    
    error "$name health check failed after $RETRY_COUNT attempts"
    return 1
}

# Check service dependencies
check_dependencies() {
    local failed=0
    
    log "Checking system dependencies..."
    
    # Check if required commands exist
    for cmd in curl jq docker-compose; do
        if ! command -v $cmd &> /dev/null; then
            error "$cmd is not installed"
            failed=1
        else
            success "$cmd is available"
        fi
    done
    
    return $failed
}

# Main health checks
check_main_service() {
    log "Checking Claude Code WebSocket Server..."
    check_endpoint "$BASE_URL/health" "Main Service"
}

check_readiness() {
    log "Checking service readiness..."
    check_endpoint "$BASE_URL/ready" "Readiness Check"
}

check_liveness() {
    log "Checking service liveness..."
    check_endpoint "$BASE_URL/live" "Liveness Check"
}

check_metrics() {
    log "Checking metrics endpoint..."
    check_endpoint "$BASE_URL/metrics" "Metrics Endpoint"
}

# Database health check
check_database() {
    log "Checking database connectivity..."
    
    if response=$(curl -s --max-time $TIMEOUT "$BASE_URL/health" 2>/dev/null); then
        if echo "$response" | jq -e '.checks.database.status == "ok"' >/dev/null 2>&1; then
            success "Database is connected"
            return 0
        else
            error "Database connection failed"
            if echo "$response" | jq -e '.checks.database.error' >/dev/null 2>&1; then
                echo "$response" | jq -r '.checks.database.error'
            fi
            return 1
        fi
    else
        error "Cannot reach health endpoint to check database"
        return 1
    fi
}

# Redis health check
check_redis() {
    log "Checking Redis connectivity..."
    
    if response=$(curl -s --max-time $TIMEOUT "$BASE_URL/health" 2>/dev/null); then
        if echo "$response" | jq -e '.checks.redis.status == "ok"' >/dev/null 2>&1; then
            success "Redis is connected"
            return 0
        else
            error "Redis connection failed"
            if echo "$response" | jq -e '.checks.redis.error' >/dev/null 2>&1; then
                echo "$response" | jq -r '.checks.redis.error'
            fi
            return 1
        fi
    else
        error "Cannot reach health endpoint to check Redis"
        return 1
    fi
}

# Docker services health check
check_docker_services() {
    log "Checking Docker services..."
    
    if ! command -v docker-compose &> /dev/null; then
        warning "docker-compose not available, skipping Docker service checks"
        return 0
    fi
    
    local failed=0
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.production.yml" ]; then
        warning "docker-compose.production.yml not found, skipping Docker service checks"
        return 0
    fi
    
    # Get service status
    local services
    services=$(docker-compose -f docker-compose.production.yml ps --services 2>/dev/null || echo "")
    
    if [ -z "$services" ]; then
        warning "No Docker services found or docker-compose not running"
        return 0
    fi
    
    for service in $services; do
        if docker-compose -f docker-compose.production.yml ps "$service" | grep -q "Up"; then
            success "Docker service '$service' is running"
        else
            error "Docker service '$service' is not running"
            failed=1
        fi
    done
    
    return $failed
}

# Performance metrics check
check_performance() {
    log "Checking performance metrics..."
    
    if response=$(curl -s --max-time $TIMEOUT "$BASE_URL/health" 2>/dev/null); then
        # Check memory usage
        if memory_used=$(echo "$response" | jq -r '.checks.memory.used // "0"' 2>/dev/null); then
            if [ "${memory_used%.*}" -gt 500 ]; then  # More than 500MB
                warning "High memory usage: ${memory_used}MB"
            else
                success "Memory usage is normal: ${memory_used}MB"
            fi
        fi
        
        # Check uptime
        if uptime=$(echo "$response" | jq -r '.uptime // "0"' 2>/dev/null); then
            uptime_hours=$(echo "$uptime / 3600" | bc -l 2>/dev/null || echo "0")
            success "Service uptime: ${uptime_hours%.*} hours"
        fi
        
        # Check response time
        response_time=$(echo "$response" | jq -r '.responseTime // "0"' 2>/dev/null)
        if [ "${response_time%.*}" -gt 1000 ]; then  # More than 1 second
            warning "Slow response time: ${response_time}ms"
        else
            success "Response time is good: ${response_time}ms"
        fi
    else
        error "Cannot retrieve performance metrics"
        return 1
    fi
}

# SSL certificate check
check_ssl() {
    log "Checking SSL certificate..."
    
    # Extract hostname from URL
    hostname=$(echo "$BASE_URL" | sed 's|https\?://||' | sed 's|/.*||' | sed 's|:.*||')
    
    if [[ "$BASE_URL" == https://* ]]; then
        if cert_info=$(echo | openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
            expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            if expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null); then
                current_timestamp=$(date +%s)
                days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ $days_until_expiry -lt 30 ]; then
                    warning "SSL certificate expires in $days_until_expiry days"
                else
                    success "SSL certificate is valid for $days_until_expiry days"
                fi
            else
                warning "Could not parse SSL certificate expiry date"
            fi
        else
            error "Could not retrieve SSL certificate information"
        fi
    else
        warning "Not using HTTPS, skipping SSL check"
    fi
}

# Send alert notifications
send_alert() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        local color="good"
        local emoji="✅"
        
        if [ "$status" = "warning" ]; then
            color="warning"
            emoji="⚠️"
        elif [ "$status" = "error" ]; then
            color="danger"
            emoji="❌"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji Claude Code Health Check: $message\", \"color\":\"$color\"}" \
            "$SLACK_WEBHOOK" &>/dev/null || true
    fi
    
    # Email notification (requires mailx or similar)
    if [ -n "$EMAIL_ALERTS" ] && command -v mailx &> /dev/null; then
        echo "$message" | mailx -s "Claude Code Health Check: $status" "$EMAIL_ALERTS" &>/dev/null || true
    fi
}

# Main execution
main() {
    log "Starting Claude Code health check..."
    log "Target: $BASE_URL"
    
    local overall_status="healthy"
    local failed_checks=0
    local total_checks=0
    
    # Run all health checks
    checks=(
        "check_dependencies"
        "check_main_service"
        "check_readiness"
        "check_liveness"
        "check_database"
        "check_redis"
        "check_docker_services"
        "check_performance"
        "check_ssl"
        "check_metrics"
    )
    
    for check in "${checks[@]}"; do
        echo
        total_checks=$((total_checks + 1))
        if ! $check; then
            failed_checks=$((failed_checks + 1))
            if [ "$overall_status" = "healthy" ]; then
                overall_status="degraded"
            fi
        fi
    done
    
    echo
    log "Health check completed!"
    log "Checks passed: $((total_checks - failed_checks))/$total_checks"
    
    # Determine final status
    if [ $failed_checks -eq 0 ]; then
        success "All systems are healthy! 🎉"
        send_alert "success" "All health checks passed ($total_checks/$total_checks)"
        exit 0
    elif [ $failed_checks -lt 3 ]; then
        warning "System is degraded but operational ($failed_checks failures)"
        send_alert "warning" "Health check degraded: $failed_checks/$total_checks checks failed"
        exit 1
    else
        error "System is unhealthy! ($failed_checks failures)"
        send_alert "error" "Health check failed: $failed_checks/$total_checks checks failed"
        exit 2
    fi
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "quick")
        log "Running quick health check..."
        check_main_service && check_readiness
        ;;
    "deps")
        check_dependencies
        ;;
    "docker")
        check_docker_services
        ;;
    *)
        echo "Usage: $0 [check|quick|deps|docker]"
        echo "  check  - Full health check (default)"
        echo "  quick  - Quick health check (main service only)"
        echo "  deps   - Check dependencies only"
        echo "  docker - Check Docker services only"
        exit 1
        ;;
esac