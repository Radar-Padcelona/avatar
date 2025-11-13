# 🎭 HeyGen Avatar Demo - Control en Tiempo Real

Demo funcional de control de avatares HeyGen con dos interfaces distintas: una para visualización del avatar en streaming y otra para el panel de control que permite cambiar entre avatares predefinidos en tiempo real.

## 🆕 Actualización del SDK

Este proyecto ha sido actualizado para usar **@heygen/streaming-avatar v2.1.0**, la versión más reciente del SDK de HeyGen con las siguientes mejoras:

### Cambios Principales (v1.0.x → v2.1.0):
- ✅ Uso de enums tipados: `AvatarQuality`, `StreamingEvents`, `VoiceEmotion`
- ✅ Configuración mejorada de voz con `rate` y `emotion`
- ✅ Soporte para idiomas (`language: 'es'`)
- ✅ Nuevas características: push-to-talk, activity timeout, keep-alive
- ✅ Integración con LiveKit para audio/texto

### Migración Realizada:
```typescript
// ANTES (v1.0.x)
await avatar.createStartAvatar({
  avatarName: 'Dexter_Doctor_Standing2_public',
  voice: { voiceId: '...' },
  quality: 'high'
});

// AHORA (v2.1.0)
await avatar.createStartAvatar({
  avatarName: 'Dexter_Doctor_Standing2_public',
  voice: {
    voiceId: '...',
    rate: 1.0,
    emotion: VoiceEmotion.FRIENDLY
  },
  quality: AvatarQuality.High,
  language: 'es'
});
```

## 📋 Descripción

Este proyecto permite:
- ✅ Visualizar avatares de HeyGen en streaming en tiempo real
- ✅ Controlar avatares desde un panel separado
- ✅ Cambiar entre múltiples avatares configurados
- ✅ Sincronización en tiempo real mediante WebSockets
- ✅ Preparado para despliegue en Render (capa gratuita)

## 🎯 Avatares Configurados

1. **Doctor Dexter** (Por defecto)
   - Avatar ID: `Dexter_Doctor_Standing2_public`
   - Voice ID: `7d51b57751f54a2c8ea646713cc2dd96`

2. **CEO Ann**
   - Avatar ID: `Ann_Therapist_public`
   - Voice ID: `50c32e9b096e46218707499b8e7abcf0`

## 🏗️ Arquitectura

El proyecto está dividido en dos aplicaciones independientes:

### 📦 Servidor (`/server`)
- **Tecnología**: Node.js + Express + TypeScript
- **WebSockets**: Socket.IO para comunicación en tiempo real
- **API**: Endpoints para obtener tokens de HeyGen y estado del avatar
- **Deployment**: Render Web Service

### 🎨 Cliente (`/client`)
- **Tecnología**: React + TypeScript
- **Routing**: React Router (2 rutas principales)
- **WebSockets**: Socket.IO Client
- **Deployment**: Render Static Site

## 🚀 Instalación Local

### Prerequisitos
- Node.js 16+ y npm
- Cuenta de HeyGen con API Key

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd heygen-demo
```

### 2. Configurar el servidor
```bash
cd server
npm install

# Crear archivo .env
cp .env.example .env
# Editar .env y agregar tu HEYGEN_API_KEY
```

### 3. Configurar el cliente
```bash
cd ../client
npm install

