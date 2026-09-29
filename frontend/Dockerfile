# ============================================================
# POLARIS Frontend — Production Multi-Stage Dockerfile
# Polar Operations & Logistics Automated Remote Intelligence System
# SIH 2026 - Problem Statement ID: SIH26060
# ============================================================

# ------------------------------------------------------------
# Stage 1: Build & Compilation Stage
# ------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for frontend environment configuration
ARG VITE_API_URL=/api/v1
ARG VITE_WS_URL=/ws
ARG VITE_STATION_DEFAULT=BHARATI

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_STATION_DEFAULT=$VITE_STATION_DEFAULT

# Copy package manifests and configuration files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Install dependencies deterministically
RUN npm ci

# Copy application source and assets
COPY index.html ./
COPY src ./src
COPY public ./public

# Build optimized production bundle
RUN npm run build

# ------------------------------------------------------------
# Stage 2: Production Nginx Server Stage
# ------------------------------------------------------------
FROM nginx:alpine AS runner

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom Nginx configuration with SPA fallback and gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Container Healthcheck Probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
