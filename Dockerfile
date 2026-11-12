FROM node:20-alpine

WORKDIR /app

# Install dependencies cleanly from lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy TypeScript sources, standalone snapshot bundle, and build
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build && npm prune --omit=dev

ENTRYPOINT ["node", "dist/index.js"]
