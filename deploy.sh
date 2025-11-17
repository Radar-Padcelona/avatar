#!/bin/bash

# ==============================================
# Script de Deployment para Hetzner
# ==============================================

set -e  # Salir si hay error

echo "🚀 Iniciando deployment en Hetzner..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que existe .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: No se encontró .env.production${NC}"
    echo "Crea el archivo .env.production con tu HEYGEN_API_KEY"
    exit 1
fi

# Cargar variables de entorno
export $(cat .env.production | grep -v '^#' | xargs)

# Verificar que HEYGEN_API_KEY está configurado
if [ -z "$HEYGEN_API_KEY" ]; then
    echo -e "${RED}❌ Error: HEYGEN_API_KEY no está configurado en .env.production${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Deteniendo contenedores anteriores...${NC}"
docker-compose down || true

echo -e "${BLUE}🏗️  Construyendo imágenes Docker...${NC}"
docker-compose build --no-cache

echo -e "${BLUE}🚀 Levantando servicios...${NC}"
docker-compose up -d

echo -e "${BLUE}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar estado de los servicios
echo -e "${BLUE}🔍 Verificando estado de los servicios...${NC}"
docker-compose ps

# Health check del servidor
echo -e "${BLUE}🏥 Verificando health del servidor...${NC}"
for i in {1..10}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor está saludable${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ El servidor no responde después de 10 intentos${NC}"
        docker-compose logs server
        exit 1
    fi
    echo "Intento $i/10 - Esperando..."
    sleep 3
done

# Health check del cliente
echo -e "${BLUE}🏥 Verificando health del cliente...${NC}"
if curl -f http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cliente está saludable${NC}"
else
    echo -e "${RED}❌ El cliente no responde${NC}"
    docker-compose logs client
    exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deployment completado exitosamente!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 URLs disponibles:${NC}"
echo -e "   🌐 Cliente: http://localhost"
echo -e "   🔧 Servidor: http://localhost:3001"
echo -e "   💚 Health: http://localhost:3001/health"
echo ""
echo -e "${BLUE}📝 Comandos útiles:${NC}"
echo -e "   Ver logs:      docker-compose logs -f"
echo -e "   Ver servidor:  docker-compose logs -f server"
echo -e "   Ver cliente:   docker-compose logs -f client"
echo -e "   Reiniciar:     docker-compose restart"
echo -e "   Detener:       docker-compose down"
echo ""
