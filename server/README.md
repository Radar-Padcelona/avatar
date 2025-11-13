# HeyGen Avatar Server

Servidor backend para control de avatares HeyGen en tiempo real usando WebSockets.

## 🚀 Instalación Local

```bash
npm install
cp .env.example .env
# Edita .env y añade tu HEYGEN_API_KEY
npm run dev
```

## 📦 Scripts

- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Ejecutar servidor en producción

## 🌐 Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
HEYGEN_API_KEY=tu_api_key_aqui
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 🔧 Deploy en Render

Las dependencias de TypeScript y tipos (`@types/*`) están en `dependencies` (no en `devDependencies`) porque Render las necesita para compilar el proyecto en producción.

### Variables de entorno en Render:
- `HEYGEN_API_KEY`: Tu API key de HeyGen
- `NODE_ENV`: `production`
- `CLIENT_URL`: URL del cliente (ej: `https://tu-cliente.onrender.com`)

Ver [DEPLOY.md](../DEPLOY.md) para instrucciones completas.
