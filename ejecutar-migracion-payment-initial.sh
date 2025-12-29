#!/bin/bash

# Script para ejecutar migración de tipo de pago inicial
# Asegúrate de tener configurada la variable de entorno DATABASE_URL

echo "🔧 Ejecutando migración: Tipo de pago inicial"
echo ""

cd "$(dirname "$0")/back/migrations"
node runMigrations.js

echo ""
echo "✅ Proceso completado"
