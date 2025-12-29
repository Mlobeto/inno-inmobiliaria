#!/bin/bash

# Script para ejecutar migración en Neon PostgreSQL (Vercel)
# Asegúrate de tener la variable DATABASE_URL configurada

echo "🚀 Ejecutando migración: add-custom-content-to-leases"

# Obtener DATABASE_URL desde Vercel
echo "📡 Conectándose a Neon PostgreSQL..."

# Ejecutar migración
psql "$DATABASE_URL" -f back/migrations/add-custom-content-to-leases.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración ejecutada exitosamente!"
    echo "✅ Columna 'customContent' agregada a tabla Leases"
else
    echo "❌ Error ejecutando la migración"
    exit 1
fi

echo ""
echo "🔍 Verificando que la columna existe..."
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Leases' AND column_name = 'customContent';"

echo ""
echo "✅ Proceso completado"
