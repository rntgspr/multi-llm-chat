# Synergy - Hono API + WebSocket Service
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Development image
FROM base AS dev
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

WORKDIR /app/apps/api

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "dev"]
