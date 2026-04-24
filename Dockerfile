# Multi-stage Dockerfile — works for Fly.io, Railway, Koyeb, any Docker host.
# Builds Next.js, then runs the custom Node server that owns the Socket.IO
# instance on the same port.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Keep the build under the Render free-tier 512 MB RAM ceiling.
ENV NODE_OPTIONS=--max-old-space-size=400
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOST=0.0.0.0
COPY --from=builder /app/.next ./.next
# public/ is optional in Next.js — use a glob pattern so the COPY succeeds
# even if the folder is empty or absent.
COPY --from=builder /app/public/ ./public/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
CMD ["npm", "start"]
