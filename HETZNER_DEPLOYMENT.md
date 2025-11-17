# 🚀 Guía de Deployment en Hetzner

Esta guía te llevará paso a paso para desplegar tu aplicación HeyGen Avatar en un servidor de Hetzner.

## 📋 Requisitos Previos

- Cuenta en Hetzner Cloud
- API Key de HeyGen
- Git instalado localmente

## 💰 Costos Estimados

**Servidor Recomendado: CPX11 (Shared vCPU)**
- 2 vCPU
- 2 GB RAM
- 40 GB SSD
- 20 TB tráfico
- **Precio: ~4.5€/mes** (~5 USD/mes)

Este servidor es perfecto para empezar y puede manejar:
- Múltiples conexiones WebSocket simultáneas
- Streaming de avatares HeyGen
- Build de aplicaciones React
- Tráfico moderado-alto

## 🎯 Paso 1: Crear Servidor en Hetzner

1. **Accede a Hetzner Cloud Console**
   - Ve a https://console.hetzner.cloud
   - Si no tienes cuenta, créala (suelen tener crédito gratis para nuevos usuarios)

2. **Crear un nuevo proyecto**
   - Click en "New Project"
   - Nombre: `heygen-avatar` (o el que prefieras)

3. **Crear servidor**
   - Click en "Add Server"
   - **Location**: Elige la más cercana a ti (ej: Nuremberg, Helsinki, etc.)
   - **Image**: Ubuntu 22.04
   - **Type**: Shared vCPU > **CPX11** (2 vCPU, 2GB RAM)
   - **SSH Key**:
     - Si no tienes una, créala localmente: `ssh-keygen -t ed25519`
     - Copia tu clave pública: `cat ~/.ssh/id_ed25519.pub`
     - Pégala en Hetzner
   - **Name**: `heygen-server` (o el que prefieras)
   - Click en "Create & Buy Now"

4. **Anota la IP del servidor**
   - Aparecerá en el dashboard (ej: `157.90.123.45`)

## 🔧 Paso 2: Configurar el Servidor

### Conectarse al servidor

```bash
ssh root@TU_IP_DEL_SERVIDOR
```

### Actualizar sistema

```bash
apt update && apt upgrade -y
```

### Instalar Docker y Docker Compose

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

### Instalar Git

```bash
apt install git -y
```

### Configurar Firewall (UFW)

```bash
# Habilitar firewall
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS (para futuro)
ufw allow 3001/tcp  # Servidor Node.js
ufw --force enable

# Verificar estado
ufw status
```

## 📦 Paso 3: Clonar y Configurar el Proyecto

### Clonar repositorio

```bash
cd /opt
git clone https://github.com/Radar-Padcelona/avatar.git
cd avatar
```

### Configurar variables de entorno

```bash
# Editar archivo de producción
nano .env.production
```

Agrega tu API Key de HeyGen:

```env
HEYGEN_API_KEY=tu_api_key_real_aqui
PORT=3001
NODE_ENV=production
CLIENT_URL=*
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`.

## 🚀 Paso 4: Desplegar la Aplicación

### Ejecutar script de deployment

```bash
./deploy.sh
```

Este script automáticamente:
- ✅ Verifica configuración
- 🏗️ Construye las imágenes Docker
- 🚀 Levanta los servicios
- 🏥 Verifica que todo esté funcionando

### Verificar que todo funciona

```bash
# Ver logs en tiempo real
docker-compose logs -f

# O logs específicos
docker-compose logs -f server
docker-compose logs -f client

# Ver estado de contenedores
docker-compose ps
```

## 🌐 Paso 5: Acceder a la Aplicación

Una vez desplegado:

- **Cliente (Frontend)**: `http://TU_IP_DEL_SERVIDOR`
- **Servidor (API)**: `http://TU_IP_DEL_SERVIDOR:3001`
- **Health Check**: `http://TU_IP_DEL_SERVIDOR:3001/health`

