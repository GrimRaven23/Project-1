# Multi-stage production Dockerfile for TelcoQualify Enterprise
# Base Image with minimal Alpine footprint
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# Dependency installation stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build stage
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for enterprise container security (ASVS V14.2)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 telcouser

COPY --from=builder /app/public ./public
COPY --from=builder --chown=telcouser:nodejs /app/.next ./.next
COPY --from=builder --chown=telcouser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=telcouser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=telcouser:nodejs /app/storage ./storage

USER telcouser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/liveness || exit 1

CMD ["npm", "run", "start"]
