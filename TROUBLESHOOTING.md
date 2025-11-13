# 🔧 Guía de Troubleshooting

Soluciones a los problemas más comunes al desarrollar y desplegar la aplicación de avatares HeyGen.

## 📑 Índice

1. [Problemas de Desarrollo Local](#problemas-de-desarrollo-local)
2. [Problemas de Deployment](#problemas-de-deployment)
3. [Problemas con HeyGen](#problemas-con-heygen)
4. [Problemas de Conexión](#problemas-de-conexión)
5. [Problemas de Render](#problemas-de-render)

---

## 🏠 Problemas de Desarrollo Local

### ❌ Error: "Puerto 3001 ya está en uso"

**Síntomas:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Soluciones:**

**Linux/Mac:**
```bash
# Ver qué proceso usa el puerto
lsof -ti:3001

# Matar el proceso
lsof -ti:3001 | xargs kill -9

# O cambiar el puerto en server/.env
PORT=3002
```

**Windows:**
```cmd
# Ver qué proceso usa el puerto
netstat -ano | findstr :3001

# Matar el proceso (reemplaza <PID> con el ID del proceso)
taskkill /PID <PID> /F
```

### ❌ Error: "Cannot find module '@heygen/streaming-avatar'"

**Síntomas:**
```
Module not found: Can't resolve '@heygen/streaming-avatar'
```

**Solución:**
```bash
# Instala las dependencias
cd client
npm install

# Si persiste, limpia el cache
rm -rf node_modules package-lock.json
npm install
```

### ❌ Error: "HEYGEN_API_KEY is not defined"

**Síntomas:**
```
Error: HEYGEN_API_KEY is not defined
```

**Solución:**

1. Verifica que exista el archivo `server/.env`:
```bash
cd server
ls -la .env
```

2. Si no existe, créalo:
```bash
cp .env.example .env
```

3. Edita `.env` y agrega tu API key:
```env
HEYGEN_API_KEY=tu_api_key_aqui
```

4. Reinicia el servidor:
```bash
npm run dev
```

### ❌ Error: "TypeScript compilation error"

**Síntomas:**
```
Type error: Cannot find name 'X'
```

**Solución:**

1. Verifica que todos los tipos estén instalados:
```bash
npm install --save-dev @types/node @types/express @types/cors
```

2. Limpia y reconstruye:
```bash
npm run build
```

---

## 🚀 Problemas de Deployment

### ❌ Error: "Build failed" en Render

**Síntomas:**
En los logs de Render ves:
```
==> Build failed
```

**Soluciones:**

1. **Verifica el Build Command:**
   - Servidor: `npm install && npm run build`
   - Cliente: `npm install && npm run build`

2. **Verifica el package.json:**
```json
{
  "scripts": {
    "build": "tsc"  // Para servidor
    "build": "react-scripts build"  // Para cliente
  }
}
```

3. **Revisa los logs completos** en Render para el error específico

### ❌ Error: "Cannot find start script"

**Síntomas:**
```
Error: Missing script: "start"
```

**Solución:**

Verifica que `package.json` tenga el script start:

**Servidor:**
```json
{
  "scripts": {
    "start": "node dist/index.js"
  }
}
```

**Cliente:**
No necesita script start (es Static Site)

### ❌ Variables de entorno no funcionan

**Síntomas:**
- La app no puede conectarse al servidor
- Errores de CORS
- API key no encontrada

**Solución:**

1. **En Render**, ve a tu servicio → Environment
2. Verifica que las variables estén correctamente escritas:
   - `HEYGEN_API_KEY` (servidor)
   - `REACT_APP_SERVER_URL` (cliente)
3. Haz clic en "Save Changes"
4. Espera el redespliegue

**⚠️ Importante:** Las variables en React deben empezar con `REACT_APP_`

---

## 🎭 Problemas con HeyGen

### ❌ Error: "Invalid API key"

**Síntomas:**
```
Error 401: Unauthorized
Invalid API key
```

**Solución:**

1. Ve a [HeyGen](https://app.heygen.com/)
2. Ve a Settings → API Keys
3. Verifica que tu API key sea válida
4. Si expiro, genera una nueva
5. Actualiza la variable de entorno:
   - Local: `server/.env`
   - Render: Environment Variables

### ❌ Error: "Avatar not found"

**Síntomas:**
```
Error: Avatar 'X' not found
```

**Solución:**

1. Verifica que el ID del avatar sea correcto
2. Lista de avatares válidos en [HeyGen Docs](https://docs.heygen.com/)
3. Actualiza el ID en `client/src/pages/ControlPanel.tsx`:
```typescript
const avatarConfigs: AvatarConfig[] = [
  {
    name: 'Mi Avatar',
    avatarId: 'ID_CORRECTO_AQUI',  // ← Verifica esto
    voiceId: 'ID_VOZ_CORRECTO',
    description: 'Descripción'
  }
];
```

### ❌ Error: "Rate limit exceeded"

**Síntomas:**
```
Error 429: Too Many Requests
```

**Solución:**

1. Has excedido el límite de peticiones de tu plan
2. Espera unos minutos antes de reintentar
3. Considera actualizar tu plan de HeyGen
4. Implementa rate limiting en tu servidor

---

## 🔌 Problemas de Conexión

### ❌ "Socket connection failed"

**Síntomas:**
- Panel de control muestra "🔴 Desconectado"
- Avatar no cambia
- En consola: `WebSocket connection failed`

**Soluciones:**

**Desarrollo Local:**

1. Verifica que el servidor esté corriendo:
```bash
curl http://localhost:3001/health
```

2. Verifica REACT_APP_SERVER_URL en `client/.env`:
```env
REACT_APP_SERVER_URL=http://localhost:3001
```

**Producción:**

1. Verifica que la URL del servidor sea correcta
2. Debe incluir `https://` y NO terminar en `/`
3. Ejemplo correcto:
```env
REACT_APP_SERVER_URL=https://tu-servidor.onrender.com
```

### ❌ CORS Error

**Síntomas:**
```
Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy
```

**Solución:**

1. Ve al servidor en Render → Environment
2. Actualiza `CLIENT_URL` con la URL exacta del cliente:
```
CLIENT_URL=https://tu-cliente.onrender.com
```

3. **NO** incluyas `/` al final
4. **NO** uses `*` en producción
5. Guarda y espera redespliegue

### ❌ "WebSocket transport error"

**Síntomas:**
```
WebSocket transport error
```

**Solución:**

1. Verifica que Socket.IO esté instalado:
```bash
npm list socket.io
```

2. Versiones compatibles:
   - Servidor: `socket.io: ^4.6.1`
   - Cliente: `socket.io-client: ^4.6.1`

3. Si las versiones no coinciden:
```bash
npm install socket.io@^4.6.1  # En servidor
npm install socket.io-client@^4.6.1  # En cliente
```

---

## 🌐 Problemas de Render

### ❌ "Service is sleeping"

**Síntomas:**
- Primera carga tarda 30-60 segundos
- Mensaje: "Starting service..."

**Explicación:**

Esto es **NORMAL** en la capa gratuita de Render. Los servicios se duermen después de 15 minutos de inactividad.

**Soluciones:**

1. **Esperar**: La app se "despertará" en 30-60 segundos
2. **Keep-alive**: Usa UptimeRobot para hacer ping cada 10 minutos
3. **Upgrade**: Cambia a un plan pago ($7/mes) para evitar el sleep

### ❌ "Deployment keeps failing"

**Síntomas:**
- Build falla repetidamente
- Logs muestran errores inconsistentes

**Soluciones:**

1. **Clear build cache** en Render:
   - Ve a tu servicio → Settings
   - Scroll hasta "Danger Zone"
   - Click en "Clear build cache"

2. **Manual deploy**:
   - Ve a tu servicio
   - Click en "Manual Deploy" → "Clear build cache & deploy"

3. **Verifica Node version**:
```json
// En package.json
{
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### ❌ "Out of memory error"

**Síntomas:**
```
JavaScript heap out of memory
```

**Solución:**

En la capa gratuita, la memoria es limitada. Para el cliente:

1. Reduce el tamaño del bundle
2. Optimiza imágenes
3. Considera dividir el código

Si es crítico, considera un plan pago con más RAM.

### ❌ No puedo ver mis repositorios

**Síntomas:**
- Los repositorios no aparecen en Render
- Solo veo algunos repositorios

**Solución:**

1. Ve a Account Settings → Connected Accounts
2. Haz clic en GitHub
3. Click en "Configure"
4. Selecciona:
   - "All repositories", o
   - Los repositorios específicos que necesitas
5. Guarda y vuelve a Render

---

## 🔍 Debugging Avanzado

### Ver logs del servidor

**Local:**
```bash
cd server
npm run dev
# Los logs aparecen en la terminal
```

**Render:**
1. Ve a tu servicio
2. Click en "Logs"
3. Filtra por tipo: Error, Warn, Info

### Ver logs del cliente

**Local:**
```bash
# En el navegador
F12 → Console
```

**Producción:**
```bash
# En el navegador de producción
F12 → Console
```

### Probar endpoints manualmente

```bash
# Health check
curl https://tu-servidor.onrender.com/health

# Obtener token (debería funcionar)
curl -X POST https://tu-servidor.onrender.com/api/get-token

# Estado del avatar
curl https://tu-servidor.onrender.com/api/avatar-state
```

### Test de Socket.IO

En la consola del navegador:

```javascript
// Conectar al servidor
const socket = io('https://tu-servidor.onrender.com');

// Ver eventos
socket.on('connect', () => console.log('✅ Conectado'));
socket.on('disconnect', () => console.log('❌ Desconectado'));

// Cambiar avatar
socket.emit('change-avatar', {
  avatarId: 'Ann_Therapist_public',
  voiceId: '50c32e9b096e46218707499b8e7abcf0'
});
```

---

## 📞 Obtener Ayuda

Si ninguna solución funciona:

1. **Revisa los logs completos** del servidor y cliente
2. **Copia el error exacto** que estás viendo
3. **Busca en Google** el error específico
4. **Revisa la documentación**:
   - [HeyGen Docs](https://docs.heygen.com/)
   - [Render Docs](https://render.com/docs)
   - [Socket.IO Docs](https://socket.io/docs/)

5. **Stack Overflow**: Busca problemas similares
6. **GitHub Issues**: Revisa si otros tienen el mismo problema

---

## ✅ Checklist de Verificación

Antes de pedir ayuda, verifica:

**Desarrollo Local:**
- [ ] Node.js 16+ instalado
- [ ] Todas las dependencias instaladas (`npm install`)
- [ ] Archivos `.env` creados y configurados
- [ ] Servidor corriendo en puerto 3001
- [ ] Cliente corriendo en puerto 3000
- [ ] API Key de HeyGen válida

**Producción (Render):**
- [ ] Código subido a GitHub
- [ ] Build commands correctos
- [ ] Variables de entorno configuradas
- [ ] URLs sin `/` al final
- [ ] CORS configurado correctamente
- [ ] Health check funciona

---

¡Buena suerte! 🚀

Si encuentras un problema no listado aquí, considera agregar la solución a esta guía.
