ARG NODE_VERSION=23.10.0

# ----------- Building stage
FROM node:${NODE_VERSION}-alpine as builder
WORKDIR /app
# Copy package and package-lock
COPY package*.json ./
# Install all libraries to build the project
RUN npm ci
# Copy rest of the files
COPY . .
# Build the project
RUN npm run build

# ----------- Runtime stage
FROM node:${NODE_VERSION}-alpine
WORKDIR /app
# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# Install only production libraries
RUN npm ci --omit=dev
# Expose the port that the application listens on.
EXPOSE 3000
ENV PORT=3000
WORKDIR /app/dist
# Run the application.
CMD ["node", "index.js"]
