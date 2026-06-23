# Root Dockerfile for the CLMS backend.
# Placed at repo root so Render's default Docker discovery finds it.
# Build context is the repo root; all paths reference the backend/ subdir.
FROM node:20-alpine AS build
WORKDIR /app
# Prisma on Alpine needs openssl for its engines.
RUN apk add --no-cache openssl libc6-compat
COPY backend/package*.json ./
RUN npm install
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat
# All deps: prisma CLI + ts-node are needed at boot for migrate/seed.
COPY backend/package*.json ./
RUN npm install
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./
COPY backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
