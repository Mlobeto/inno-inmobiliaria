#!/bin/bash

# =====================================================
# SCRIPT PARA EJECUTAR TODAS LAS MIGRACIONES EN PRODUCCIÓN
# =====================================================
# Este script ejecuta todas las migraciones en orden correcto
# Uso: ./ejecutar-migraciones-produccion.sh

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# URL de conexión a Neon
DB_URL="postgresql://neondb_owner:npg_vxah23FfkesH@ep-dark-voice-adc9yj70-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo -e "${YELLOW}=======================================${NC}"
echo -e "${YELLOW}EJECUCIÓN DE MIGRACIONES EN PRODUCCIÓN${NC}"
echo -e "${YELLOW}=======================================${NC}"
echo ""

# Confirmar antes de proceder
read -p "¿Estás seguro de que quieres ejecutar las migraciones en PRODUCCIÓN? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Operación cancelada${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Iniciando migraciones...${NC}"
echo ""

# Función para ejecutar migración
run_migration() {
    local file=$1
    local name=$(basename "$file")
    
    echo -e "${YELLOW}Ejecutando: $name${NC}"
    
    if psql "$DB_URL" -f "$file"; then
        echo -e "${GREEN}✓ $name - OK${NC}"
        echo ""
    else
        echo -e "${RED}✗ $name - FALLÓ${NC}"
        echo -e "${RED}Deteniéndo ejecución de migraciones${NC}"
        exit 1
    fi
}

# Ejecutar migraciones en orden
cd migrations

# 1. Crear base de datos (si es necesario)
if [ -f "000-create-database-dev.sql" ]; then
    run_migration "000-create-database-dev.sql"
fi

# 2. Crear esquema principal
if [ -f "001-create-schema.sql" ]; then
    run_migration "001-create-schema.sql"
fi

# 3. Migración de renombrado tenant
if [ -f "002-rename-tenant-to-renter.sql" ]; then
    run_migration "002-rename-tenant-to-renter.sql"
fi

# 4. Company Settings
if [ -f "add-company-settings.sql" ]; then
    run_migration "add-company-settings.sql"
fi

# 5. Custom Content en Leases
if [ -f "add-custom-content-to-leases.sql" ]; then
    run_migration "add-custom-content-to-leases.sql"
fi

# 6. Fullname y email en admins
if [ -f "add-fullname-email-to-admins.sql" ]; then
    run_migration "add-fullname-email-to-admins.sql"
fi

# 7. Initial payment type
if [ -f "add-initial-payment-type.sql" ]; then
    run_migration "add-initial-payment-type.sql"
fi

# 8. Multitenant y subscripciones
if [ -f "add-multitenant-and-subscriptions.sql" ]; then
    run_migration "add-multitenant-and-subscriptions.sql"
fi

# 9. PDF Templates
if [ -f "add-pdf-templates.sql" ]; then
    run_migration "add-pdf-templates.sql"
fi

# 10. Property Images
if [ -f "add-property-images.sql" ]; then
    run_migration "add-property-images.sql"
fi

# 11. WhatsApp Template
if [ -f "add-whatsapp-template.sql" ]; then
    run_migration "add-whatsapp-template.sql"
fi

# 12. Soft delete
if [ -f "soft-delete-tables.sql" ]; then
    run_migration "soft-delete-tables.sql"
fi

# 13. Landing features
if [ -f "add-landing-features.sql" ]; then
    run_migration "add-landing-features.sql"
fi

# 14. Rented At
if [ -f "add-rented-at.sql" ]; then
    run_migration "add-rented-at.sql"
fi

echo ""
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}TODAS LAS MIGRACIONES COMPLETADAS${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""
echo -e "${YELLOW}Siguientes pasos:${NC}"
echo "1. Crear Platform Admin"
echo "2. Crear planes de suscripción"
echo "3. Crear tenant de prueba"
echo ""
