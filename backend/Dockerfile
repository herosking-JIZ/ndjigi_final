# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Installer les dépendances de build
RUN apk add --no-cache python3 make g++

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le reste du code
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Stage 2: Runtime
FROM node:22-alpine
WORKDIR /app

# Installer dumb-init pour gérer les signaux Unix
RUN apk add --no-cache dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Attribuer les fichiers pendant la copie évite un chown récursif très lent.
COPY --chown=nodejs:nodejs --from=builder /app/ ./

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

EXPOSE 8000

# Utiliser dumb-init pour gérer les signaux correctement
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
