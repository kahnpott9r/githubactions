FROM node:22-alpine

WORKDIR /app

# Cài dependencies trước để tận dụng cache của Docker layer
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "src/server.js"]
