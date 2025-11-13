# 🚀 EMPIEZA AQUÍ - HeyGen Avatar Demo

```
██╗  ██╗███████╗██╗   ██╗ ██████╗ ███████╗███╗   ██╗
██║  ██║██╔════╝╚██╗ ██╔╝██╔════╝ ██╔════╝████╗  ██║
███████║█████╗   ╚████╔╝ ██║  ███╗█████╗  ██╔██╗ ██║
██╔══██║██╔══╝    ╚██╔╝  ██║   ██║██╔══╝  ██║╚██╗██║
██║  ██║███████╗   ██║   ╚██████╔╝███████╗██║ ╚████║
╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝
                                                      
    Avatar Demo - Control en Tiempo Real 🎭
```

---

## 🎯 ¿Qué es esto?

Un proyecto completo para controlar avatares de HeyGen en tiempo real desde diferentes navegadores.

**Características:**
- ✅ Vista del avatar en streaming
- ✅ Panel de control separado
- ✅ Cambio de avatares en tiempo real
- ✅ Sincronización mediante WebSockets
- ✅ Listo para desplegar en Render (gratis)

---

## ⚡ Inicio Ultra-Rápido (3 pasos)

### 1️⃣ Instalar Dependencias (2 min)

```bash
# Servidor
cd server
npm install
cp .env.example .env
# Edita .env y agrega tu HEYGEN_API_KEY

# Cliente
cd ../client
npm install
```

### 2️⃣ Ejecutar (30 segundos)

**Terminal 1:**
```bash
cd server
npm run dev
```

**Terminal 2:**
```bash
cd client
npm start
```

### 3️⃣ Probar (1 min)

- Abre: http://localhost:3000 (Vista del avatar)
- Abre en otra pestaña: http://localhost:3000/control (Panel)
- Cambia el avatar desde el panel
- ¡Observa el cambio en tiempo real! 🎉

---

## 📚 ¿Qué quieres hacer?

### 👨‍💻 Desarrollar Localmente
```
👉 Lee: QUICK_START.md
   └─ Setup completo en 5 minutos
   └─ Comandos de desarrollo
   └─ Troubleshooting básico
```

### 🚀 Desplegarlo en Internet (Render)
```
👉 Lee: DEPLOYMENT_GUIDE.md
   └─ Guía paso a paso MUY detallada
   └─ Específica para principiantes
   └─ Configuración completa de Render
```

### 🔧 Personalizarlo
```
👉 Lee: client/README.md
   └─ Agregar más avatares
   └─ Cambiar colores y estilos
   └─ Modificar componentes
```

### 🐛 Resolver un Problema
```
👉 Lee: TROUBLESHOOTING.md
   └─ Problemas comunes con soluciones
   └─ Debugging avanzado
   └─ FAQs
```

### 📖 Entender Todo el Proyecto
```
👉 Lee: PROJECT_SUMMARY.md
   └─ Resumen completo
   └─ Arquitectura
   └─ Tecnologías usadas
```

---

## 📂 Archivos Importantes

| Archivo | Propósito | Cuándo Leerlo |
|---------|-----------|---------------|
| **INDEX.md** | Índice de toda la documentación | Para navegar el proyecto |
| **PROJECT_SUMMARY.md** | Resumen completo del proyecto | Para entender todo |
| **QUICK_START.md** | Inicio rápido | Para empezar YA |
| **DEPLOYMENT_GUIDE.md** | Deploy en Render | Para subir a producción |
| **GIT_GUIDE.md** | Comandos Git | Para usar Git/GitHub |
| **TROUBLESHOOTING.md** | Solución de problemas | Cuando algo falla |
| **server/README.md** | Docs del backend | Para modificar servidor |
| **client/README.md** | Docs del frontend | Para modificar cliente |

---

## 🎭 Avatares Incluidos

