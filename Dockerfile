FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

EXPOSE 8402

CMD ["node", "dist/index.js"]
