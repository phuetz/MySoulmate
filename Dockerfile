# Multi-stage build for MySoulmate API
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development dependencies (for building)
FROM base AS dev-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage (if needed for frontend assets)
FROM base AS builder
WORKDIR /app
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 mysoulmate

# Copy necessary files
COPY --from=deps --chown=mysoulmate:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mysoulmate:nodejs /app/src ./src
COPY --from=builder --chown=mysoulmate:nodejs /app/server.js ./
COPY --from=builder --chown=mysoulmate:nodejs /app/package.json ./

# Create directory for SQLite database
RUN mkdir -p /app/data && chown mysoulmate:nodejs /app/data

# Switch to non-root user
USER mysoulmate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
