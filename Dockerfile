# Multi-stage build for AskTennis backend + React client

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci


FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app /app
COPY --from=deps /app/client /app/client
COPY . .
# Build React client
RUN cd client && npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy root dependencies only (production)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server source
COPY server.js ./
COPY src ./src
COPY seed.js ./
COPY Procfile ./

# Copy built client assets
COPY --from=build /app/client/build ./client/build

# Expose application port
ENV PORT=3000
EXPOSE 3000

# Healthcheck (simple TCP check)
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT,path:'/'}, r=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
