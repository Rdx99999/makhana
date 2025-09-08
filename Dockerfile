# Stage 1: Build the application
FROM node:20 AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy only what’s needed
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy .env if needed
# COPY --from=builder /app/.env ./

EXPOSE 5000

# Start the application (adjust if you need esm resolution)
CMD ["node", "dist/index.js"]