Por ejemplo: `http://157.90.123.45`

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# Conectarte al servidor
ssh root@TU_IP_DEL_SERVIDOR

# Ir al directorio
cd /opt/avatar

# Obtener últimos cambios
git pull origin main

# Re-desplegar
./deploy.sh
```

## 📊 Comandos Útiles

```bash
# Ver logs en vivo
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Detener y eliminar todo (incluyendo volúmenes)
docker-compose down -v

# Ver uso de recursos
docker stats

# Ver espacio en disco
df -h

# Limpiar imágenes Docker antiguas
docker system prune -a
```

## 🔒 Paso 6 (Opcional): Configurar Dominio y HTTPS

### Con dominio propio

1. **Configurar DNS**
   - En tu proveedor de dominio (ej: GoDaddy, Namecheap, Cloudflare)
   - Crear registro A: `@` → `TU_IP_DEL_SERVIDOR`
   - Crear registro A: `www` → `TU_IP_DEL_SERVIDOR`

2. **Instalar Certbot (SSL gratis con Let's Encrypt)**

```bash
apt install certbot python3-certbot-nginx -y

# Obtener certificado
certbot --nginx -d tudominio.com -d www.tudominio.com
```

3. **Auto-renovación**
   - Certbot configura auto-renovación automáticamente
   - Verificar: `certbot renew --dry-run`

## 📈 Monitoreo y Optimización

### Ver uso de recursos

```bash
# CPU y RAM en tiempo real
htop

# Uso de Docker
docker stats

# Logs del sistema
journalctl -f
```

### Optimizar rendimiento

Si necesitas más rendimiento, puedes upgradear el servidor en Hetzner:
- **CPX21**: 3 vCPU, 4GB RAM (~8.5€/mes)
- **CPX31**: 4 vCPU, 8GB RAM (~15.5€/mes)

El upgrade es instantáneo (solo 1 minuto de downtime).

## 🆘 Troubleshooting

### Servidor no responde

```bash
# Verificar estado de contenedores
docker-compose ps

# Ver logs de errores
docker-compose logs server --tail=50
docker-compose logs client --tail=50

# Reiniciar servicios
docker-compose restart
```

### Error de API Key

```bash
# Verificar variables de entorno
docker-compose exec server env | grep HEYGEN

# Si no está, editar .env.production y redeployar
nano .env.production
./deploy.sh
```

### Puerto ocupado

```bash
# Ver qué está usando el puerto
netstat -tulpn | grep :80
netstat -tulpn | grep :3001

# Detener servicios conflictivos
docker-compose down
./deploy.sh
```

### Sin espacio en disco

```bash
# Limpiar imágenes Docker antiguas
docker system prune -a

# Ver espacio
df -h

# Limpiar logs del sistema
journalctl --vacuum-time=7d
```

## 💡 Consejos de Producción

1. **Backups automáticos**
   - Hetzner ofrece backups automáticos (+20% del costo del servidor)
   - O configura snapshots manuales

2. **Monitoreo**
   - Considera usar Uptime Robot (gratis) para monitorear disponibilidad
   - Configurar alertas si el servidor cae

3. **Actualizaciones**
   - Actualiza el sistema regularmente: `apt update && apt upgrade`
   - Mantén Docker actualizado

4. **Seguridad**
   - Cambia el puerto SSH por defecto
   - Configura fail2ban para prevenir ataques de fuerza bruta
   - Mantén el firewall activo

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica la documentación de HeyGen
3. Revisa el código en GitHub

## 🎉 ¡Listo!

Tu aplicación está ahora corriendo en Hetzner con:
- ✅ Alta performance
- ✅ Bajo costo (~5€/mes)
- ✅ Deployment automatizado
- ✅ Health checks
- ✅ Logs estructurados
- ✅ Fácil de actualizar

¡Disfruta de tu avatar HeyGen en producción! 🚀
