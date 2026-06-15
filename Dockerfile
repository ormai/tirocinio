FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL=postgres://postgres:postgres@db:5432/app
RUN npm run db:generate
RUN npm run build
RUN npm prune --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules/clingo-wasm /app/node_modules/clingo-wasm
COPY --from=builder --chown=node:node /app/build build/
COPY --from=builder --chown=node:node /app/drizzle drizzle/
COPY --chown=node:node package.json .
EXPOSE 3000
ENV NODE_ENV=production
USER node
CMD ["node", "build"]
