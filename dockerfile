FROM node:18-alpine AS builder
WORKDIR /app
# Este archivo está obsoleto. Usa `Dockerfile` (mayúscula) para construir la imagen.

# install dependencies
COPY package*.json ./
RUN npm ci --silent

# build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --silent

# copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
