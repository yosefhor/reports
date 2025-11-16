FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
CMD ["npx", "ts-node-dev", "--respawn", "src/index.ts"]

# COPY . .
# RUN npm run build
# CMD ["node", "dist/index.js"]