### 1. 👨‍⚕️ Doctor Dexter (Por defecto)
```
Avatar ID: Dexter_Doctor_Standing2_public
Voice ID: 7d51b57751f54a2c8ea646713cc2dd96
```

### 2. 👔 CEO Ann
```
Avatar ID: Ann_Therapist_public
Voice ID: 50c32e9b096e46218707499b8e7abcf0
```

**¿Quieres agregar más?** Edita: `client/src/pages/ControlPanel.tsx`

---

## 🛠️ Stack Tecnológico

### Backend (server/)
- **Node.js** + **Express** - Servidor HTTP
- **Socket.IO** - WebSockets en tiempo real
- **TypeScript** - Type safety

### Frontend (client/)
- **React 18** - Librería UI
- **TypeScript** - Lenguaje tipado
- **Socket.IO Client** - Cliente WebSocket
- **@heygen/streaming-avatar** - SDK de HeyGen

---

## 📱 Cómo Funciona

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Panel Control  │◄───────►│  Servidor Node   │◄───────►│  Vista Avatar   │
│  (navegador 1)  │ Socket  │  + Socket.IO     │ Socket  │  (navegador 2)  │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        │                            │                            │
        │                            │                            │
        │                            ▼                            │
        │                    ┌──────────────┐                    │
        └───────────────────►│  HeyGen API  │◄───────────────────┘
                             └──────────────┘
```

1. El **Panel de Control** solicita cambiar avatar
2. El **Servidor** recibe la petición via Socket.IO
3. El **Servidor** hace broadcast a todos los clientes
4. La **Vista del Avatar** recibe el cambio y actualiza
5. El **Avatar** se obtiene desde la API de HeyGen

---

## 🚨 Prerequisitos

Antes de empezar, necesitas:

- ✅ **Node.js 16+** instalado
- ✅ **npm** (viene con Node.js)
- ✅ **Cuenta de HeyGen** con API Key
- ✅ **Git** (para deployment)
- ✅ Editor de código (VS Code recomendado)

**¿No tienes Node.js?**
- Mac: `brew install node`
- Windows: [nodejs.org](https://nodejs.org)
- Linux: `sudo apt install nodejs npm`

**¿No tienes API Key de HeyGen?**
1. Ve a [app.heygen.com](https://app.heygen.com)
2. Regístrate o inicia sesión
3. Settings → API Keys → Generate

---

## 🎯 Tu Primer Objetivo

```
┌───────────────────────────────────────────────────────┐
│  OBJETIVO: Tener el proyecto funcionando localmente   │
│  TIEMPO ESTIMADO: 5 minutos                           │
│  ARCHIVO A LEER: QUICK_START.md                       │
└───────────────────────────────────────────────────────┘
```

### Paso a Paso:

1. **Instala dependencias** (server y client)
2. **Configura .env** (agrega tu HEYGEN_API_KEY)
3. **Ejecuta servidor** (npm run dev)
4. **Ejecuta cliente** (npm start)
5. **¡Pruébalo!** (cambia avatar desde el panel)

---

## 📚 Documentación Completa

```
📦 heygen-demo/
├── 📄 START_HERE.md          ⭐ ESTE ARCHIVO
├── 📄 INDEX.md               📚 Índice de documentación
├── 📄 PROJECT_SUMMARY.md     📋 Resumen completo
├── 📄 QUICK_START.md         ⚡ Inicio rápido (5 min)
├── 📄 README.md              📖 Documentación principal
├── 📄 DEPLOYMENT_GUIDE.md    🚀 Deploy en Render
├── 📄 GIT_GUIDE.md           🔀 Git y GitHub
├── 📄 TROUBLESHOOTING.md     🔧 Solución de problemas
├── 🖥️ server/                Código del backend
└── 🎨 client/                Código del frontend
```

---

## 💡 Tips Importantes

### 🔑 API Key de HeyGen
- **NUNCA** subas tu API Key a GitHub
- Usa archivos `.env` (ya están en `.gitignore`)
- En Render, configúrala como variable de entorno

### 🌐 URLs en Render
- NO uses `*` en producción para `CLIENT_URL`
- NO incluyas `/` al final de las URLs
- Formato correcto: `https://tu-app.onrender.com`

