FROM node:22-alpine

WORKDIR /app
RUN mkdir -p /app/data && chown node:node /app/data

COPY index.html styles.css console.css console.js github.js server.mjs ./

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8765

USER node
EXPOSE 8765

CMD ["node", "server.mjs"]
