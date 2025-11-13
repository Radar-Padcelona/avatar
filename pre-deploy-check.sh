#!/bin/bash

echo "🔍 Verificación Pre-Deploy para Render"
echo "======================================"
echo ""

ERRORS=0

# Verificar archivos .env.example
echo "📝 Verificando archivos de ejemplo..."
if [ -f "server/.env.example" ]; then
    echo "✅ server/.env.example existe"
else
    echo "❌ server/.env.example NO existe"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "client/.env.example" ]; then
    echo "✅ client/.env.example existe"
else
    echo "❌ client/.env.example NO existe"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Verificar .gitignore
echo "🔒 Verificando archivos .gitignore..."
if grep -q "\.env" server/.gitignore 2>/dev/null; then
    echo "✅ server/.gitignore incluye .env"
else
    echo "❌ server/.gitignore NO protege .env"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "\.env" client/.gitignore 2>/dev/null; then
    echo "✅ client/.gitignore incluye .env"
else
    echo "❌ client/.gitignore NO protege .env"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Verificar que .env no esté en git
echo "🚨 Verificando que .env no esté trackeado en git..."
if git ls-files | grep -q "\.env$"; then
    echo "❌ ADVERTENCIA: Archivos .env están en git!"
    echo "   Ejecuta: git rm --cached server/.env client/.env"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Archivos .env NO están en git"
fi

echo ""

# Verificar scripts de build
echo "🔨 Verificando scripts de build..."
if grep -q '"build"' server/package.json; then
    echo "✅ server/package.json tiene script 'build'"
else
    echo "❌ server/package.json NO tiene script 'build'"
    ERRORS=$((ERRORS + 1))
fi

if grep -q '"build"' client/package.json; then
    echo "✅ client/package.json tiene script 'build'"
else
    echo "❌ client/package.json NO tiene script 'build'"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Verificar dependencias
echo "📦 Verificando dependencias críticas..."
if grep -q '@heygen/streaming-avatar' server/package.json; then
    echo "✅ Server tiene @heygen/streaming-avatar"
else
    echo "❌ Server NO tiene @heygen/streaming-avatar"
    ERRORS=$((ERRORS + 1))
fi

if grep -q '@heygen/streaming-avatar' client/package.json; then
    echo "✅ Client tiene @heygen/streaming-avatar"
else
    echo "❌ Client NO tiene @heygen/streaming-avatar"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "======================================"

if [ $ERRORS -eq 0 ]; then
    echo "✅ ¡Todo listo para deploy!"
    echo ""
    echo "Próximos pasos:"
    echo "1. git add ."
    echo "2. git commit -m 'Preparado para deploy'"
    echo "3. git push origin main"
    echo "4. Seguir las instrucciones en DEPLOY.md"
    exit 0
else
    echo "❌ Se encontraron $ERRORS errores"
    echo "Por favor corrígelos antes de hacer deploy"
    exit 1
fi
