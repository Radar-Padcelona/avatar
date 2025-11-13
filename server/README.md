# 🖥️ HeyGen Avatar Server

Servidor backend Node.js + Express que maneja la comunicación en tiempo real con avatares de HeyGen mediante Socket.IO.

## 🎯 Funcionalidades

- ✅ API REST para obtener tokens de HeyGen
- ✅ Gestión del estado global de avatares
- ✅ WebSocket (Socket.IO) para comunicación en tiempo real
- ✅ CORS configurado para múltiples clientes
- ✅ Health check endpoint
- ✅ TypeScript para type safety

## 📦 Tecnologías

- **Node.js** - Runtime
- **Express** - Framework web
- **Socket.IO** - WebSockets en tiempo real
- **TypeScript** - Lenguaje tipado
- **dotenv** - Gestión de variables de entorno

## 🚀 Instalación

```bash
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
HEYGEN_API_KEY=tu_api_key_de_heygen
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `HEYGEN_API_KEY` | API Key de HeyGen | `eyJhbGc...` |
| `PORT` | Puerto del servidor | `3001` |
| `NODE_ENV` | Entorno de ejecución | `development` o `production` |
| `CLIENT_URL` | URL del cliente para CORS | `http://localhost:3000` o `*` |

## 🏃 Ejecución

### Desarrollo (con hot-reload)
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📡 API Endpoints

### POST `/api/get-token`

Obtiene un token de autenticación de HeyGen.

**Request:**
```bash
curl -X POST http://localhost:3001/api/get-token
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET `/api/avatar-state`

Obtiene el estado actual del avatar.

**Request:**
```bash
curl http://localhost:3001/api/avatar-state
```

**Response:**
```json
{
  "avatarId": "Dexter_Doctor_Standing2_public",
  "voiceId": "7d51b57751f54a2c8ea646713cc2dd96"
}
```

### GET `/health`

Health check del servidor.

**Request:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

## 🔌 Socket.IO Events

### Cliente → Servidor

#### `change-avatar`

Solicita cambiar el avatar activo.

**Payload:**
```javascript
socket.emit('change-avatar', {
  avatarId: 'Ann_Therapist_public',
  voiceId: '50c32e9b096e46218707499b8e7abcf0'
});
```

### Servidor → Cliente

#### `avatar-state`

Envía el estado actual del avatar cuando un cliente se conecta.

**Payload:**
```javascript
{
  avatarId: 'Dexter_Doctor_Standing2_public',
  voiceId: '7d51b57751f54a2c8ea646713cc2dd96'
}
```

#### `avatar-changed`

Broadcast cuando el avatar cambia (a todos los clientes excepto el emisor).

**Payload:**
```javascript
{
  avatarId: 'Ann_Therapist_public',
  voiceId: '50c32e9b096e46218707499b8e7abcf0'
}
```

## 📁 Estructura

```
server/
├── src/
│   └── index.ts          # Servidor principal
├── dist/                 # Código compilado (generado)
├── .env                  # Variables de entorno (no incluir en git)
├── .env.example          # Ejemplo de variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Desarrollo

### Agregar Nuevos Endpoints

Edita `src/index.ts`:

```typescript
// Nuevo endpoint
app.get('/api/mi-endpoint', (req, res) => {
  res.json({ message: 'Hola mundo' });
});
```

### Agregar Nuevos Eventos de Socket

```typescript
socket.on('mi-evento', (data) => {
  // Manejar evento
  socket.broadcast.emit('respuesta-evento', data);
});
```

## 🐛 Debug

### Ver Logs en Consola

Los logs incluyen:
- ✅ Conexiones de clientes
- ✅ Desconexiones
- ✅ Cambios de avatar
- ❌ Errores de API

```bash
npm run dev
```

### Probar con curl

```bash
# Health check
curl http://localhost:3001/health

# Obtener token
curl -X POST http://localhost:3001/api/get-token

# Estado del avatar
curl http://localhost:3001/api/avatar-state
```

## 🚢 Deployment en Render

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm start
```

### Variables de Entorno
```
HEYGEN_API_KEY=tu_api_key
NODE_ENV=production
CLIENT_URL=https://tu-cliente.onrender.com
```

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca** commits el archivo `.env`
2. Usa variables de entorno para datos sensibles
3. Mantén actualizado `CLIENT_URL` en producción
4. Valida todas las entradas del usuario
5. Usa HTTPS en producción

### CORS

CORS está configurado para aceptar:
- El dominio especificado en `CLIENT_URL`
- Métodos: GET, POST
- Headers estándar

Para desarrollo local, puedes usar `CLIENT_URL=*` pero NO lo uses en producción.

## 📊 Monitoreo

### Logs en Producción (Render)

1. Ve a tu servicio en Render
2. Haz clic en "Logs"
3. Filtra por tipo de log

### Métricas

Render proporciona:
- CPU usage
- Memory usage
- Request count
- Response times

## ⚠️ Problemas Comunes

### Puerto ya en uso

```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

### CORS Error

Verifica que `CLIENT_URL` coincida exactamente con la URL del cliente.

### Error al obtener token

- Verifica que `HEYGEN_API_KEY` sea válida
- Verifica tu conectividad a internet
- Revisa los límites de tu cuenta de HeyGen

## 🔄 Actualizaciones

Para actualizar el servidor:

```bash
git pull
npm install
npm run build
npm start
```

En Render, simplemente haz `git push` y se redesplegarán automáticamente.

## 📝 Licencia

MIT

---

Desarrollado para el proyecto HeyGen Avatar Demo
