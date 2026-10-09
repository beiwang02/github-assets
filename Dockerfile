FROM node:22-alpine

WORKDIR /app
RUN mkdir -p /app/data && chown node:node /app/data

COPY index.html styles.css console.css ui-refresh.css responsive.css console.js popup.js github.js server.mjs ./
COPY vendor/ ./vendor/

COPY fonts/ ./fonts/
COPY icons/favicon.svg icons/favicon-16.png icons/favicon-32.png icons/favicon-48.png icons/favicon-64.png icons/favicon.ico icons/apple-touch-icon.png icons/icon-192.png icons/icon-512.png ./icons/

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8765

USER node
EXPOSE 8765

CMD ["node", "server.mjs"]
