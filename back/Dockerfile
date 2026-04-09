# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias nativas para sharp (procesamiento de imágenes)
RUN apk add --no-cache vips-dev fftw-dev gcc g++ make python3

# Copiar manifests primero para aprovechar caché de capas
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de producción + devDependencias para generar Prisma client
RUN npm install --legacy-peer-deps

# Generar Prisma client
RUN npx prisma generate

# ---- Production stage ----
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Runtime deps para sharp
RUN apk add --no-cache vips

# Copiar sólo lo necesario desde el builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copiar código fuente
COPY . .

# Exponer el puerto que usa Express (Railway/Azure usan PORT env var)
EXPOSE 3001

# Ejecutar migraciones Prisma y luego iniciar el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]
