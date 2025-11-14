#!/bin/bash

###############################################################################
# MySoulmate Staging Deployment Script
#
# This script deploys the application to the staging environment
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_HOST="${STAGING_HOST:-staging.mysoulmate.app}"
STAGING_USER="${STAGING_USER:-deploy}"
APP_DIR="/var/www/mysoulmate"
BRANCH="develop"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}MySoulmate Staging Deployment${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Pre-deployment checks
echo -e "${YELLOW}→ Running pre-deployment checks...${NC}"

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}✗ Git working directory is not clean${NC}"
    echo "Please commit or stash your changes before deploying"
    exit 1
fi

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    echo -e "${YELLOW}⚠ You are on branch '$CURRENT_BRANCH', not '$BRANCH'${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run tests
echo -e "${YELLOW}→ Running tests...${NC}"
npm test || {
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
}

# Run linter
echo -e "${YELLOW}→ Running linter...${NC}"
npm run lint || {
    echo -e "${RED}✗ Linting failed${NC}"
    exit 1
}

# Build Docker image
echo -e "${YELLOW}→ Building Docker image...${NC}"
docker build -t mysoulmate:staging . || {
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
}

# Tag image with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag mysoulmate:staging mysoulmate:staging-$TIMESTAMP

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"
echo ""

# Deploy
echo -e "${YELLOW}→ Deploying to staging...${NC}"

# Push to Docker registry (if using one)
# docker push mysoulmate:staging
# docker push mysoulmate:staging-$TIMESTAMP

# SSH deployment example
# Uncomment and customize for your infrastructure
# ssh $STAGING_USER@$STAGING_HOST << 'ENDSSH'
#   cd $APP_DIR
#   git pull origin $BRANCH
#   docker-compose pull
#   docker-compose up -d --no-deps --build api
#   docker-compose exec api npm run db:migrate
# ENDSSH

echo -e "${GREEN}✓ Deployment completed${NC}"
echo ""

# Run smoke tests
echo -e "${YELLOW}→ Running smoke tests...${NC}"
sleep 5  # Wait for services to start

# Check health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$STAGING_HOST/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_STATUS)${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Staging URL: https://$STAGING_HOST"
echo "Version: staging-$TIMESTAMP"
echo ""
echo "Next steps:"
echo "  1. Test the staging environment"
echo "  2. Run: npm run deploy:production (when ready)"
