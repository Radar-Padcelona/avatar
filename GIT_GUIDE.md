# 🔀 Guía de Git para Deployment

Comandos esenciales de Git para subir tu proyecto a GitHub y desplegarlo en Render.

---

## 📋 Pre-requisitos

1. Tener Git instalado:
```bash
git --version
```

2. Tener una cuenta en GitHub:
- Ve a [github.com](https://github.com)
- Crea una cuenta si no tienes

3. Configurar Git (primera vez):
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

---

## 🏗️ Paso 1: Crear Repositorios en GitHub

### Opción A: Desde la Web (Recomendado)

1. Ve a [github.com/new](https://github.com/new)
2. Crea el primer repositorio:
   - **Nombre**: `heygen-avatar-server`
   - **Descripción**: "Backend para control de avatares HeyGen"
   - **Visibilidad**: Public o Private (tu elección)
   - **NO** marques "Initialize this repository with a README"
3. Haz clic en "Create repository"
4. **GUARDA la URL** que aparece (algo como `https://github.com/TU_USUARIO/heygen-avatar-server.git`)

5. Repite para el cliente:
   - **Nombre**: `heygen-avatar-client`
   - **Descripción**: "Frontend para visualización de avatares HeyGen"
   - **Guarda la URL también**

### Opción B: Desde la Terminal (Avanzado)

Si tienes GitHub CLI instalado:

```bash
# Instalar GitHub CLI (si no lo tienes)
# Mac: brew install gh
# Windows: winget install GitHub.cli
# Linux: consulta https://cli.github.com/

# Login
gh auth login

# Crear repositorios
gh repo create heygen-avatar-server --public --source=. --remote=origin
gh repo create heygen-avatar-client --public --source=. --remote=origin
```

---

## 📤 Paso 2: Subir el Servidor a GitHub

```bash
# 1. Navega al directorio del servidor
cd /mnt/user-data/outputs/heygen-demo/server

# 2. Inicializa Git
git init

# 3. Agrega todos los archivos
git add .

# 4. Verifica qué archivos se agregarán (opcional)
git status

# 5. Haz el primer commit
git commit -m "Initial server setup - HeyGen avatar control backend"

# 6. Renombra la rama a 'main' (GitHub usa 'main' por defecto)
git branch -M main

# 7. Agrega el repositorio remoto
# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/heygen-avatar-server.git

# 8. Sube el código a GitHub
git push -u origin main
```

### Si tienes error de autenticación:

GitHub requiere Personal Access Token (no acepta contraseña):

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click en "Generate new token (classic)"
3. Marca los scopes: `repo` (todos)
4. Copia el token generado
5. Cuando Git te pida contraseña, pega el token

---

## 📤 Paso 3: Subir el Cliente a GitHub

```bash
# 1. Navega al directorio del cliente
cd /mnt/user-data/outputs/heygen-demo/client

# 2. Inicializa Git
git init

# 3. Agrega todos los archivos
git add .

# 4. Primer commit
git commit -m "Initial client setup - HeyGen avatar visualization frontend"

# 5. Renombra la rama a 'main'
git branch -M main

# 6. Agrega el repositorio remoto
git remote add origin https://github.com/TU_USUARIO/heygen-avatar-client.git

# 7. Sube el código
git push -u origin main
```

---

## 🔄 Comandos para Actualizaciones

Una vez que hayas hecho el setup inicial, estos son los comandos para actualizar:

### Hacer cambios y subirlos

```bash
# 1. Verifica qué archivos cambiaron
git status

# 2. Agrega los cambios
git add .
# O agrega archivos específicos:
# git add src/index.ts

# 3. Haz commit con un mensaje descriptivo
git commit -m "Descripción del cambio"

# 4. Sube a GitHub
git push

# Render redesplegará automáticamente
```

### Ver historial

```bash
# Ver commits recientes
git log --oneline

# Ver últimos 5 commits
git log --oneline -5

# Ver cambios en detalle
git log -p
```

### Deshacer cambios

```bash
# Deshacer cambios en un archivo (antes de commit)
git checkout -- archivo.ts

# Deshacer último commit (manteniendo cambios)
git reset --soft HEAD~1

# Deshacer último commit (perdiendo cambios)
git reset --hard HEAD~1
```

---

## 🌿 Trabajar con Branches (Opcional)

Para desarrollo más organizado:

```bash
# Crear una nueva rama para una feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commits en esta rama
git add .
git commit -m "Agregar nueva funcionalidad"

# Volver a la rama main
git checkout main

# Fusionar los cambios
git merge feature/nueva-funcionalidad

# Subir a GitHub
git push
```

---

## 🔍 Verificar Conexión con GitHub

```bash
# Ver repositorios remotos configurados
git remote -v

# Debería mostrar:
# origin  https://github.com/TU_USUARIO/tu-repo.git (fetch)
# origin  https://github.com/TU_USUARIO/tu-repo.git (push)

# Ver el estado del repositorio
git status

# Ver ramas
git branch -a
```

---

## 🚨 Solución de Problemas

### Error: "fatal: not a git repository"

**Solución:**
```bash
# Asegúrate de estar en el directorio correcto
pwd

# Inicializa Git
git init
```

### Error: "remote origin already exists"

**Solución:**
```bash
# Elimina el remoto existente
git remote remove origin

# Agrega el nuevo
git remote add origin https://github.com/TU_USUARIO/tu-repo.git
```

### Error: "failed to push some refs"

**Causa:** El repositorio remoto tiene commits que no tienes localmente.

**Solución:**
```bash
# Opción 1: Pull primero (recomendado)
git pull origin main --rebase

# Luego push
git push origin main

# Opción 2: Forzar push (CUIDADO: sobrescribe el remoto)
git push -f origin main
```

### Error: Authentication failed

**Solución:**

1. Usa un Personal Access Token en lugar de contraseña
2. O configura SSH:

```bash
# Generar clave SSH
ssh-keygen -t ed25519 -C "tu@email.com"

# Agregar a GitHub
# 1. Copia la clave pública:
cat ~/.ssh/id_ed25519.pub

# 2. Ve a GitHub → Settings → SSH keys → New SSH key
# 3. Pega la clave

# 4. Cambia la URL del remoto a SSH
git remote set-url origin git@github.com:TU_USUARIO/tu-repo.git
```

---

## 📝 Buenas Prácticas de Commits

### Mensajes de Commit

Buenos ejemplos:
```bash
git commit -m "Add health check endpoint to server"
git commit -m "Fix CORS configuration for production"
git commit -m "Update avatar IDs in control panel"
git commit -m "Improve error handling in avatar view"
```

Malos ejemplos:
```bash
git commit -m "fix"
git commit -m "update"
git commit -m "asdf"
git commit -m "wip"
```

### Estructura de un Buen Mensaje

```bash
git commit -m "Tipo: Descripción corta

Explicación más detallada si es necesario.
- Punto clave 1
- Punto clave 2"
```

Tipos comunes:
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato, no afecta código
- `refactor:` Refactorización
- `test:` Agregar tests
- `chore:` Mantenimiento

---

## 🔐 Configurar .gitignore

Ya están incluidos, pero si necesitas agregar más:

```bash
# Edita .gitignore
echo "mi-archivo-secreto.txt" >> .gitignore

# Commit el cambio
git add .gitignore
git commit -m "Add file to gitignore"
```

**Archivos que NUNCA deben estar en Git:**
- `.env` (contiene secrets)
- `node_modules/` (se instalan con npm)
- `dist/` o `build/` (se generan)
- Archivos con contraseñas o API keys

---

## 🔄 Workflow Completo

Esto es lo que harás regularmente:

```bash
# 1. Hacer cambios en tu código
# (edita archivos en tu editor)

# 2. Ver qué cambió
git status

# 3. Agregar cambios
git add .

# 4. Commit
git commit -m "Descripción del cambio"

# 5. Push a GitHub
git push

# 6. Render detectará el push y redesplegará automáticamente
# (toma 2-5 minutos)

# 7. Verifica en los logs de Render que el deploy fue exitoso
```

---

## 📚 Recursos Adicionales

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Learn Git Branching](https://learngitbranching.js.org/)

---

## 🎯 Quick Reference

```bash
# Setup inicial
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin URL
git push -u origin main

# Workflow diario
git status
git add .
git commit -m "mensaje"
git push

# Ver historial
git log --oneline

# Deshacer
git reset --soft HEAD~1  # Último commit
git checkout -- archivo  # Cambios en archivo
```

---

**¡Ya estás listo para usar Git!** 🚀

Empieza con los comandos del **Paso 2** y **Paso 3** para subir tu código a GitHub.
