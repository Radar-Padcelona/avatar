# 🚀 Guía de Deploy en Render

Esta guía te ayudará a desplegar tu aplicación de HeyGen Avatar en Render.

## 📋 Prerequisitos

1. Cuenta en [Render](https://render.com) (gratis)
2. Repositorio en GitHub con tu código
3. API Key de HeyGen

## 🔧 Preparación

### 1. Crear Repositorio en GitHub

Si aún no tienes el código en GitHub:

```bash
cd /path/to/heygen-demo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/heygen-demo.git
git push -u origin main
```

**IMPORTANTE**: Asegúrate de que `.env` está en `.gitignore` para no subir tu API key.

### 2. Verificar Archivos

Asegúrate de que existen estos archivos:
- `server/.env.example` ✅
- `client/.env.example` ✅
- `server/.gitignore` ✅
- `client/.gitignore` ✅

## 🌐 Deploy del Servidor (Backend)

### Paso 1: Crear Web Service

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `heygen-demo`

### Paso 2: Configuración del Servicio

Usa esta configuración:

- **Name**: `heygen-avatar-server` (o el nombre que prefieras)
- **Region**: Elige la más cercana a tus usuarios
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Paso 3: Variables de Entorno

En la sección **"Environment Variables"**, añade:

| Key | Value |
|-----|-------|
| `HEYGEN_API_KEY` | Tu API Key de HeyGen |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `*` (lo actualizaremos después) |
| `PORT` | `3001` (Render lo sobreescribe automáticamente) |

### Paso 4: Deploy

1. Click en **"Create Web Service"**
2. Espera a que termine el deploy (5-10 minutos)
3. **Guarda la URL** del servidor (ej: `https://heygen-avatar-server.onrender.com`)

## 🎨 Deploy del Cliente (Frontend)

### Paso 1: Crear Static Site

1. En Render, click en **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio
3. Selecciona el repositorio `heygen-demo`

### Paso 2: Configuración del Sitio

Usa esta configuración:

- **Name**: `heygen-avatar-client` (o el nombre que prefieras)
- **Region**: Misma que el servidor
- **Branch**: `main`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

### Paso 3: Variables de Entorno

En **"Environment Variables"**, añade:

| Key | Value |
|-----|-------|
| `REACT_APP_SERVER_URL` | URL del servidor (ej: `https://heygen-avatar-server.onrender.com`) |

### Paso 4: Deploy

1. Click en **"Create Static Site"**
2. Espera a que termine el deploy (5-10 minutos)
3. **Guarda la URL** del cliente (ej: `https://heygen-avatar-client.onrender.com`)

## 🔄 Configuración Final

### Actualizar CORS en el Servidor

1. Ve al dashboard del **servidor** en Render
2. Ve a **"Environment"**
3. Actualiza `CLIENT_URL` con la URL del cliente:
   - Valor: `https://heygen-avatar-client.onrender.com`
4. Guarda los cambios (el servidor se redesplegará automáticamente)

## ✅ Verificación

Una vez completado el deploy:

1. Abre la URL del cliente: `https://heygen-avatar-client.onrender.com`
2. Deberías ver el botón **"🎬 Iniciar Avatar"**
3. Haz clic y verifica que el avatar carga
4. Abre el panel de control: `https://heygen-avatar-client.onrender.com/control`
5. Prueba cambiar entre avatares
6. Prueba el chat de voz con Dexter
7. Prueba el texto a voz con Ann

## 🔍 Solución de Problemas

### Servidor no inicia

1. Revisa los logs en Render → Dashboard → Tu servicio → Logs
2. Verifica que `HEYGEN_API_KEY` esté configurada
3. Asegúrate de que el build se completó sin errores

### Error de CORS

1. Verifica que `CLIENT_URL` en el servidor apunte a la URL correcta del cliente
2. Asegúrate de incluir `https://` en la URL
3. No uses `http://` si Render usa `https://`

### Avatar no carga

1. Abre la consola del navegador (F12)
2. Busca errores relacionados con la API Key
3. Verifica que `REACT_APP_SERVER_URL` apunte al servidor correcto

### WebSocket no conecta

1. Verifica que ambas URLs usen `https://`
2. Revisa los logs del servidor para ver errores de conexión
3. Asegúrate de que el servidor esté ejecutándose

## ⚠️ Limitaciones de la Capa Gratuita de Render

- **Sleep después de 15 minutos de inactividad**: El servidor se "duerme"
- **Primera carga lenta**: Tarda 30-60 segundos en despertar
- **750 horas/mes**: Suficiente para demos
- **100 GB de ancho de banda/mes**

### Mantener el Servidor Activo

Si quieres evitar que el servidor se duerma, puedes:

1. Usar un servicio de ping como [UptimeRobot](https://uptimerobot.com/)
2. Configurar un ping cada 10 minutos a `https://tu-servidor.onrender.com/health`
3. **Nota**: Esto consume tus 750 horas más rápido

## 🔄 Actualizaciones

Para actualizar tu aplicación:

1. Haz cambios en tu código local
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de los cambios"
   git push
   ```
3. Render detectará los cambios y redesplegará automáticamente

## 🔒 Seguridad

- ✅ Nunca subas archivos `.env` a GitHub
- ✅ Usa variables de entorno en Render para secrets
- ✅ Mantén tu API Key de HeyGen privada
- ✅ Actualiza `CLIENT_URL` para limitar CORS en producción

## 📊 Monitoreo

Render proporciona:
- **Logs en tiempo real**: Dashboard → Tu servicio → Logs
- **Métricas**: CPU, memoria, ancho de banda
- **Alertas**: Configurables por email

## 💰 Upgrade (Opcional)

Si necesitas más recursos:

- **Starter Plan** ($7/mes): Sin sleep, más CPU/RAM
- **Standard Plan** ($25/mes): Mayor rendimiento
- [Ver precios completos](https://render.com/pricing)

---

¿Preguntas? Revisa la [documentación de Render](https://render.com/docs) o abre un issue en GitHub.
