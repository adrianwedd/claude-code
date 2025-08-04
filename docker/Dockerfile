# --- Builder Stage ---
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    jq \
    github-cli

# Set working directory
WORKDIR /workspace

# Copy project files
COPY . .

# Install Node.js dependencies if package.json exists
RUN if [ -f package.json ]; then npm install; fi

# Make start script executable
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Make healthcheck script executable
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# --- Runtime Stage ---
FROM node:18-alpine

# Set a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /workspace

# Copy artifacts from builder stage
COPY --from=builder /workspace /workspace
COPY --from=builder /start.sh /start.sh

# Health check
COPY --from=builder /healthcheck.sh /healthcheck.sh
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /healthcheck.sh

# Set environment variables
ENV CLAUDE_ITERATION=0
ENV CLAUDE_MAX_CALLS=5
ENV CLAUDE_RESET_HOURS=5

ENTRYPOINT ["/start.sh"]
