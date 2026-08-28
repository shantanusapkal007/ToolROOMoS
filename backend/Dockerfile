# Multi-stage build for Backend

# Stage 1: Development / Build dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build tools for native dependencies (Prisma, etc.)
RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Install runtime dependencies for Prisma and healthcheck
RUN apk add --no-cache openssl curl

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application and prisma runtime
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./prisma.config.ts

# Copy startup entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]

