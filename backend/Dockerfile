# Multi-stage build for Backend

# Stage 1: Development / Build dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build tools for native dependencies (Prisma, etc.)
RUN apk add --no-cache python3 make g++

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

# Only copy over package definitions for production install
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Environment defaults
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/main.js"]
