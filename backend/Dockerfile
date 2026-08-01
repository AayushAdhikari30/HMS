# Backend: Node.js + Express API
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the source
COPY . .

EXPOSE 8000
CMD ["node", "src/index.js"]
