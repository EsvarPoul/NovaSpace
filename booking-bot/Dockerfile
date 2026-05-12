FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY index.js ./

EXPOSE 8787

CMD ["node", "index.js"]
