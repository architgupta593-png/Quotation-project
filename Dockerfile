# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci


# ── Stage 2: Build the application ──────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all project files
COPY . .

# Next.js collects anonymous telemetry — disable it during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application (standalone output)
RUN npm run build


# ── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the public assets
COPY --from=builder /app/public ./public

# Copy the standalone build output
# (requires `output: "standalone"` in next.config.mjs)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose the default Next.js port
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the application
CMD ["node", "server.js"]
