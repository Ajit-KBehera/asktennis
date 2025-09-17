# Multi-stage build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies
RUN npm install
RUN cd client && npm install

# Build the React app
RUN cd client && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built React app from builder stage
COPY --from=builder /app/client/build ./client/build

# Copy server files
COPY server.js ./
COPY src/ ./src/

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
