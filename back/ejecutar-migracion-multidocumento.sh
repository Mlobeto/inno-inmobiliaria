#!/bin/bash

# =========================================
# Script para ejecutar migraciones Fase 1
# Sistema Multi-documento y Multi-país
# =========================================

set -e  # Salir si hay error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración de base de datos (ajustar según tu .env)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inno_inmobiliaria}"
DB_USER="${DB_USER:-postgres}"
# DB_PASSWORD se lee del ambiente o se pregunta

echo -e "${GREEN}"
echo "========================================="
echo "  FASE 1: Migraciones Multi-documento  "
echo "========================================="
echo -e "${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -d "migrations" ]; then
  echo -e "${RED}Error: Debes ejecutar este script desde el directorio 'back/'${NC}"
  exit 1
fi

# Preguntar confirmación
echo -e "${YELLOW}Base de datos: ${DB_NAME}@${DB_HOST}:${DB_PORT}${NC}"
echo -e "${YELLOW}Usuario: ${DB_USER}${NC}"
echo ""
read -p "¿Continuar con las migraciones? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}Migraciones canceladas${NC}"
  exit 1
fi

# Pedir password si no está en ambiente
if [ -z "$DB_PASSWORD" ]; then
  read -sp "Password de PostgreSQL: " DB_PASSWORD
  echo
  export PGPASSWORD=$DB_PASSWORD
fi

# Función para ejecutar migración
run_migration() {
  local migration_file=$1
  local description=$2
  
  echo ""
  echo -e "${GREEN}▶ Ejecutando: ${description}${NC}"
  echo -e "${YELLOW}  Archivo: ${migration_file}${NC}"
  
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "migrations/${migration_file}" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Completada exitosamente${NC}"
    return 0
  else
    echo -e "${RED}  ✗ Error en la migración${NC}"
    echo -e "${RED}  Ejecutando con detalles...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "migrations/${migration_file}"
    return 1
  fi
}

# Backup de seguridad
echo ""
echo -e "${YELLOW}📦 Creando backup de seguridad...${NC}"
BACKUP_FILE="backup_before_multidoc_$(date +%Y%m%d_%H%M%S).sql"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "migrations/${BACKUP_FILE}"; then
  echo -e "${GREEN}✓ Backup creado: ${BACKUP_FILE}${NC}"
else
  echo -e "${RED}✗ Error creando backup. ¿Continuar de todas formas? (y/n)${NC}"
  read -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Ejecutar migraciones en orden
echo ""
echo -e "${GREEN}========================================="
echo "  Ejecutando migraciones..."
echo "=========================================${NC}"

run_migration "001-create-client-documents-table.sql" "Crear tabla client_documents"
run_migration "002-update-clients-for-migration.sql" "Actualizar tabla Clients"
run_migration "003-update-tenants-multi-country.sql" "Actualizar tabla tenants"
run_migration "004-migrate-existing-data.sql" "Migrar datos existentes"

# Resumen final
echo ""
echo -e "${GREEN}========================================="
echo "  ✓ TODAS LAS MIGRACIONES COMPLETADAS"
echo "=========================================${NC}"

# Mostrar estadísticas
echo ""
echo -e "${YELLOW}📊 Estadísticas de la base de datos:${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  'Tenants' AS tabla,
  COUNT(*) AS total,
  COUNT(DISTINCT country) AS paises,
  STRING_AGG(DISTINCT country, ', ') AS lista_paises
FROM tenants
UNION ALL
SELECT 
  'Clients' AS tabla,
  COUNT(*) AS total,
  SUM(CASE WHEN migrated_to_documents THEN 1 ELSE 0 END) AS migrados,
  CONCAT(
    ROUND(100.0 * SUM(CASE WHEN migrated_to_documents THEN 1 ELSE 0 END) / COUNT(*), 1),
    '%'
  ) AS porcentaje_migracion
FROM \"Clients\"
UNION ALL
SELECT 
  'Documents' AS tabla,
  COUNT(*) AS total,
  COUNT(DISTINCT document_code) AS tipos,
  STRING_AGG(DISTINCT document_code, ', ') AS lista_tipos
FROM client_documents;
"

# Verificación de integridad
echo ""
echo -e "${YELLOW}🔍 Verificando integridad de datos...${NC}"
INTEGRITY_CHECK=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) 
FROM \"Clients\" c
WHERE c.cuil IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM client_documents cd
    WHERE cd.client_id = c.\"idClient\"
      AND cd.document_code = 'CUIL'
  );
")

if [ "$INTEGRITY_CHECK" -eq 0 ]; then
  echo -e "${GREEN}✓ Integridad de datos verificada: Todos los CUILs tienen documentos${NC}"
else
  echo -e "${RED}✗ Advertencia: ${INTEGRITY_CHECK} clientes con CUIL sin documento migrado${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Proceso completado exitosamente!${NC}"
echo -e "${YELLOW}📝 Backup guardado en: migrations/${BACKUP_FILE}${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Verificar que la aplicación funciona correctamente"
echo "  2. Revisar los logs del backend"
echo "  3. Probar la creación de nuevos clientes"
echo "  4. Si todo funciona, eliminar el backup después de 1 semana"
echo ""
