#!/bin/bash
# Migración: agregar propertyPurpose a pdf_templates

cd "$(dirname "$0")"

# Cargar variables de entorno
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL no está definida. Verifica tu archivo .env"
  exit 1
fi

node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.connect().then(async client => {
  const sql = fs.readFileSync('./migrations/add-property-purpose-to-pdf-templates.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Migración add-property-purpose-to-pdf-templates ejecutada correctamente');
  client.release();
  pool.end();
}).catch(e => {
  console.error('❌ Error al ejecutar migración:', e.message);
  pool.end();
  process.exit(1);
});
"
