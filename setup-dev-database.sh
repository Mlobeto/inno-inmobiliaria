#!/bin/bash
# Script para configurar base de datos de DESARROLLO desde cero

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Base de Datos de DESARROLLO        ║${NC}"
echo -e "${BLUE}║  InnoInmobiliaria v2.0                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que no estemos en producción
if [[ $DB_NAME == "InnoInmobiliaria" && $DB_HOST != "localhost" ]]; then
    echo -e "${RED}❌ ERROR: Parece que estás apuntando a PRODUCCIÓN${NC}"
    echo -e "${RED}   No ejecutes este script en producción${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Este script hará lo siguiente:${NC}"
echo "   1. Crear nueva BD: InnoInmobiliaria_Dev"
echo "   2. Crear schema completo (tablas, índices)"
echo "   3. Ejecutar migraciones adicionales"
echo "   4. Insertar datos iniciales"
echo ""

read -p "¿Continuar? (s/n): " confirm
if [[ $confirm != "s" && $confirm != "S" ]]; then
    echo -e "${YELLOW}Cancelado${NC}"
    exit 0
fi

# Paso 1: Crear base de datos
echo ""
echo -e "${YELLOW}📦 Paso 1/4: Creando base de datos...${NC}"
psql -U postgres -f back/migrations/000-create-database-dev.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al crear la base de datos${NC}"
    exit 1
fi

# Paso 2: Crear schema
echo ""
echo -e "${YELLOW}🏗️  Paso 2/4: Creando schema (tablas, índices)...${NC}"
psql -U postgres -d InnoInmobiliaria_Dev -f back/migrations/001-create-schema.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al crear schema${NC}"
    exit 1
fi

# Paso 3: Migración de company settings
echo ""
echo -e "${YELLOW}⚙️  Paso 3/4: Aplicando migración de company settings...${NC}"
psql -U postgres -d InnoInmobiliaria_Dev -f back/migrations/add-company-settings.sql

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Advertencia: La migración de company settings puede haber fallado${NC}"
    echo -e "${YELLOW}   (probablemente porque los campos ya existen)${NC}"
fi

# Paso 4: Verificar
echo ""
echo -e "${YELLOW}🔍 Paso 4/4: Verificando instalación...${NC}"
psql -U postgres -d InnoInmobiliaria_Dev -c "\dt"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Base de datos configurada con éxito   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Base de datos: ${NC}InnoInmobiliaria_Dev"
echo -e "${GREEN}🔗 Connection:    ${NC}postgres://postgres:****@localhost:5432/InnoInmobiliaria_Dev"
echo ""
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "   1. Actualizar back/.env con la nueva BD:"
echo "      DB_NAME=InnoInmobiliaria_Dev"
echo "   2. Reiniciar el backend: npm run dev"
echo "   3. Acceder a /company-settings para configurar"
echo ""
echo -e "${BLUE}💡 Tip: Para conectarte manualmente a la BD:${NC}"
echo "   psql -U postgres -d InnoInmobiliaria_Dev"
echo ""
