#!/bin/bash

# =====================================================
# INICIALIZAR BASE DE DATOS DE PRODUCCIÓN
# =====================================================
# Este script:
# 1. Usa la configuración de .env.production
# 2. Arranca el servidor para que Sequelize cree las tablas
# 3. Ejecuta seeders para crear Platform Admin y Planes
# =====================================================

echo "🚀 Inicializando Base de Datos de Producción en Neon"
echo ""

# Verificar que existe .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production no encontrado"
    echo "   Crea el archivo .env.production con la configuración de Neon"
    exit 1
fi

# Backup del .env actual
if [ -f ".env" ]; then
    echo "📦 Haciendo backup de .env actual..."
    cp .env .env.backup
    echo "   Guardado en .env.backup"
fi

# Copiar configuración de producción
echo "⚙️  Usando configuración de producción..."
cp .env.production .env

echo ""
echo "📊 Configuración:"
grep "DB_HOST" .env
grep "DB_NAME" .env
echo ""

# Confirmar antes de proceder
read -p "¿Continuar con la inicialización? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Operación cancelada"
    # Restaurar .env original
    if [ -f ".env.backup" ]; then
        mv .env.backup .env
    fi
    exit 1
fi

echo ""
echo "🔧 Instalando dependencias..."
npm install

echo ""
echo "🏗️  Creando tablas con Sequelize..."
echo "   (El servidor arrancará y creará las tablas automáticamente)"
echo ""

# Ejecutar el servidor una vez para crear las tablas
# Sequelize sincronizará automáticamente
timeout 15s npm start || true

echo ""
echo "✅ Tablas creadas"
echo ""

# Ejecutar seeders para crear Platform Admin y Planes
echo "🌱 Ejecutando seeders..."
echo ""

# Verificar si existe el seeder de platform admin
if [ -f "src/seeders/platformAdminSeeder.js" ]; then
    node src/seeders/platformAdminSeeder.js
else
    echo "⚠️  Seeder de Platform Admin no encontrado"
    echo "   Deberás crear el Platform Admin manualmente"
fi

echo ""

# Verificar si existe el seeder de planes
if [ -f "src/seeders/plansSeeder.js" ]; then
    node src/seeders/plansSeeder.js
else
    echo "⚠️  Seeder de Planes no encontrado"
    echo "   Deberás crear los planes manualmente"
fi

echo ""
echo "======================================="
echo "✅ BASE DE DATOS INICIALIZADA"
echo "======================================="
echo ""
echo "📝 Próximos pasos:"
echo "1. Verifica que las tablas se crearon correctamente"
echo "2. Crea el Platform Admin si no existe"
echo "3. Crea los planes de suscripción"
echo "4. Prueba el login"
echo ""
echo "🔄 Para restaurar .env de desarrollo:"
echo "   mv .env.backup .env"
echo ""
