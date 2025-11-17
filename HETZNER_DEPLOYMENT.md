📝 Guía para Actualizar la Aplicación

Opción 1: Cambios en el Código (desde tu Mac)

Si haces cambios en tu máquina local y quieres subirlos al servidor:

En tu Mac:
cd /Users/juanjocordero/Developer/heygen-demo

# Hacer tus cambios en el código...

# Commit y push
git add .
git commit -m "Descripción de tus cambios"
git push origin main

En el servidor (SSH):
cd /opt/avatar

# Obtener últimos cambios
git pull origin main

# Si cambiaste el CLIENTE:
cd client
npm install  # Si añadiste dependencias
cd ..
docker-compose build --no-cache client
docker-compose up -d

# Si cambiaste el SERVIDOR:
cd server
npm install  # Si añadiste dependencias
cd ..
docker-compose build --no-cache server
docker-compose up -d

# Si cambiaste AMBOS:
docker-compose down
docker-compose build --no-cache
docker-compose up -d

Opción 2: Cambios Directos en el Servidor

Si quieres hacer cambios pequeños directamente en el servidor:

# Conectarte al servidor
ssh emrio@91.98.120.88

cd /opt/avatar

# Editar archivos (ejemplo: cambiar configuración del servidor)
nano server/src/index.ts

# Reconstruir y reiniciar
docker-compose down
docker-compose build --no-cache server
docker-compose up -d

Cambios Comunes:

🎨 Cambiar el Avatar por Defecto:

nano server/src/index.ts

Busca estas líneas y cámbialas:
let currentAvatarState: AvatarState = {
avatarId: 'Dexter_Doctor_Standing2_public',  // ← Cambiar aquí
voiceId: '7d51b57751f54a2c8ea646713cc2dd96',  // ← Cambiar aquí
knowledgeBase: 'Tu nuevo prompt...',           // ← Cambiar aquí
backgroundUrl: 'https://tu-nueva-url.com',    // ← Cambiar aquí
quality: 'high',
aspectRatio: '16:9',
ready: false
};

Luego:
docker-compose restart server

🔑 Cambiar API Key de HeyGen:

nano /opt/avatar/.env

# Cambiar la línea:
HEYGEN_API_KEY=tu_nueva_api_key

# Reiniciar
docker-compose restart server

🎨 Cambiar Estilos del Cliente:

# Editar CSS
nano client/src/App.css

# Reconstruir cliente
docker-compose build --no-cache client
docker-compose up -d

🌐 Cambiar URL del Servidor:

Si cambias de dominio:

# 1. Editar docker-compose.yml
nano docker-compose.yml

# Cambiar en la sección client > build > args:
# REACT_APP_SERVER_URL=https://tu-nuevo-dominio.com

# 2. Reconstruir cliente
docker-compose build --no-cache client
docker-compose up -d

# 3. Actualizar Nginx
sudo nano /etc/nginx/sites-available/avatar.wearebrave.net
# Cambiar server_name

# 4. Obtener nuevo certificado SSL
sudo certbot --nginx -d tu-nuevo-dominio.com

Comandos Útiles Diarios:

# Ver logs en tiempo real
docker-compose logs -f

# Ver solo errores
docker-compose logs | grep -i error

# Reiniciar servicios (sin rebuild)
docker-compose restart

# Ver estado de servicios
docker-compose ps

# Ver uso de recursos
docker stats

# Limpiar espacio (elimina imágenes antiguas)
docker system prune -a

# Ver logs de Nginx
sudo tail -f /var/log/nginx/heygen-avatar-error.log

# Backup de la base de datos (si tuvieras)
# No aplica en este caso, pero útil para el futuro

Script Rápido de Actualización:

Puedes crear un script para facilitar actualizaciones:

# Crear script
nano /opt/avatar/update.sh

Pega esto:
#!/bin/bash
cd /opt/avatar
git pull origin main
cd client && npm install && cd ..
cd server && npm install && cd ..
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "✅ Actualización completada!"

Hazlo ejecutable:
chmod +x /opt/avatar/update.sh

Ahora solo ejecuta:
/opt/avatar/update.sh

Monitoreo y Mantenimiento:

# Ver si los servicios están corriendo
docker-compose ps

# Verificar salud del servidor
curl https://avatar.wearebrave.net/health

# Ver certificado SSL (fecha de expiración)
sudo certbot certificates

# Renovar SSL manualmente (aunque se renueva automáticamente)
sudo certbot renew