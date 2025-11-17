# 🚀 Deployment en Servidor Existente (con PrestaShop)

Esta guía es para desplegar HeyGen Avatar en un servidor Ubuntu que **ya tiene PrestaShop instalado**.

## 📋 Lo que haremos

- Instalar Docker en tu servidor existente
- Desplegar HeyGen Avatar usando **puertos diferentes** (8080 y 3001)
- Configurar Nginx como reverse proxy para servir ambas aplicaciones
- PrestaShop seguirá funcionando normalmente

## 🎯 Opciones de Configuración

Tienes **dos opciones** para acceder a tu avatar:

### Opción 1: Subdominio (Recomendado)
- PrestaShop: `tudominio.com`
- Avatar: `avatar.tudominio.com`
- **Más limpio y profesional**

### Opción 2: Ruta (Path)
- PrestaShop: `tudominio.com`
- Avatar: `tudominio.com/avatar`
- **Más simple, no necesitas configurar DNS**

## 🔧 Paso 1: Conectarse al Servidor

```bash
ssh tu_usuario@tu_servidor_ip
```

## 📦 Paso 2: Instalar Docker (si no está instalado)

### Verificar si Docker ya está instalado

```bash
docker --version
```

Si no está instalado:

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Añadir tu usuario al grupo docker (opcional, para no usar sudo)
sudo usermod -aG docker $USER

# Aplicar cambios (o cierra sesión y vuelve a entrar)
newgrp docker

# Verificar
docker --version
docker-compose --version
```

## 📂 Paso 3: Clonar el Proyecto

```bash
# Ir a un directorio apropiado (por ejemplo /opt)
cd /opt

# Clonar repositorio
sudo git clone https://github.com/Radar-Padcelona/avatar.git

# Cambiar permisos si es necesario
sudo chown -R $USER:$USER avatar
cd avatar
```

## 🔑 Paso 4: Configurar Variables de Entorno

```bash
# Editar archivo de producción
nano .env.production
```

Configurar con tu API Key real:

```env
HEYGEN_API_KEY=tu_api_key_de_heygen_aqui
PORT=3001
NODE_ENV=production
CLIENT_URL=*
```

Guardar: `Ctrl+X` → `Y` → `Enter`

## 🚀 Paso 5: Desplegar con Docker

```bash
# Ejecutar script de deployment
./deploy.sh
```

Esto levantará:
- **Cliente**: en puerto `8080`
- **Servidor**: en puerto `3001`

### Verificar que funciona

```bash
# Ver contenedores corriendo
docker-compose ps

# Ver logs
docker-compose logs -f

# Probar acceso directo (desde el servidor)
curl http://localhost:8080
curl http://localhost:3001/health
```

## 🌐 Paso 6: Configurar Nginx Reverse Proxy

Ahora vamos a configurar Nginx (que ya tienes para PrestaShop) para que también sirva el avatar.

### Opción A: Configurar con SUBDOMINIO

#### 1. Configurar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.):
- Crear registro A: `avatar` → `IP_DE_TU_SERVIDOR`
- Espera 5-10 minutos a que se propague

#### 2. Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/heygen-avatar
```

Pegar esta configuración:

```nginx
server {
    listen 80;
    server_name avatar.tudominio.com;  # CAMBIA por tu dominio real

    access_log /var/log/nginx/heygen-avatar-access.log;
    error_log /var/log/nginx/heygen-avatar-error.log;

    # Cliente React
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API del servidor
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

#### 3. Activar la configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/heygen-avatar /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Si todo está bien, recargar Nginx
sudo systemctl reload nginx
```

#### 4. Configurar HTTPS (opcional pero recomendado)

```bash
sudo certbot --nginx -d avatar.tudominio.com
```

### Opción B: Configurar con RUTA (Path)

Si prefieres usar `tudominio.com/avatar` en lugar de un subdominio:

```bash
# Editar tu configuración actual de Nginx (la de PrestaShop)
sudo nano /etc/nginx/sites-available/default
# o el archivo que uses para PrestaShop
```

Añade estas líneas **ANTES** de las configuraciones de PrestaShop:

