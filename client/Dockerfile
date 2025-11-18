# Multi-stage build para React
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (usamos npm install en lugar de ci para evitar problemas de sincronización)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de producción (sin source maps para reducir tamaño)
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# ============================================
# Imagen de producción con Nginx
# ============================================
FROM nginx:alpine

# Copiar build de React
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
