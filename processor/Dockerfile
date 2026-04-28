# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install all deps (needed for build)
RUN npm ci

COPY . .

RUN npm run build


# ---------- Stage 2: Production ----------
FROM node:20-alpine

WORKDIR /app

# Copy only production package files
COPY package*.json ./

# Install ONLY production deps
RUN npm ci --omit=dev

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

USER app

EXPOSE 8080

CMD ["node", "dist/main.js"]
