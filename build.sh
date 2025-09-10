#!/bin/bash

# Script de build para Netlify
echo "🚀 Iniciando build para Netlify..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Build del proyecto
echo "🔨 Construyendo proyecto..."
npm run build

# Verificar que el build se creó correctamente
if [ -d "build" ]; then
    echo "✅ Build completado exitosamente"
    echo "📁 Contenido del directorio build:"
    ls -la build/
else
    echo "❌ Error: No se pudo crear el directorio build"
    exit 1
fi

echo "🎉 Build listo para deploy en Netlify!"





