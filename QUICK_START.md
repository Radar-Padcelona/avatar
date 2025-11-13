# 🚀 Quick Start - Deploy en Render

## Pasos Rápidos

### 1️⃣ Preparar Git (si no lo has hecho)

```bash
cd /Users/juanjocordero/Developer/heygen-demo
git init
git add .
git commit -m "Preparado para deploy en Render"
```

### 2️⃣ Subir a GitHub

```bash
# Crea un repositorio nuevo en GitHub primero, luego:
git remote add origin https://github.com/TU-USUARIO/heygen-demo.git
git push -u origin main
```

### 3️⃣ Deploy del Servidor en Render

1. Ve a [render.com](https://render.com) → **New +** → **Web Service**
2. Conecta tu repo de GitHub
3. Configuración:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Variables de entorno:
   - `HEYGEN_API_KEY`: Tu API key
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `*`
5. Click **Create Web Service**
6. **Copia la URL del servidor** (ej: `https://tu-server.onrender.com`)

### 4️⃣ Deploy del Cliente en Render

1. **New +** → **Static Site**
2. Mismo repo
3. Configuración:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Variables de entorno:
   - `REACT_APP_SERVER_URL`: URL del servidor del paso 3
5. Click **Create Static Site**
6. **Copia la URL del cliente** (ej: `https://tu-cliente.onrender.com`)

### 5️⃣ Actualizar CORS

1. Ve al dashboard del **servidor** en Render
2. **Environment** → Edita `CLIENT_URL`
3. Cambia de `*` a la URL del cliente (paso 4)
4. Guarda (se redesplegará automáticamente)

### 6️⃣ ¡Listo! 🎉

Abre tu cliente en el navegador:
- Avatar: `https://tu-cliente.onrender.com`
- Panel: `https://tu-cliente.onrender.com/control`

---

📖 Para más detalles, ver [DEPLOY.md](./DEPLOY.md)
