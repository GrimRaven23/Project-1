# Multi-stage production Dockerfile for TelcoQualify Enterprise
# Base Image with minimal Alpine footprint
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependency installation stage
FROM base AS deps
WORKDIR /app
# devDependencies are omitted only here; the builder below needs them.
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Build stage
FROM base AS builder
WORKDIR /app
# SECURITY/CORRECTNESS: the base image used to set NODE_ENV=production for the
# whole build, which makes `npm ci` skip devDependencies (typescript, eslint,
# tailwind) and break `next build`. Build with the default environment and let
# Next.js choose production output itself.
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production runner stage
FROM node:24-alpine AS runner
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
COPY --from=builder --chown=telcouser:nodejs /app/scripts ./scripts
# Runtime upload directory (seeded with .gitkeep so COPY never fails on a
# fresh clone) — chowned so the non-root user can write uploads.
COPY --from=builder --chown=telcouser:nodejs /app/storage ./storage

USER telcouser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/liveness || exit 1

CMD ["npm", "run", "start"]
