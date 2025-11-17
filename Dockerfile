# Use Node.js 22 version (required by dependencies)
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start the server (serves both API and static files)
CMD ["npm", "run", "server:prod"]