#!/bin/bash
# Script para ejecutar migración de company settings

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Ejecutando migración: add-company-settings.sql${NC}"

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Construir connection string
if [ -n "$DB_DEPLOY" ]; then
    # Producción
    CONNECTION_STRING="$DB_DEPLOY"
else
    # Local
    CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo -e "${YELLOW}📡 Conectando a la base de datos...${NC}"

# Ejecutar migración
psql "$CONNECTION_STRING" -f migrations/add-company-settings.sql

# Verificar resultado
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migración ejecutada exitosamente${NC}"
    echo -e "${GREEN}📋 Nuevos campos agregados a admin_settings:${NC}"
    echo "   - company_name"
    echo "   - company_address"
    echo "   - company_phone"
    echo "   - company_email"
    echo "   - company_registration"
    echo "   - company_cuit"
    echo "   - company_logo_url"
    echo "   - contract_footer_text"
    echo "   - tenant_id (para futuro multi-tenant)"
    echo "   - additional_config (JSONB)"
else
    echo -e "${RED}❌ Error al ejecutar migración${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Verificando estructura...${NC}"
psql "$CONNECTION_STRING" -c "\d admin_settings"

echo -e "${GREEN}✅ Listo! Ahora puedes usar /company-settings en el frontend${NC}"
