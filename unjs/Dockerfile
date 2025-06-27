FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Expose port
EXPOSE 3000

# Set the entrypoint to our CLI
ENTRYPOINT ["node", "dist/cli.js"]

# Default source directory (can be overridden)
CMD ["/server"]