```nginx
server {
    listen 80;
    server_name tudominio.com;  # Tu dominio actual

    # Avatar HeyGen (en /avatar)
    location /avatar {
        rewrite ^/avatar(/.*)$ $1 break;
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    # ... resto de tu configuración de PrestaShop ...
}
```

Recargar Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 🔥 Paso 7: Configurar Firewall

```bash
# Ver estado actual
sudo ufw status

# Permitir puertos necesarios (si no están ya permitidos)
sudo ufw allow 8080/tcp
sudo ufw allow 3001/tcp

# Verificar
sudo ufw status
```

## ✅ Paso 8: Verificar que Todo Funciona

Según la opción que elegiste:

- **Opción A (subdominio)**: Abre `http://avatar.tudominio.com`
- **Opción B (path)**: Abre `http://tudominio.com/avatar`

Deberías ver tu aplicación HeyGen Avatar funcionando.

## 📊 Recursos del Servidor

### Ver uso actual

```bash
# CPU y RAM
htop

# Uso de Docker
docker stats

# Espacio en disco
df -h
```

### Si necesitas más recursos

PrestaShop + HeyGen Avatar pueden funcionar bien en:
- **Mínimo**: 2GB RAM, 2 vCPU
- **Recomendado**: 4GB RAM, 2-4 vCPU

Si tu servidor va lento, considera upgradear.

## 🔄 Actualizar la Aplicación

Cuando hagas cambios:

```bash
cd /opt/avatar
git pull origin main
./deploy.sh
```

## 📝 Comandos Útiles

```bash
# Ver logs de HeyGen Avatar
docker-compose logs -f

# Reiniciar solo HeyGen Avatar
docker-compose restart

# Detener HeyGen Avatar (PrestaShop sigue funcionando)
docker-compose down

# Ver todos los servicios corriendo
sudo systemctl status nginx
docker-compose ps

# Ver logs de Nginx
sudo tail -f /var/log/nginx/heygen-avatar-error.log
sudo tail -f /var/log/nginx/heygen-avatar-access.log
```

## 🆘 Troubleshooting

### Puerto ya en uso

Si el puerto 8080 o 3001 ya está siendo usado:

```bash
# Ver qué está usando los puertos
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :3001

# Cambiar los puertos en docker-compose.yml si es necesario
nano docker-compose.yml
# Cambia "8080:80" por otro puerto, ej: "8081:80"
```

### Nginx no carga la configuración

```bash
# Ver errores de Nginx
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### Avatar no se conecta al servidor

Verifica que las URLs en el cliente apunten correctamente:

```bash
# Si usas subdominio
# El cliente debe usar: http://avatar.tudominio.com/api

# Si usas path
# El cliente debe usar: http://tudominio.com/api
```

### PrestaShop dejó de funcionar

```bash
# Verificar estado de Nginx
sudo systemctl status nginx

# Recargar configuración de Nginx
sudo nginx -t
sudo systemctl reload nginx

# Si sigue sin funcionar, revierte cambios en Nginx
# y vuelve a intentar
```

## 💡 Optimización

### Limitar recursos de Docker

Si quieres limitar cuánta memoria usa HeyGen Avatar:

```bash
nano docker-compose.yml
```

Añade en cada servicio:

```yaml
services:
  server:
    # ... configuración existente ...
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## 🎉 ¡Listo!

Ahora tienes:
- ✅ PrestaShop funcionando normalmente
- ✅ HeyGen Avatar funcionando en el mismo servidor
- ✅ Ambos compartiendo recursos eficientemente
- ✅ Configuración profesional con reverse proxy

## 📞 Notas Importantes

1. **Backups**: Asegúrate de hacer backup antes de cualquier cambio importante
2. **Monitoreo**: Vigila el uso de recursos con `htop` y `docker stats`
3. **Actualizaciones**: Mantén Ubuntu, Docker y Nginx actualizados
4. **Seguridad**: Considera usar HTTPS (Let's Encrypt es gratis)

¡Disfruta de tu avatar HeyGen en producción! 🚀