# Crear archivo .env
cp .env.example .env
# El archivo ya viene configurado para desarrollo local
```

### 4. Ejecutar en desarrollo

**Terminal 1 - Servidor:**
```bash
cd server
npm run dev
```

**Terminal 2 - Cliente:**
```bash
cd client
npm start
```

### 5. Acceder a la aplicación
- 🎭 **Vista del Avatar**: http://localhost:3000
- 🎮 **Panel de Control**: http://localhost:3000/control

## 📱 Uso

1. Abre la **vista del avatar** en un navegador o pestaña
2. Abre el **panel de control** en otro navegador o pestaña
3. Desde el panel de control, selecciona un avatar diferente
4. Observa cómo el cambio se refleja instantáneamente en la vista del avatar

## 🌐 Despliegue en Render

### Preparación
1. Sube el código del servidor y cliente a repositorios de GitHub separados
2. Ve a [render.com](https://render.com) y crea una cuenta

### Servidor (Web Service)

1. Crea un nuevo **Web Service**
2. Conecta tu repositorio del servidor
3. Configuración:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. Variables de entorno:
   ```
   HEYGEN_API_KEY=tu_api_key
   NODE_ENV=production
   CLIENT_URL=* (actualizar después con la URL del cliente)
   ```

5. Guarda la URL del servidor desplegado

### Cliente (Static Site)

1. Crea un nuevo **Static Site**
2. Conecta tu repositorio del cliente
3. Configuración:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. Variables de entorno:
   ```
   REACT_APP_SERVER_URL=https://tu-servidor.onrender.com
   ```

5. Una vez desplegado, copia la URL del cliente

### Configuración Final

1. Vuelve al servidor en Render
2. Actualiza `CLIENT_URL` con la URL del cliente
3. El servidor se redesplegará automáticamente

## 🔧 Estructura del Proyecto

```
heygen-demo/
├── server/
│   ├── src/
│   │   └── index.ts          # Servidor Express + Socket.IO
│   ├── .env.example          # Variables de entorno de ejemplo
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── AvatarView.tsx     # Vista del avatar
    │   │   └── ControlPanel.tsx   # Panel de control
    │   ├── App.tsx                 # Rutas principales
    │   ├── index.tsx               # Entry point
    │   └── index.css               # Estilos globales
    ├── public/
    │   └── index.html
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── tsconfig.json
```

## 🔌 API del Servidor

### POST `/api/get-token`
Obtiene un token de autenticación de HeyGen.

**Response:**
```json
{
  "token": "eyJhbGc..."
}
```

### GET `/api/avatar-state`
Obtiene el estado actual del avatar.

**Response:**
```json
{
  "avatarId": "Dexter_Doctor_Standing2_public",
  "voiceId": "7d51b57751f54a2c8ea646713cc2dd96"
}
```

### GET `/health`
Health check del servidor.

## 🔄 Eventos de Socket.IO

### Cliente → Servidor

#### `change-avatar`
Solicita cambiar el avatar activo.

**Payload:**
```javascript
{
  avatarId: 'Ann_Therapist_public',
  voiceId: '50c32e9b096e46218707499b8e7abcf0'
}
```

### Servidor → Cliente

#### `avatar-state`
Envía el estado actual al conectarse.

#### `avatar-changed`
Notifica que el avatar ha cambiado (broadcast).

## ➕ Agregar Más Avatares

Para agregar nuevos avatares, edita `client/src/pages/ControlPanel.tsx`:

```typescript
const avatarConfigs: AvatarConfig[] = [
  {
    name: '👨‍⚕️ Doctor Dexter',
    avatarId: 'Dexter_Doctor_Standing2_public',
    voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
    description: 'Avatar médico profesional'
  },
  {
    name: '👔 CEO Ann',
    avatarId: 'Ann_Therapist_public',
    voiceId: '50c32e9b096e46218707499b8e7abcf0',
    description: 'Avatar ejecutivo empresarial'
  },
  // Agregar más avatares aquí...
  {
    name: 'Nuevo Avatar',
    avatarId: 'ID_del_avatar',
    voiceId: 'ID_de_voz',
    description: 'Descripción'
  }
];
```

## ⚠️ Limitaciones de Render (Capa Gratuita)

- Las aplicaciones se "duermen" después de 15 minutos de inactividad
- Primera carga después del sueño: 30-60 segundos
- 750 horas gratuitas por mes
- Ancho de banda limitado a 100 GB/mes
- No hay persistencia de datos entre reinicios

## 🔜 Próximos Pasos

Ideas para expandir el proyecto:

1. **Control de voz**: Hacer que los avatares hablen texto personalizado
2. **Más comandos**: Agregar gestos, expresiones faciales
3. **Historial**: Guardar registro de cambios de avatar
4. **Múltiples salas**: Soporte para diferentes sesiones simultáneas
5. **Autenticación**: Control de acceso al panel

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir los cambios que te gustaría hacer.

## 📧 Soporte

Si tienes problemas:
1. Revisa los logs en Render
2. Verifica las variables de entorno
3. Confirma que tu API Key de HeyGen sea válida
4. Revisa la consola del navegador para errores

---

Desarrollado con ❤️ para demos de HeyGen
