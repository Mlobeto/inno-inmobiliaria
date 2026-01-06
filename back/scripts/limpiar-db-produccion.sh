#!/bin/bash

# =====================================================
# SCRIPT RÁPIDO: LIMPIAR Y RECREAR BASE DE DATOS
# =====================================================

DB_URL="postgresql://neondb_owner:npg_vxah23FfkesH@ep-dark-voice-adc9yj70-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "🔥 LIMPIANDO BASE DE DATOS DE PRODUCCIÓN..."
echo ""

# 1. Limpiar base de datos
psql "$DB_URL" << 'EOF'
-- Desactivar foreign keys
SET session_replication_role = 'replica';

-- Eliminar todas las tablas
DROP TABLE IF EXISTS "ClientDocuments" CASCADE;
DROP TABLE IF EXISTS "ClientProperties" CASCADE;
DROP TABLE IF EXISTS "PropertyImages" CASCADE;
DROP TABLE IF EXISTS "Garantors" CASCADE;
DROP TABLE IF EXISTS "PaymentReceipts" CASCADE;
DROP TABLE IF EXISTS "RentUpdates" CASCADE;
DROP TABLE IF EXISTS "Leases" CASCADE;
DROP TABLE IF EXISTS "Clients" CASCADE;
DROP TABLE IF EXISTS "Property" CASCADE;
DROP TABLE IF EXISTS "PdfTemplates" CASCADE;
DROP TABLE IF EXISTS "Subscriptions" CASCADE;
DROP TABLE IF EXISTS "Plans" CASCADE;
DROP TABLE IF EXISTS "AdminSettings" CASCADE;
DROP TABLE IF EXISTS "Admin" CASCADE;
DROP TABLE IF EXISTS "Tenants" CASCADE;

-- Reactivar foreign keys
SET session_replication_role = 'origin';

SELECT 'Base de datos limpiada ✓' as status;
EOF

echo ""
echo "✅ Base de datos limpiada"
echo ""
echo "📝 Ahora ejecuta las migraciones:"
echo "   bash ejecutar-migraciones-produccion.sh"
echo ""
