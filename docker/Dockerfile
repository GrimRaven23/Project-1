# Multi-stage production Dockerfile for TelcoQualify Enterprise
# Base Image with minimal Alpine footprint
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependency installation + build stage
FROM base AS builder
WORKDIR /app
# SECURITY/CORRECTNESS (fixed 2026-10-23, caught by the first release build):
# this stage previously set `ENV NODE_ENV=development` so that `npm ci` would
# install devDependencies. That is not how npm decides, and it broke the build:
# `next build` ran under a non-standard NODE_ENV, which duplicated React's
# runtime resolution and crashed prerendering the built-in /404 with
# "TypeError: Cannot read properties of null (reading 'useContext')" and
# "<Html> should not be imported outside of pages/_document".
# The correct lever is `npm ci --include=dev`, leaving NODE_ENV unset so
# `next build` sets production itself.
# The separate `deps` stage that ran `npm ci --omit=dev` was also removed: no
# `COPY --from=deps` ever referenced it, so it was pure build-time waste.
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json* ./
RUN npm ci --include=dev
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
