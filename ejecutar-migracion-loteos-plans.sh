#!/bin/bash

# Script para activar feature "loteos" en planes professional, lifetime y agencia
# en la base de datos de producción (Neon PostgreSQL)

echo "🚀 Actualizando features de planes: loteos + leads..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: La variable DATABASE_URL no está definida."
  echo "   Exportala antes de correr este script:"
  echo "   export DATABASE_URL='postgresql://...'"
  exit 1
fi

psql "$DATABASE_URL" -f back/migrations/update-plans-add-loteos.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Planes actualizados exitosamente."
  echo "   Los tenants en plan professional, lifetime y agencia"
  echo "   verán el módulo 'Loteos' al recargar el navegador."
else
  echo "❌ Error ejecutando la migración"
  exit 1
fi
