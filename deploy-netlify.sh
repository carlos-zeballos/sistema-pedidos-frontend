#!/bin/bash

# 🚀 Script de Deploy a Netlify
echo "🚀 DEPLOY A NETLIFY - SISTEMA DE PEDIDOS"
echo "========================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta este script desde la carpeta frontend."
    exit 1
fi

# 1. Verificar que Netlify CLI esté instalado
print_status "Verificando Netlify CLI..."
if ! command -v netlify &> /dev/null; then
    print_warning "Netlify CLI no está instalado. Instalando..."
    npm install -g netlify-cli
    if [ $? -eq 0 ]; then
        print_success "Netlify CLI instalado exitosamente"
    else
        print_error "Error al instalar Netlify CLI"
        exit 1
    fi
else
    print_success "Netlify CLI ya está instalado"
fi

# 2. Build del proyecto
print_status "Construyendo proyecto..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completado exitosamente"
else
    print_error "Error al construir el proyecto"
    exit 1
fi

# 3. Verificar que el directorio build existe
if [ -d "build" ]; then
    print_success "Directorio build creado correctamente"
    print_status "Contenido del build:"
    ls -la build/
else
    print_error "No se encontró el directorio build"
    exit 1
fi

# 4. Deploy a Netlify
print_status "Iniciando deploy a Netlify..."
print_warning "Asegúrate de haber configurado las variables de entorno en Netlify:"
print_warning "- REACT_APP_API_URL"
print_warning "- REACT_APP_ENVIRONMENT"
print_warning "- REACT_APP_VERSION"

# Deploy con drag & drop (más fácil)
print_status "Para deploy con drag & drop:"
print_status "1. Ve a https://app.netlify.com/drop"
print_status "2. Arrastra la carpeta 'build' a la zona de deploy"
print_status "3. ¡Listo! Tu sitio estará disponible"

# Deploy con CLI (alternativa)
print_status "Para deploy con CLI:"
print_status "1. Ejecuta: netlify login"
print_status "2. Ejecuta: netlify deploy --prod --dir=build"

echo ""
print_success "🎉 PROYECTO LISTO PARA DEPLOY EN NETLIFY"
echo "=============================================="
print_status "Archivos de configuración creados:"
print_status "✅ netlify.toml - Configuración principal"
print_status "✅ _redirects - Redirecciones para SPA"
print_status "✅ build.sh - Script de build"
print_status "✅ build/ - Directorio listo para deploy"
echo ""
print_warning "PRÓXIMOS PASOS:"
echo "1. Ve a https://netlify.com y crea una cuenta"
echo "2. Arrastra la carpeta 'build' a https://app.netlify.com/drop"
echo "3. Configura las variables de entorno en Netlify"
echo "4. ¡Tu sitio estará disponible!"
echo ""
print_status "Para más detalles, revisa el archivo INSTRUCCIONES-NETLIFY.md"








