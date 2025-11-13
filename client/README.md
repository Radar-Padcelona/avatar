# 🎨 HeyGen Avatar Client

Cliente frontend React + TypeScript que proporciona dos interfaces: una para visualizar avatares de HeyGen en streaming y otra para controlarlos en tiempo real.

## 🎯 Funcionalidades

- ✅ Vista de avatar en streaming con video en tiempo real
- ✅ Panel de control para cambiar avatares
- ✅ Comunicación WebSocket para sincronización instantánea
- ✅ Interfaz responsive y moderna
- ✅ Manejo de errores y estados de carga
- ✅ TypeScript para type safety

## 📦 Tecnologías

- **React 18** - Librería UI
- **TypeScript** - Lenguaje tipado
- **React Router** - Navegación
- **Socket.IO Client** - WebSockets
- **@heygen/streaming-avatar** - SDK de HeyGen

## 🚀 Instalación

```bash
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
REACT_APP_SERVER_URL=http://localhost:3001
```

### Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `REACT_APP_SERVER_URL` | URL del servidor backend | `http://localhost:3001` |

**Importante:** En React, las variables deben empezar con `REACT_APP_`

## 🏃 Ejecución

### Desarrollo
```bash
npm start
```

Se abrirá automáticamente en `http://localhost:3000`

### Producción
```bash
npm run build
```

Genera la carpeta `build/` con los archivos optimizados.

## 🗺️ Rutas

### `/` - Vista del Avatar

Muestra el avatar activo en streaming.

**Características:**
- Video en tiempo real
- Indicador de carga
- Mensajes de error
- Cambio automático cuando el panel de control lo solicita

### `/control` - Panel de Control

Interfaz para controlar avatares.

**Características:**
- Estado de conexión en tiempo real
- Selector de avatares
- Indicador de avatar activo
- Instrucciones de uso

### `*` - 404 Not Found

Página para rutas no encontradas con enlaces rápidos.

## 📁 Estructura

```
client/
├── src/
│   ├── pages/
│   │   ├── AvatarView.tsx        # Vista del avatar
│   │   └── ControlPanel.tsx      # Panel de control
│   ├── App.tsx                    # Rutas principales
│   ├── index.tsx                  # Entry point
│   └── index.css                  # Estilos globales
├── public/
│   └── index.html                 # HTML template
├── build/                         # Build de producción (generado)
├── .env                           # Variables de entorno (no incluir en git)
├── .env.example                   # Ejemplo de variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🎨 Componentes

### AvatarView

Componente principal para visualizar el avatar.

**Props:** Ninguna

**Estados:**
- `avatar`: Instancia del avatar de HeyGen
- `isLoading`: Indicador de carga
- `error`: Mensaje de error si existe

**Eventos Socket.IO:**
- Escucha: `avatar-changed` - Cambia el avatar activo

### ControlPanel

Panel de control para cambiar avatares.

**Props:** Ninguna

**Estados:**
- `socket`: Conexión Socket.IO
- `currentAvatar`: ID del avatar activo
- `isConnected`: Estado de conexión
- `lastChange`: Timestamp del último cambio

**Eventos Socket.IO:**
- Emite: `change-avatar` - Solicita cambiar avatar
- Escucha: `avatar-state` - Recibe estado inicial

## 🎭 Configuración de Avatares

Para agregar o modificar avatares, edita `src/pages/ControlPanel.tsx`:

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
  // Agregar más aquí...
];
```

## 🎨 Personalización

### Cambiar Colores

Edita los estilos inline en `ControlPanel.tsx`:

```typescript
// Fondo del panel
background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// Colores de botones
backgroundColor: '#667eea'  // Botón normal
backgroundColor: '#28a745'  // Botón activo
```

### Cambiar Diseño

Los componentes usan estilos inline para facilitar la personalización. Puedes:

1. **Agregar clases CSS**: Crea un archivo CSS y usa className
2. **Usar styled-components**: Instala y configura
3. **Agregar Tailwind**: Instala y configura

### Agregar UI Library

```bash
# Material-UI
npm install @mui/material @emotion/react @emotion/styled

# Chakra UI
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion

# Ant Design
npm install antd
```

## 🔧 Desarrollo

### Scripts Disponibles

```bash
npm start          # Desarrollo
npm run build      # Build producción
npm test           # Tests
npm run eject      # Eject de CRA (no recomendado)
```

### Hot Reload

Los cambios se reflejan automáticamente en desarrollo.

### TypeScript

El proyecto usa TypeScript strict mode. Todos los tipos están definidos.

## 🐛 Debug

### Consola del Navegador

Abre las DevTools (F12) para ver:
- Logs de conexión Socket.IO
- Errores de carga del avatar
- Estado de la aplicación

### React Developer Tools

Instala la extensión de React DevTools para inspeccionar:
- Estado de componentes
- Props
- Jerarquía de componentes

## 🚢 Deployment en Render

### Build Command
```bash
npm install && npm run build
```

### Publish Directory
```
build
```

### Variables de Entorno
```
REACT_APP_SERVER_URL=https://tu-servidor.onrender.com
```

## 📱 Responsive Design

El diseño se adapta a diferentes tamaños de pantalla:

- **Desktop**: Vista completa
- **Tablet**: Layout ajustado
- **Mobile**: Stack vertical

## ♿ Accesibilidad

- Uso de etiquetas semánticas
- Indicadores visuales de estado
- Contraste adecuado de colores
- Mensajes de error claros

## ⚡ Optimización

### Performance

- Lazy loading de componentes (si lo necesitas)
- Memoización con `useMemo` y `useCallback`
- Optimización de re-renders

### Build Size

El build de producción está optimizado automáticamente por Create React App:
- Minificación
- Tree shaking
- Code splitting

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca** commitees el archivo `.env`
2. No expongas API keys en el cliente
3. Valida todas las entradas del usuario
4. Usa HTTPS en producción

### Variables de Entorno

Solo las variables que empiezan con `REACT_APP_` se incluyen en el build.

## ⚠️ Problemas Comunes

### Avatar no carga

- Verifica que el servidor esté corriendo
- Revisa `REACT_APP_SERVER_URL` en `.env`
- Verifica en la consola si hay errores

### Panel no conecta

- Verifica la URL del servidor
- Revisa la consola del navegador
- Verifica que CORS esté configurado en el servidor

### Cambio no se refleja

- Verifica que Socket.IO esté conectado (indicador verde)
- Revisa los logs del servidor
- Recarga ambas pestañas

## 🔄 Actualizaciones

Para actualizar el cliente:

```bash
git pull
npm install
npm run build
```

En Render, simplemente haz `git push` y se redesplegará automáticamente.

## 📚 Recursos

- [Documentación de React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [HeyGen SDK](https://docs.heygen.com/)

## 📝 Licencia

MIT

---

Desarrollado para el proyecto HeyGen Avatar Demo
