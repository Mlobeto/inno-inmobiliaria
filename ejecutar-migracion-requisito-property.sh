#!/bin/bash

# Script para ejecutar migración en Neon PostgreSQL
# Asegúrate de tener la variable DATABASE_URL configurada

echo "🚀 Ejecutando migración: add-requisito-to-property"

echo "📡 Conectándose a Neon PostgreSQL..."

# Ejecutar migración
psql "$DATABASE_URL" -f back/migrations/add-requisito-to-property.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración ejecutada exitosamente!"
    echo "✅ Columna 'requisito' agregada a tabla Property"
else
    echo "❌ Error ejecutando la migración"
    exit 1
fi

echo ""
echo "🔍 Verificando que la columna existe..."
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Property' AND column_name = 'requisito';"

echo ""
echo "✅ Proceso completado"
