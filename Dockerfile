# Multi-stage build for Chili Cookoff Voting App
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies (including dev dependencies for build)
RUN rm -rf node_modules package-lock.json && npm install

# Copy frontend source code
COPY frontend/ ./

# Build the frontend for production
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init and build dependencies for better-sqlite3
RUN apk add --no-cache dumb-init python3 make g++

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the Docker-ready server file
COPY server-docker.js ./server.js

# Copy schema file
COPY backend/schema.sql ./schema.sql

# Copy the built frontend from the builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production
ENV DOCKER=true

# Expose port 3005
EXPOSE 3005

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 && \
    chown -R appuser:nodejs /app

USER appuser

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "server.js"]