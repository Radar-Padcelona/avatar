# Multi-stage build para optimizar tamaño
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias (incluidas devDependencies para el build)
RUN npm ci

# Copiar código fuente
COPY src ./src

# Build de TypeScript
RUN npm run build

# ============================================
# Imagen de producción (mucho más pequeña)
# ============================================
FROM node:18-alpine

WORKDIR /app

# Copiar solo package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar el build compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "dist/index.js"]
