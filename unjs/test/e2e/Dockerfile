FROM node:22-alpine as package-builder
WORKDIR /build

# Copy package files and source
COPY package*.json ./
COPY src/ ./src/
COPY tsconfig.json ./

RUN npm ci && npm run build &&npm pack

FROM node:22-alpine as runner
WORKDIR /test-workspace

# Copy and install the package from builder stage
COPY --from=package-builder /build/essence-framework-*.tgz /tmp
RUN npm install /tmp/essence-framework-*.tgz

# Expose port
EXPOSE 3000

# Use npx to run the framework
ENTRYPOINT ["npx", "essence-framework"]

# Default source directory (can be overridden)
CMD ["/server"]