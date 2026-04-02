FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server file
COPY server.js .

EXPOSE 10000

CMD ["node", "server.js"]