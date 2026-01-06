# FASE 1: Sistema Multi-documento - Instrucciones de Ejecución

## 📋 Resumen de Cambios

### Archivos Creados

#### Backend - Migraciones SQL
1. `back/migrations/001-create-client-documents-table.sql`
   - Crea tabla `client_documents`
   - Define ENUM `document_type_enum`
   - Crea índices para performance
   - Agrega trigger para `updated_at`

2. `back/migrations/002-update-clients-for-migration.sql`
   - Hace `cuil` campo nullable
   - Agrega campo `migrated_to_documents`
   - Prepara tabla Clients para coexistencia

3. `back/migrations/003-update-tenants-multi-country.sql`
   - Agrega campo `country` (código ISO)
   - Agrega `company_document` (genérico)
   - Agrega `real_estate_license`
   - Migra datos de `cuit` → `company_document`

4. `back/migrations/004-migrate-existing-data.sql`
   - Migra todos los CUILs a `client_documents`
   - Marca clientes como `migrated_to_documents = true`
   - Verifica integridad de datos

#### Backend - Modelos y Controladores
5. `back/src/data/models/ClientDocument.js`
   - Modelo Sequelize completo
   - Scopes: byTenant, primary, verified, byType
   - Métodos: verify(), setPrimary(), getPrimaryDocument()
   - Validación de formato por país

6. `back/src/controllers/ClientDocumentController.js`
   - CRUD completo para documentos
   - Endpoints: create, read, update, delete
   - Funciones especiales: verify, setPrimary
   - Validaciones y verificación de permisos

7. `back/src/routes/clientDocumentRoutes.js`
   - Rutas RESTful para documentos
   - Middlewares: authenticateToken + tenancyMiddleware

#### Scripts de Utilidad
8. `back/ejecutar-migracion-multidocumento.sh`
   - Script bash para ejecutar todas las migraciones
   - Crea backup automático antes de migrar
   - Verifica integridad de datos post-migración

### Archivos Modificados
9. `back/src/data/index.js`
   - Importa modelo ClientDocument
   - Define relaciones Client ↔ ClientDocument
   - Define relaciones Tenant ↔ ClientDocument

10. `back/src/routes/index.js`
    - Registra rutas de clientDocumentRoutes

---

## 🚀 Pasos de Ejecución

### Opción A: Ejecutar con Script Bash (Recomendado)

**En Git Bash o WSL:**

```bash
# 1. Navegar al directorio back
cd c:/Users/merce/Desktop/desarrollo/inno-Inmobiliaria/back

# 2. Dar permisos de ejecución al script
chmod +x ejecutar-migracion-multidocumento.sh

# 3. Configurar variables de entorno (opcional, sino usa .env)
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=inno_inmobiliaria
export DB_USER=postgres
# DB_PASSWORD se preguntará interactivamente

# 4. Ejecutar el script
./ejecutar-migracion-multidocumento.sh
```

**El script hará automáticamente:**
- ✅ Crear backup de seguridad
- ✅ Ejecutar las 4 migraciones en orden
- ✅ Verificar integridad de datos
- ✅ Mostrar estadísticas finales

---

### Opción B: Ejecutar Manualmente (PostgreSQL)

**En psql o PgAdmin:**

```bash
# 1. Conectar a la base de datos
psql -U postgres -d inno_inmobiliaria

# 2. Ejecutar migraciones en orden
\i C:/Users/merce/Desktop/desarrollo/inno-Inmobiliaria/back/migrations/001-create-client-documents-table.sql
\i C:/Users/merce/Desktop/desarrollo/inno-Inmobiliaria/back/migrations/002-update-clients-for-migration.sql
\i C:/Users/merce/Desktop/desarrollo/inno-Inmobiliaria/back/migrations/003-update-tenants-multi-country.sql
\i C:/Users/merce/Desktop/desarrollo/inno-Inmobiliaria/back/migrations/004-migrate-existing-data.sql

# 3. Verificar que todo se creó correctamente
\d client_documents
\d "Clients"
\d tenants

# 4. Ver estadísticas
SELECT COUNT(*) FROM client_documents;
SELECT COUNT(*) FROM "Clients" WHERE migrated_to_documents = true;
SELECT country, COUNT(*) FROM tenants GROUP BY country;
```

---

### Opción C: Ejecutar desde Node.js

**Crear script temporal `back/run-migrations.js`:**

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const migrations = [
  '001-create-client-documents-table.sql',
  '002-update-clients-for-migration.sql',
  '003-update-tenants-multi-country.sql',
  '004-migrate-existing-data.sql',
];

