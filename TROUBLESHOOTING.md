# 🔧 Solución de Problemas - Render Deploy

## ❌ Error: "Cannot GET /control" en el servidor

**Problema**: Intentas acceder a `https://heygen-avatar-server.onrender.com/control`

**Solución**: El servidor NO tiene páginas web, solo endpoints de API.

Las rutas correctas son:
- ✅ Cliente: `https://heygen-avatar-client.onrender.com/` (vista avatar)
- ✅ Cliente: `https://heygen-avatar-client.onrender.com/control` (panel control)
- ✅ Servidor API: `https://heygen-avatar-server.onrender.com/health` (health check)
- ✅ Servidor API: `https://heygen-avatar-server.onrender.com/api/get-token` (obtener token)

## ❌ Cliente carga pero no conecta al servidor

**Síntomas**:
- El cliente carga pero muestra errores
- No puede obtener el token
- Socket.IO no conecta

**Verificar**:

1. **Variable de entorno del cliente**:
   - Ve a Render Dashboard → Tu Static Site → Environment
   - Verifica que `REACT_APP_SERVER_URL` apunte al servidor correcto
   - Debe ser: `https://heygen-avatar-server.onrender.com` (SIN `/` al final)
   - SIN `/api` ni rutas adicionales

2. **Variable de entorno del servidor**:
   - Ve a Render Dashboard → Tu Web Service → Environment
   - Verifica que `CLIENT_URL` apunte al cliente correcto
   - Debe ser: `https://heygen-avatar-client.onrender.com` (SIN `/` al final)

3. **Servidor ejecutándose**:
   - Ve a Render Dashboard → Tu Web Service
   - Estado debe ser: 🟢 "Live"
   - Si está dormido: Espera 30-60 segundos a que despierte
   - Prueba: `https://tu-servidor.onrender.com/health`
   - Debe responder: `{"status":"ok","timestamp":"..."}`

## ❌ Error de CORS

**Síntomas**:
```
Access to XMLHttpRequest at 'https://servidor...' from origin 'https://cliente...' 
has been blocked by CORS policy
```

**Solución**:
1. Ve al servidor en Render → Environment
2. Actualiza `CLIENT_URL` con la URL EXACTA del cliente
3. Incluye `https://` y NO incluyas `/` al final
4. Guarda (se redesplegará automáticamente)

## ❌ Error: "Failed to fetch token"

**Síntomas**:
- "Error al obtener token de HeyGen"
- 401 Unauthorized
- 500 Internal Server Error

**Verificar**:

1. **API Key en el servidor**:
   - Ve a Render Dashboard → Servidor → Environment
   - Verifica que `HEYGEN_API_KEY` esté configurada
   - Debe empezar con `sk_V2_...`
   - NO debe tener espacios al inicio/final
   - Prueba la key en [HeyGen API docs](https://docs.heygen.com)

2. **Logs del servidor**:
   - Ve a Render Dashboard → Servidor → Logs
   - Busca errores relacionados con la API de HeyGen
   - Si ves "401": API key incorrecta
   - Si ves "403": API key válida pero sin permisos

## ❌ WebSocket no conecta

**Síntomas**:
- "Desconectado del servidor"
- Panel de control no comunica con la vista del avatar

**Verificar**:

1. **URL del servidor**:
   - Debe usar `https://` (NO `http://`)
   - Render automáticamente usa HTTPS

2. **Servidor activo**:
   - El servidor debe estar ejecutándose
   - Prueba: `https://tu-servidor.onrender.com/health`

3. **Firewall/Network**:
   - Algunos firewalls corporativos bloquean WebSockets
   - Prueba desde otra red (ej: móvil)

## ❌ Avatar no carga (botón "Iniciar Avatar" no responde)

**Verificar**:

1. **Consola del navegador** (F12 → Console):
   - ¿Hay errores?
   - Copia el error completo

2. **Network tab** (F12 → Network):
   - ¿La petición a `/api/get-token` tiene éxito?
   - ¿Qué código de estado devuelve? (200, 401, 500, etc.)

3. **Permisos de audio/video**:
   - El navegador puede bloquear audio
   - Haz clic en el candado 🔒 junto a la URL
   - Verifica permisos de micrófono

## ❌ Servidor se duerme constantemente

**Solución** (Capa gratuita de Render):
1. Usa [UptimeRobot](https://uptimerobot.com) (gratis)
2. Crea un monitor HTTP(s)
3. URL: `https://tu-servidor.onrender.com/health`
4. Intervalo: 10 minutos
5. Esto mantiene el servidor despierto

**Nota**: Consume tus 750 horas gratuitas más rápido.

## ❌ Build falla con errores de TypeScript

**Si ves errores como**: `Could not find a declaration file for module 'express'`

**Solución**:
1. TypeScript y `@types/*` deben estar en `dependencies`, NO en `devDependencies`
2. Ver `server/package.json`
3. Esto ya está arreglado en la versión actual

## 🔍 Comandos útiles para debugging

### Ver logs del servidor en tiempo real:
En Render Dashboard → Tu Web Service → Logs

### Probar el servidor manualmente:
```bash
# Health check
curl https://tu-servidor.onrender.com/health

# Obtener token (debería devolver un token)
curl -X POST https://tu-servidor.onrender.com/api/get-token

# Ver estado del avatar
curl https://tu-servidor.onrender.com/api/avatar-state
```

### Ver logs del cliente (en el navegador):
1. Presiona F12
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Busca "❌" para errores de la app

## 📞 Contacto

Si ninguna de estas soluciones funciona:
1. Revisa los logs completos de Render
2. Copia el error exacto
3. Busca el error en Google
4. Revisa [Render Community](https://community.render.com/)
