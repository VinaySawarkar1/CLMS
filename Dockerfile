# Root Dockerfile — builds the CLMS frontend AND backend into one image.
# The backend (NestJS) serves the built frontend, so a single service hosts
# both the UI and the API. Render finds this at the repo root by default.

# 1. Build the React frontend (same-origin: api.ts defaults to /api)
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 2. Build the NestJS backend
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY backend/package*.json ./
RUN npm install
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ .
RUN npm run build

# 3. Runtime image
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
# Bundle the built frontend so NestJS can serve it from /app/public
COPY --from=frontend /fe/dist ./public
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
