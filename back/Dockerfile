# Build context: raíz del monorepo (az acr build -f back/Dockerfile .)
# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias nativas para sharp (procesamiento de imágenes)
RUN apk add --no-cache vips-dev fftw-dev gcc g++ make python3

# Copiar manifests primero para aprovechar caché de capas
COPY back/package*.json ./
COPY back/prisma ./prisma/

# Evitar que Puppeteer descargue su propio Chromium (usaremos el del sistema)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Instalar dependencias de producción + devDependencias para generar Prisma client
RUN npm install --legacy-peer-deps

# Generar Prisma client
RUN npx prisma generate

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
# Apuntar Puppeteer al Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Runtime deps: sharp + Chromium para Puppeteer
RUN apk add --no-cache \
    vips \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto

# Copiar sólo lo necesario desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Código del backend + utilidades compartidas (LoteoController → shared/src/utils)
COPY back/ .
COPY shared /shared

# Exponer el puerto que usa Express (Railway/Azure usan PORT env var)
EXPOSE 3001

# Arranque directo (migraciones se aplican manualmente o desde local antes del deploy)
CMD ["node", "index.js"]
