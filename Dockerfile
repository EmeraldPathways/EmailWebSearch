# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm ci --include=dev --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Production deps only
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --omit=dev && npm cache clean --force

# Compiled JS
COPY --from=builder /app/dist ./dist

# Static frontend
COPY client/ ./client/

# Snapshot storage dir (ephemeral on Cloud Run — mount a volume for persistence)
RUN mkdir -p /app/data/snapshots

# Cloud Run injects PORT; default to 3000
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/server.js"]
