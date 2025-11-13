# 🚀 Guía Completa de Deployment en Render

Esta guía te llevará paso a paso por el proceso de desplegar tu aplicación de avatares HeyGen en Render, incluso si nunca has usado esta plataforma antes.

## 📚 Índice

1. [Preparación Previa](#preparación-previa)
2. [Crear Cuenta en Render](#crear-cuenta-en-render)
3. [Desplegar el Servidor](#desplegar-el-servidor)
4. [Desplegar el Cliente](#desplegar-el-cliente)
5. [Configuración Final](#configuración-final)
6. [Verificación y Pruebas](#verificación-y-pruebas)
7. [Solución de Problemas](#solución-de-problemas)

---

## 📋 Preparación Previa

### 1. Obtener tu API Key de HeyGen

Antes de comenzar, necesitas tu API Key de HeyGen:

1. Ve a [HeyGen](https://app.heygen.com/)
2. Inicia sesión en tu cuenta
3. Ve a Settings → API Keys
4. Copia tu API Key (la necesitarás después)

### 2. Subir el código a GitHub

Necesitas tener dos repositorios en GitHub, uno para el servidor y otro para el cliente.

**Para el servidor:**
```bash
cd server
git init
git add .
git commit -m "Initial server setup"

# Crea un repositorio en GitHub llamado "heygen-avatar-server"
# Luego ejecuta:
git remote add origin https://github.com/TU_USUARIO/heygen-avatar-server.git
git branch -M main
git push -u origin main
```

**Para el cliente:**
```bash
cd ../client
git init
git add .
git commit -m "Initial client setup"

# Crea un repositorio en GitHub llamado "heygen-avatar-client"
# Luego ejecuta:
git remote add origin https://github.com/TU_USUARIO/heygen-avatar-client.git
git branch -M main
git push -u origin main
```

---

## 🆕 Crear Cuenta en Render

### Paso 1: Registro

1. Ve a [https://render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Tienes dos opciones:
   - **Recomendado**: "Sign up with GitHub" (más fácil para conectar repositorios)
   - Email y contraseña

### Paso 2: Verificación

1. Si te registraste con email, verifica tu correo
2. Completa tu perfil si es necesario
3. Llegarás al Dashboard de Render

### Paso 3: Conectar GitHub (si no lo hiciste en el registro)

1. Haz clic en tu avatar en la esquina superior derecha
2. Ve a **"Account Settings"**
3. En la sección **"Connected Accounts"**, haz clic en **"Connect"** junto a GitHub
4. Autoriza a Render para acceder a tus repositorios

---

## 🖥️ Desplegar el Servidor

### Paso 1: Crear Web Service

1. Desde el **Dashboard** de Render, haz clic en el botón **"New +"** (azul, arriba a la derecha)
2. Selecciona **"Web Service"**

### Paso 2: Conectar Repositorio

1. Verás una lista de tus repositorios de GitHub
2. Si no ves tu repositorio `heygen-avatar-server`:
   - Haz clic en **"Configure account"**
   - Selecciona tu repositorio
   - Haz clic en **"Install"**
3. Una vez visible, haz clic en **"Connect"** junto a `heygen-avatar-server`

### Paso 3: Configurar el Servicio

Completa el formulario con estos valores:

#### Información Básica
- **Name**: `heygen-avatar-server` (o el nombre que prefieras)
  - Este será parte de tu URL: `heygen-avatar-server.onrender.com`
- **Region**: Selecciona la más cercana a ti (ej: Frankfurt, Oregon, etc.)
- **Branch**: `main`
- **Root Directory**: Déjalo **vacío**

#### Runtime
- **Runtime**: Selecciona **`Node`**

#### Build & Deploy
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Start Command**: 
  ```
  npm start
  ```

#### Plan
- **Instance Type**: Selecciona **`Free`** ($0/month)

### Paso 4: Configurar Variables de Entorno

**IMPORTANTE**: No hagas clic en "Create Web Service" todavía.

Baja hasta la sección **"Environment Variables"** y agrega estas variables:

1. Haz clic en **"Add Environment Variable"**

2. **Variable 1:**
   - **Key**: `HEYGEN_API_KEY`
   - **Value**: Tu API Key de HeyGen (la que copiaste antes)

3. Haz clic en **"Add Environment Variable"** de nuevo

4. **Variable 2:**
   - **Key**: `NODE_ENV`
   - **Value**: `production`

5. Haz clic en **"Add Environment Variable"** una vez más

6. **Variable 3:**
   - **Key**: `CLIENT_URL`
   - **Value**: `*`
   - Nota: Actualizaremos esto después

### Paso 5: Desplegar

1. Ahora sí, haz clic en **"Create Web Service"** al final de la página
2. Render comenzará a construir tu aplicación
3. Verás los logs en tiempo real:
   ```
   ==> Installing dependencies...
   ==> Building application...
   ==> Starting service...
   ```
4. Espera 2-5 minutos hasta ver: **"Your service is live 🎉"**

### Paso 6: Guardar la URL del Servidor

1. En la parte superior de la página verás tu URL, algo como:
   ```
   https://heygen-avatar-server.onrender.com
   ```
2. **COPIA Y GUARDA ESTA URL** - la necesitarás para el cliente

📝 **Tip**: Puedes probar que funciona visitando:
```
https://tu-servidor.onrender.com/health
```
Deberías ver: `{"status":"ok","timestamp":"..."}`

---

## 🎨 Desplegar el Cliente

### Paso 1: Crear Static Site

1. Vuelve al **Dashboard** de Render
2. Haz clic en **"New +"** nuevamente
3. Esta vez selecciona **"Static Site"**

### Paso 2: Conectar Repositorio del Cliente

1. Busca y selecciona tu repositorio `heygen-avatar-client`
2. Haz clic en **"Connect"**

### Paso 3: Configurar el Static Site

Completa el formulario:

#### Información Básica
- **Name**: `heygen-avatar-client` (o el nombre que prefieras)
- **Branch**: `main`
- **Root Directory**: Déjalo **vacío**

#### Build Settings
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Publish Directory**: 
  ```
  build
  ```

### Paso 4: Configurar Variable de Entorno del Cliente

En la sección **"Environment Variables"**:

1. Haz clic en **"Add Environment Variable"**

2. **Variable:**
   - **Key**: `REACT_APP_SERVER_URL`
   - **Value**: La URL de tu servidor (la que guardaste antes)
   - Ejemplo: `https://heygen-avatar-server.onrender.com`

### Paso 5: Desplegar el Cliente

1. Haz clic en **"Create Static Site"**
2. Render construirá tu aplicación (2-5 minutos)
3. Espera a ver: **"Your site is live 🎉"**

### Paso 6: Guardar la URL del Cliente

1. Copia tu URL del cliente, algo como:
   ```
   https://heygen-avatar-client.onrender.com
   ```
2. **GUARDA ESTA URL** - es tu aplicación final

---

## ⚙️ Configuración Final

Ahora que ambas aplicaciones están desplegadas, necesitamos actualizar el CORS del servidor.

### Paso 1: Actualizar CLIENT_URL en el Servidor

1. Ve al **Dashboard** de Render
2. Haz clic en tu servicio **heygen-avatar-server**
3. En el menú lateral izquierdo, haz clic en **"Environment"**
4. Busca la variable `CLIENT_URL`
5. Haz clic en el ícono de **editar** (lápiz) a la derecha
6. Cambia el valor de `*` a la URL completa de tu cliente
   - Ejemplo: `https://heygen-avatar-client.onrender.com`
7. Haz clic en **"Save Changes"**

### Paso 2: Esperar Redespliegue

1. Render redesplegará automáticamente el servidor
2. Ve a la pestaña **"Logs"** para ver el progreso
3. Espera 1-2 minutos hasta ver: **"Your service is live 🎉"**

---

## ✅ Verificación y Pruebas

### Prueba 1: Verificar que el Servidor Funciona

Visita en tu navegador:
```
https://tu-servidor.onrender.com/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2025-11-12T..."}
```

### Prueba 2: Abrir la Vista del Avatar

1. Abre tu navegador
2. Ve a la URL de tu cliente:
   ```
   https://tu-cliente.onrender.com
   ```
3. Deberías ver:
   - Mensaje "⏳ Cargando avatar..."
   - Después de unos segundos, el avatar Doctor Dexter

⚠️ **Primera vez**: Si es la primera carga después de que el servicio se "durmió", puede tardar 30-60 segundos.

### Prueba 3: Abrir el Panel de Control

1. Abre una **nueva pestaña** (o usa otro navegador/dispositivo)
2. Ve a:
   ```
   https://tu-cliente.onrender.com/control
   ```
3. Deberías ver:
   - Panel de control con estado "🟢 Conectado"
   - Avatar actual: "👨‍⚕️ Doctor Dexter"
   - Dos botones para cambiar avatar

### Prueba 4: Cambiar Avatar en Tiempo Real

1. Con ambas pestañas abiertas:
   - Pestaña 1: Vista del avatar
   - Pestaña 2: Panel de control

2. En el panel de control, haz clic en **"👔 CEO Ann"**

3. Observa la pestaña con el avatar:
   - Verás el mensaje "⏳ Cargando avatar..."
   - El avatar cambiará de Doctor Dexter a CEO Ann

4. Prueba volver a cambiar a Doctor Dexter

✅ **Si todo funciona**: ¡Felicitaciones! Tu aplicación está completamente desplegada.

---

## 🔧 Solución de Problemas

### Problema: "El avatar no carga"

**Posibles causas y soluciones:**

1. **API Key incorrecta**
   - Ve al servidor en Render → Environment
   - Verifica que `HEYGEN_API_KEY` sea correcta
   - Guarda cambios (se redesplegará)

2. **Error en logs del servidor**
   - Ve al servidor → Logs
   - Busca errores en rojo
   - Los errores comunes incluyen problemas de autenticación con HeyGen

3. **IDs de avatar incorrectos**
   - Verifica que los IDs en `ControlPanel.tsx` sean válidos
   - Consulta la documentación de HeyGen para IDs correctos

### Problema: "El panel de control no se conecta"

**Soluciones:**

1. **URL del servidor incorrecta**
   - Ve al cliente en Render → Environment
   - Verifica que `REACT_APP_SERVER_URL` sea correcta
   - Debe incluir `https://` y NO debe tener `/` al final

2. **CORS bloqueado**
   - Ve al servidor → Environment
   - Verifica que `CLIENT_URL` sea la URL exacta del cliente
   - Guarda cambios

3. **Servidor dormido**
   - Visita `https://tu-servidor.onrender.com/health`
   - Espera 30-60 segundos si estaba dormido
   - Recarga el panel de control

### Problema: "La aplicación es muy lenta"

**Explicación:**

En la capa gratuita de Render:
- Las aplicaciones se "duermen" después de 15 minutos sin actividad
- La primera carga después de dormir tarda 30-60 segundos
- Es completamente normal

**Soluciones:**

1. **Mantener activo** (consume más horas gratuitas):
   - Usa un servicio como [UptimeRobot](https://uptimerobot.com/)
   - Configura un ping cada 10 minutos a `/health`

2. **Actualizar a plan pago**:
   - Los planes de Render comienzan en $7/mes
   - Eliminan el "sleep" y mejoran el rendimiento

### Problema: "Error 500 en el servidor"

**Pasos:**

1. Ve al servidor en Render → Logs
2. Busca el mensaje de error específico
3. Errores comunes:
   - `HEYGEN_API_KEY is not defined`: Falta la variable de entorno
   - `fetch failed`: Problema de red con la API de HeyGen
   - `port already in use`: Reinicia el servicio

### Problema: "No puedo ver mis repositorios en Render"

**Solución:**

1. Ve a tu cuenta de Render → Account Settings
2. En "Connected Accounts", desconecta GitHub
3. Vuelve a conectar GitHub
4. Durante la autorización, asegúrate de:
   - Dar acceso a todos los repositorios, o
   - Seleccionar específicamente tus repositorios

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs en Tiempo Real

1. Ve a tu servicio/site en Render
2. Haz clic en la pestaña **"Logs"**
3. Verás todos los eventos en tiempo real

### Redespliegue Manual

Si haces cambios en tu código:

1. Haz `git push` a GitHub
2. Render redesplegará **automáticamente**
3. Puedes ver el progreso en la pestaña "Events"

### Redespliegue Manual Forzado

1. Ve a tu servicio en Render
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎉 ¡Listo!

Ahora tienes tu aplicación de avatares HeyGen completamente desplegada en Render.

### URLs Finales:

```
🎭 Vista del Avatar:
https://tu-cliente.onrender.com/

🎮 Panel de Control:
https://tu-cliente.onrender.com/control
```

### Próximos Pasos:

1. Comparte estas URLs para demostrar tu aplicación
2. Personaliza los estilos en `ControlPanel.tsx`
3. Agrega más avatares editando el array `avatarConfigs`
4. Considera agregar funcionalidades como texto a voz

---

## 📞 ¿Necesitas Más Ayuda?

- **Documentación de Render**: https://render.com/docs
- **Documentación de HeyGen**: https://docs.heygen.com
- **Stack Overflow**: Busca errores específicos
- **GitHub Issues**: Abre un issue en tu repositorio

---

¡Éxito con tu demo! 🚀