### ⏰ Capa Gratuita de Render
- Las apps se "duermen" tras 15 min sin uso
- Primera carga tarda 30-60 segundos
- Es completamente NORMAL

### 🔄 Git y Deployment
- Cada `git push` redespliega automáticamente
- Puedes ver los logs en tiempo real en Render
- Usa mensajes de commit descriptivos

---

## 🎓 Aprenderás

Al trabajar con este proyecto:
- ✅ WebSockets y comunicación en tiempo real
- ✅ Arquitectura cliente-servidor
- ✅ React Hooks (useState, useEffect, useRef)
- ✅ TypeScript en frontend y backend
- ✅ Deployment en cloud (Render)
- ✅ Integración con APIs externas
- ✅ Git y GitHub
- ✅ Variables de entorno

---

## 🏆 Logros Desbloqueables

- [ ] ✅ Instalar y ejecutar localmente
- [ ] ✅ Cambiar avatar exitosamente
- [ ] ✅ Subir código a GitHub
- [ ] ✅ Desplegar en Render
- [ ] ✅ Agregar un nuevo avatar
- [ ] ✅ Personalizar los colores del panel
- [ ] ✅ Agregar más funcionalidades

---

## 🆘 ¿Necesitas Ayuda?

### Primero, intenta:
1. Lee **TROUBLESHOOTING.md** - tiene las soluciones más comunes
2. Revisa los logs del servidor o la consola del navegador
3. Verifica que las variables de entorno estén correctas

### Si nada funciona:
1. Busca el error en Google
2. Revisa Stack Overflow
3. Consulta la documentación oficial:
   - [HeyGen Docs](https://docs.heygen.com/)
   - [Render Docs](https://render.com/docs)
   - [Socket.IO Docs](https://socket.io/docs/)

---

## 🚀 ¡Comienza Ahora!

```bash
# Copia estos comandos y pégalos en tu terminal:

# 1. Ve al directorio del servidor
cd server

# 2. Instala dependencias
npm install

# 3. Copia el archivo de ejemplo
cp .env.example .env

# 4. Abre .env y agrega tu HEYGEN_API_KEY
# (usa tu editor favorito)

# 5. Inicia el servidor
npm run dev

# 6. En OTRA terminal, ve al cliente
cd ../client

# 7. Instala dependencias
npm install

# 8. Inicia el cliente
npm start

# 9. ¡Tu navegador se abrirá automáticamente!
# Prueba el panel de control en: http://localhost:3000/control
```

---

## 📖 Siguiente Lectura Recomendada

Según tu objetivo:

| Si quieres... | Lee este archivo |
|---------------|------------------|
| Empezar rápido | **QUICK_START.md** |
| Entender todo | **PROJECT_SUMMARY.md** |
| Desplegarlo | **DEPLOYMENT_GUIDE.md** |
| Personalizarlo | **client/README.md** |
| Resolver problemas | **TROUBLESHOOTING.md** |
| Usar Git | **GIT_GUIDE.md** |

---

## 🎉 ¡Diviértete!

Este proyecto está diseñado para ser:
- 🚀 **Rápido de configurar**
- 📚 **Fácil de entender**
- 🎨 **Personalizable**
- 🔧 **Listo para producción**

---

**¿Listo para empezar?** 👉 Abre **QUICK_START.md**

**¿Quieres más detalles?** 👉 Abre **PROJECT_SUMMARY.md**

**¿Tienes problemas?** 👉 Abre **TROUBLESHOOTING.md**

---

*Desarrollado con ❤️ para demos de HeyGen*  
*Versión 1.0.0 - Noviembre 2025*