async function runMigrations() {
  for (const migration of migrations) {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations', migration),
      'utf8'
    );
    
    console.log(`\n🚀 Ejecutando: ${migration}`);
    
    try {
      await pool.query(sql);
      console.log(`✅ Completada: ${migration}`);
    } catch (error) {
      console.error(`❌ Error en ${migration}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ Todas las migraciones completadas!');
  pool.end();
}

runMigrations();
```

**Ejecutar:**
```bash
node back/run-migrations.js
```

---

## 🧪 Verificación Post-Migración

### 1. Verificar Estructura de Tablas

```sql
-- Ver estructura de client_documents
\d client_documents

-- Verificar ENUM creado
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'document_type_enum'::regtype
ORDER BY enumlabel;

-- Ver índices creados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'client_documents';
```

### 2. Verificar Datos Migrados

```sql
-- Contar clientes migrados
SELECT 
  COUNT(*) AS total_clients,
  SUM(CASE WHEN migrated_to_documents THEN 1 ELSE 0 END) AS migrated,
  SUM(CASE WHEN NOT migrated_to_documents THEN 1 ELSE 0 END) AS pending
FROM "Clients";

-- Ver documentos creados
SELECT 
  document_type,
  document_code,
  country,
  COUNT(*) AS total
FROM client_documents
GROUP BY document_type, document_code, country
ORDER BY document_type, document_code;

-- Ver ejemplos de clientes con documentos
SELECT 
  c."idClient",
  c.name,
  c.cuil AS old_cuil,
  cd.document_code,
  cd.number AS new_number,
  cd.is_primary
FROM "Clients" c
INNER JOIN client_documents cd ON cd.client_id = c."idClient"
LIMIT 10;
```

### 3. Verificar Integridad

```sql
-- Debe retornar 0 (todos los CUILs tienen documento)
SELECT COUNT(*) 
FROM "Clients" c
WHERE c.cuil IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM client_documents cd
    WHERE cd.client_id = c."idClient"
      AND cd.document_code = 'CUIL'
  );

-- Ver clientes sin documentos (deberían ser los que no tenían CUIL)
SELECT 
  c."idClient",
  c.name,
  c.cuil,
  COUNT(cd.document_id) AS doc_count
FROM "Clients" c
LEFT JOIN client_documents cd ON cd.client_id = c."idClient"
GROUP BY c."idClient", c.name, c.cuil
HAVING COUNT(cd.document_id) = 0;
```

### 4. Verificar Tenants

```sql
-- Ver configuración de tenants
SELECT 
  "tenantId",
  "businessName",
  country,
  cuit AS old_cuit,
  company_document AS new_company_doc,
  document_type,
  real_estate_license
FROM tenants
LIMIT 10;
```

---

## 🔄 Reiniciar Servidor Backend

Después de ejecutar las migraciones, reinicia el backend:

```bash
# Detener servidor actual (Ctrl+C)

# Reiniciar
cd c:/Users/merce/Desktop/desarrollo/inno-Inmobiliaria/back
npm run dev
```

**Verificar logs del servidor:**
```
✅ Conexión a base de datos establecida (desarrollo)
🚀 listening on port: 3001 🚀
```

**Verificar que el modelo ClientDocument se cargó:**
- El servidor debe iniciar sin errores
- No debe mostrar "Error al cargar modelo ClientDocument"

---

## 📡 Probar Endpoints de Documentos

### 1. Crear un documento nuevo

```bash
# Reemplaza {clientId} con un ID real de tu base de datos
# Reemplaza {token} con tu JWT del login

curl -X POST http://localhost:3001/api/client/1/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "documentType": "IDENTITY",
    "documentCode": "DNI",
    "number": "12345678",
    "country": "AR",
    "isPrimary": true,
    "issuedBy": "RENAPER"
  }'
```

**Respuesta esperada (201 Created):**
```json
{
  "message": "Documento creado exitosamente",
  "document": {
    "documentId": 1,
    "clientId": 1,
    "tenantId": 1,
    "documentType": "IDENTITY",
    "documentCode": "DNI",
    "number": "12345678",
    "country": "AR",
    "isPrimary": true,
    "issuedBy": "RENAPER",
    "isVerified": false,
    "createdAt": "2025-01-18T...",
    "updatedAt": "2025-01-18T..."
  }
}
```

### 2. Obtener todos los documentos de un cliente

```bash
curl -X GET http://localhost:3001/api/client/1/documents \
  -H "Authorization: Bearer {token}"
```

### 3. Marcar documento como verificado

```bash
curl -X PATCH http://localhost:3001/api/client/1/documents/1/verify \
  -H "Authorization: Bearer {token}"
```

### 4. Obtener documento primario

```bash
# Obtener documento TAX primario (debería ser el CUIL migrado)
curl -X GET http://localhost:3001/api/client/1/documents/primary/TAX \
  -H "Authorization: Bearer {token}"
```

---

## ⚠️ Problemas Comunes y Soluciones

### Error: "ENUM document_type_enum already exists"

**Causa:** Ya ejecutaste la migración 001 antes.

**Solución:**
```sql
-- Eliminar ENUM y tabla
DROP TABLE IF EXISTS client_documents CASCADE;
DROP TYPE IF EXISTS document_type_enum CASCADE;

-- Re-ejecutar migración 001
\i migrations/001-create-client-documents-table.sql
```

### Error: "Column cuil cannot be null"

**Causa:** La migración 002 no se ejecutó correctamente.

**Solución:**
```sql
-- Hacer cuil nullable manualmente
ALTER TABLE "Clients" ALTER COLUMN cuil DROP NOT NULL;
```

### Error: "Model ClientDocument not registered"

**Causa:** El servidor no detectó el modelo.

**Solución:**
1. Verificar que `ClientDocument.js` existe en `back/src/data/models/`
2. Reiniciar servidor con `npm run dev`
3. Revisar logs de errores al iniciar

### Error: "Cannot read property 'documents' of undefined"

**Causa:** Las relaciones no se cargaron correctamente.

**Solución:**
1. Verificar que las relaciones están en `back/src/data/index.js`
2. Reiniciar servidor

---

## 📊 Estadísticas Esperadas

Después de una migración exitosa:

```
Tabla: client_documents
- Filas: Igual al número de clientes con CUIL
- Tipos: Solo 'TAX' con document_code 'CUIL'

Tabla: Clients
- migrated_to_documents = true: Todos los que tenían CUIL
- cuil no null: Igual que antes (mantiene compatibilidad)

Tabla: tenants
- country: Todos 'AR' (Argentina)
- company_document: Igual a cuit
- document_type: 'CUIT'
```

---

## 🎯 Próximos Pasos (Fase 2)

Una vez verificado que Fase 1 funciona:

1. **Actualizar ClientController** para dual-write:
   - Al crear cliente, guardar CUIL en ambas tablas
   - Al leer cliente, preferir client_documents

2. **Crear componentes React**:
   - `DocumentInput.jsx` - Input con validación por país
   - `MultiDocumentForm.jsx` - Formulario multi-documento
   - `DocumentList.jsx` - Lista de documentos del cliente

3. **Actualizar formulario de clientes**:
   - Integrar multi-documento en creación/edición
   - Mostrar documentos en vista de detalle

4. **Testing completo**:
   - Crear cliente con múltiples documentos
   - Verificar aislamiento multitenant
   - Probar validaciones por país

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs del servidor**: `back/src/data/index.js` muestra errores de modelos
2. **Verifica la base de datos**: Usa queries SQL de la sección "Verificación"
3. **Backup**: El script bash crea backup automático antes de migrar
4. **Rollback**: Si algo falla, restaura desde el backup

**Comando de rollback:**
```bash
# Restaurar backup
psql -U postgres -d inno_inmobiliaria < migrations/backup_before_multidoc_YYYYMMDD_HHMMSS.sql
```

---

## ✅ Checklist de Ejecución

- [ ] Backup de base de datos creado
- [ ] Migración 001 ejecutada (tabla client_documents)
- [ ] Migración 002 ejecutada (Clients.cuil nullable)
- [ ] Migración 003 ejecutada (tenants.country)
- [ ] Migración 004 ejecutada (datos migrados)
- [ ] Integridad verificada (0 clientes sin documentos)
- [ ] Servidor backend reiniciado sin errores
- [ ] Endpoint POST /api/client/:id/documents probado
- [ ] Endpoint GET /api/client/:id/documents probado
- [ ] Documentos migrados visibles en queries

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu sistema está en **Fase 1: Coexistencia**.

El campo `cuil` sigue funcionando, pero ahora también tienes:
- ✅ Tabla `client_documents` para múltiples documentos
- ✅ Campo `country` en tenants para multi-país
- ✅ Endpoints REST para gestionar documentos
- ✅ Modelo Sequelize con validaciones
- ✅ Preparado para expansión LATAM

**Próximo objetivo:** Probar crear el primer cliente y verificar que todo funciona correctamente.
