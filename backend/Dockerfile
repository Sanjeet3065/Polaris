# ============================================================
# POLARIS Backend — Production Multi-Stage Dockerfile
# Polar Operations & Logistics Automated Remote Intelligence System
# SIH 2026 - Problem Statement ID: SIH26060
# ============================================================

# ------------------------------------------------------------
# Stage 1: Build & Compilation Stage
# ------------------------------------------------------------
FROM node:20-alpine AS builder

# Required dependencies for Prisma Query Engine on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build production bundle
COPY src ./src
RUN npm run build

# ------------------------------------------------------------
# Stage 2: Production Runtime Stage
# ------------------------------------------------------------
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma and dumb-init for PID 1 signal forwarding
RUN apk add --no-cache openssl libc6-compat dumb-init wget

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Copy dependency manifests and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Generate Prisma Client in production environment
RUN npx prisma generate

# Copy compiled JavaScript output from builder
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R node:node /app

# Switch to non-root user
USER node

# Expose API and WebSocket port
EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

# Entrypoint wraps with dumb-init for graceful shutdown signals
ENTRYPOINT ["dumb-init", "--", "./entrypoint.sh"]

CMD ["node", "dist/server.js"]
