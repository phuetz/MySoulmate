#!/bin/bash

###############################################################################
# MySoulmate Production Deployment Script
#
# This script deploys the application to the production environment
# with additional safety checks and rollback capabilities
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROD_HOST="${PROD_HOST:-mysoulmate.app}"
PROD_USER="${PROD_USER:-deploy}"
APP_DIR="/var/www/mysoulmate"
BRANCH="main"

echo -e "${RED}================================${NC}"
echo -e "${RED}MySoulmate PRODUCTION Deployment${NC}"
echo -e "${RED}================================${NC}"
echo ""
echo -e "${RED}⚠ WARNING: You are about to deploy to PRODUCTION${NC}"
echo ""

# Confirmation
read -p "Are you sure you want to deploy to PRODUCTION? (yes/NO) " -r
if [[ ! $REPLY = "yes" ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Second confirmation
read -p "Type the production hostname to confirm: " -r
if [[ ! $REPLY = "$PROD_HOST" ]]; then
    echo "Hostname mismatch. Deployment cancelled"
    exit 1
fi

echo ""
echo -e "${YELLOW}→ Running pre-deployment checks...${NC}"

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}✗ Git working directory is not clean${NC}"
    exit 1
fi

# Check if on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    echo -e "${RED}✗ Must be on '$BRANCH' branch for production deployment${NC}"
    exit 1
fi

# Check if branch is up to date
git fetch origin
if [[ $(git rev-parse HEAD) != $(git rev-parse origin/$BRANCH) ]]; then
    echo -e "${RED}✗ Local branch is not up to date with origin${NC}"
    exit 1
fi

# Run full test suite
echo -e "${YELLOW}→ Running full test suite...${NC}"
npm run test:coverage || {
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
}

# Run security audit
echo -e "${YELLOW}→ Running security audit...${NC}"
npm audit --audit-level=high || {
    echo -e "${RED}✗ Security audit found high/critical vulnerabilities${NC}"
    read -p "Continue anyway? (yes/NO) " -r
    if [[ ! $REPLY = "yes" ]]; then
        exit 1
    fi
}

# Build Docker image
echo -e "${YELLOW}→ Building production Docker image...${NC}"
docker build -t mysoulmate:production --target production . || {
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
}

# Tag with version
VERSION=$(git describe --tags --always)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag mysoulmate:production mysoulmate:$VERSION
docker tag mysoulmate:production mysoulmate:production-$TIMESTAMP

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"
echo ""

# Create backup
echo -e "${YELLOW}→ Creating database backup...${NC}"
# Add your backup command here
# ssh $PROD_USER@$PROD_HOST "cd $APP_DIR && npm run backup"

echo -e "${YELLOW}→ Deploying to production...${NC}"

# Deploy (customize for your infrastructure)
# Example with Docker:
# docker push mysoulmate:production
# docker push mysoulmate:$VERSION

# Example with SSH:
# ssh $PROD_USER@$PROD_HOST << 'ENDSSH'
#   cd $APP_DIR
#
#   # Pull latest changes
#   git pull origin main
#
#   # Pull Docker images
#   docker-compose pull
#
#   # Start new containers
#   docker-compose up -d --no-deps --build api
#
#   # Run migrations
#   docker-compose exec api npm run db:migrate
#
#   # Health check
#   sleep 10
#   curl -f http://localhost:3000/health || exit 1
# ENDSSH

echo ""
echo -e "${YELLOW}→ Running post-deployment checks...${NC}"

# Wait for services
sleep 10

# Health check
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$PROD_HOST/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_STATUS)${NC}"
    echo -e "${RED}Consider rolling back!${NC}"
    exit 1
fi

# Detailed health check
DETAILED_HEALTH=$(curl -s https://$PROD_HOST/health/detailed | jq -r '.status')
if [ "$DETAILED_HEALTH" = "ok" ]; then
    echo -e "${GREEN}✓ Detailed health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Detailed health check shows degraded status${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Production Deployment Successful!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Production URL: https://$PROD_HOST"
echo "Version: $VERSION"
echo "Deployment ID: production-$TIMESTAMP"
echo ""
echo -e "${BLUE}Monitor the application:${NC}"
echo "  - Logs: npm run logs:combined"
echo "  - Metrics: https://$PROD_HOST/metrics"
echo "  - Status: https://$PROD_HOST/status"
echo ""
echo -e "${YELLOW}If issues occur, rollback with:${NC}"
echo "  docker-compose up -d --no-deps api:previous-version"
