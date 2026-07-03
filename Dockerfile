# Multi-stage Dockerfile pour StockManager
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend
FROM node:20-alpine

WORKDIR /app

# Installer les dépendances backend
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copier le code backend
COPY backend/ ./

# Copier le frontend build depuis le stage précédent
COPY --from=frontend-build /app/frontend/dist ./public

# Copier les fichiers statiques du frontend (logo.png, etc.)
COPY --from=frontend-build /app/frontend/public ./public

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
