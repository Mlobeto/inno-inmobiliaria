-- Script para crear nueva base de datos de DESARROLLO
-- NO afecta la BD de producción

-- Conectarse a PostgreSQL como superusuario primero:
-- psql -U postgres

-- 1. Crear nueva base de datos
DROP DATABASE IF EXISTS "InnoInmobiliaria_Dev";
CREATE DATABASE "InnoInmobiliaria_Dev"
  WITH 
  OWNER = postgres
  ENCODING = 'UTF8'
  CONNECTION LIMIT = -1;

\c "InnoInmobiliaria_Dev"

-- 2. Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

COMMENT ON DATABASE "InnoInmobiliaria_Dev" IS 'Base de datos de DESARROLLO para InnoInmobiliaria v2.0 (Multi-Tenant SaaS)';

-- 3. Crear schema básico
CREATE SCHEMA IF NOT EXISTS public;

\echo '✅ Base de datos InnoInmobiliaria_Dev creada exitosamente'
\echo '📋 Próximo paso: Ejecutar create-schema.sql para crear las tablas'
