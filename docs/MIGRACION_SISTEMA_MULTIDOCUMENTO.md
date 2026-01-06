# 📋 Plan de Migración: Sistema Multi-documento LATAM

## 🎯 Objetivo

Transformar el sistema de un modelo **Argentina-específico** (CUIL/CUIT únicos) a un modelo **multi-país, multi-documento** que soporte:

- ✅ Múltiples tipos de documentos por cliente (identidad + fiscal)
- ✅ Documentos diferentes según país
- ✅ Requisitos dinámicos por tipo de contrato
- ✅ Compatibilidad hacia atrás con datos existentes

---

## 📊 Estado Actual vs Estado Objetivo

### Estado Actual (Argentina only)

**Tenant**:
```javascript
{
  tenantId: 1,
  businessName: "Inmobiliaria Test",
  cuit: "20-12345678-9",        // ❌ Solo CUIT, hardcodeado
  matricula: "12345",            // ❌ Campo único
  email: "test@inmo.com"
}
```

**Client**:
```javascript
{
  idClient: 1,
  cuil: "20-12345678-9",        // ❌ Solo CUIL, hardcodeado
  name: "Juan Pérez",
  email: "juan@test.com",
  direccion: "Av. Belgrano 123"
}
```

### Estado Objetivo (Multi-país)

**Tenant**:
```javascript
{
  tenantId: 1,
  country: "AR",                           // ✅ País
  businessName: "Inmobiliaria Test",
  companyDocument: "20-12345678-9",        // ✅ Genérico
  documentType: "CUIT",                    // ✅ Tipo explícito
  realEstateLicense: "12345",              // ✅ Nombre genérico
  licenseRequired: true,                   // ✅ Condicional
  countryConfig: { ... }                   // ✅ JSONB con configs
}
```

**Client**:
```javascript
{
  idClient: 1,
  tenantId: 1,
  name: "Juan Pérez",
  email: "juan@test.com",
  direccion: "Av. Belgrano 123",
  // ❌ Ya no más campo "cuil" único
}
```

**ClientDocument** (NUEVA TABLA):
```javascript
{
  documentId: 1,
  clientId: 1,
  tenantId: 1,
  documentType: "IDENTITY",               // IDENTITY, TAX, PROPERTY, INCOME, GUARANTEE
  country: "AR",
  documentCode: "CUIL",                   // CUIL, DNI, CPF, RUT, etc.
  number: "20-12345678-9",
  issuedBy: "ANSES",
  expiresAt: null,
  isPrimary: true,                        // Para mostrar en listados
  metadata: { ... }                       // JSONB para datos extras
}
```

---

## 🗃️ Diseño de Base de Datos

### Nueva tabla: `client_documents`

```sql
CREATE TABLE client_documents (
  document_id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES "Clients"("idClient") ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants("tenantId") ON DELETE CASCADE,
  
  -- Tipo de documento
  document_type VARCHAR(20) NOT NULL CHECK (
    document_type IN ('IDENTITY', 'TAX', 'PROPERTY', 'INCOME', 'GUARANTEE', 'OTHER')
  ),
  
  -- Identificación del documento
  country VARCHAR(2) NOT NULL,
  document_code VARCHAR(20) NOT NULL, -- CUIL, DNI, CPF, RUT, etc.
  number VARCHAR(50) NOT NULL,
  
  -- Información adicional
  issued_by VARCHAR(100),
  issued_at DATE,
  expires_at DATE,
  
  -- Control
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Metadata flexible
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  CONSTRAINT unique_client_document UNIQUE (client_id, document_type, document_code, number)
);

CREATE INDEX idx_client_documents_client ON client_documents(client_id);
CREATE INDEX idx_client_documents_tenant ON client_documents(tenant_id);
CREATE INDEX idx_client_documents_primary ON client_documents(client_id, is_primary);
```

### Modificación tabla `Clients`

```sql
-- Deprecar campo cuil (mantener por compatibilidad)
ALTER TABLE "Clients" 
  ALTER COLUMN cuil DROP NOT NULL,
  ADD COLUMN migrated_to_documents BOOLEAN DEFAULT FALSE;

-- Agregar comentarios
COMMENT ON COLUMN "Clients".cuil IS 'DEPRECATED: Use client_documents table instead';
COMMENT ON COLUMN "Clients".migrated_to_documents IS 'TRUE if cuil was migrated to client_documents';
```

### Modificación tabla `tenants`

```sql
-- Agregar campos de país y documentos genéricos
ALTER TABLE tenants
  ADD COLUMN country VARCHAR(2) DEFAULT 'AR' NOT NULL,
  ADD COLUMN company_document VARCHAR(50),
  ADD COLUMN document_type VARCHAR(20),
  ADD COLUMN real_estate_license VARCHAR(50),
  ADD COLUMN license_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN country_config JSONB DEFAULT '{}'::jsonb;

-- Migrar datos existentes
UPDATE tenants 
SET 
  company_document = cuit,
  document_type = 'CUIT',
  real_estate_license = matricula,
  license_required = TRUE
WHERE cuit IS NOT NULL;

-- Deprecar campos antiguos (mantener por compatibilidad)
COMMENT ON COLUMN tenants.cuit IS 'DEPRECATED: Use company_document field';
COMMENT ON COLUMN tenants.matricula IS 'DEPRECATED: Use real_estate_license field';
```

---

## 🔄 Estrategia de Migración (3 Fases)

### FASE 1: Preparación (Sin Breaking Changes) ✅

**Objetivo**: Agregar nuevas estructuras sin romper funcionalidad actual

1. ✅ Crear tabla `client_documents`
2. ✅ Agregar campos nuevos a `tenants` (country, company_document, etc.)
3. ✅ Migrar datos existentes:
   - `tenants.cuit` → `tenants.company_document`
   - `tenants.matricula` → `tenants.real_estate_license`
4. ✅ Mantener campos antiguos (`cuil`, `cuit`, `matricula`) funcionales
5. ✅ Agregar modelos Sequelize para `ClientDocument`

**Duración**: 1-2 días  
**Riesgo**: Bajo (no rompe nada)

---

### FASE 2: Migración Gradual (Coexistencia) 🔄

**Objetivo**: Sistema funciona con ambos esquemas simultáneamente

1. Crear script de migración de datos:
   ```sql
   -- Migrar todos los CUILs existentes a client_documents
   INSERT INTO client_documents (
     client_id, tenant_id, document_type, country, 
     document_code, number, is_primary
   )
   SELECT 
     "idClient",
     "tenantId",
     'TAX',
     'AR',
     'CUIL',
     cuil,
     TRUE
   FROM "Clients"
   WHERE cuil IS NOT NULL 
     AND migrated_to_documents = FALSE;
   
   UPDATE "Clients" SET migrated_to_documents = TRUE WHERE cuil IS NOT NULL;
   ```

2. Actualizar backend para **escribir en ambos lugares**:
   ```javascript
   // En createClient
   const newClient = await Client.create({ cuil, name, ... }); // Mantener
   await ClientDocument.create({                               // Nuevo
     clientId: newClient.idClient,
     tenantId,
     documentType: 'TAX',
     country: 'AR',
     documentCode: 'CUIL',
     number: cuil,
     isPrimary: true
   });
   ```

3. Actualizar frontend para **leer de ambos lugares**:
   ```javascript
   // Priorizar client_documents, fallback a cuil
   const primaryDoc = client.ClientDocuments?.find(d => d.isPrimary);
   const displayDocument = primaryDoc?.number || client.cuil;
   ```

**Duración**: 1 semana  
**Riesgo**: Medio (requiere testing exhaustivo)

---

### FASE 3: Limpieza (Deprecación Final) 🗑️

**Objetivo**: Eliminar campos antiguos y usar solo nuevo esquema

1. Verificar que todos los clientes tienen documentos migrados
2. Actualizar todos los formularios a nuevo esquema
3. Eliminar código que usa campos antiguos
4. Opcional: Eliminar columnas `cuil`, `cuit`, `matricula` (después de backup)

**Duración**: 3-5 días  
**Riesgo**: Alto (debe hacerse con mucha precaución)

---

## 📐 Modelos Sequelize

### ClientDocument.js (NUEVO)

```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('ClientDocument', {
    documentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'document_id'
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Clients', key: 'idClient' },
      field: 'client_id'
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'tenants', key: 'tenantId' },
      field: 'tenant_id'
    },
    documentType: {
      type: DataTypes.ENUM('IDENTITY', 'TAX', 'PROPERTY', 'INCOME', 'GUARANTEE', 'OTHER'),
      allowNull: false,
      field: 'document_type'
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    documentCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'document_code',
      comment: 'CUIL, DNI, CPF, RUT, RFC, etc.'
    },
    number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    issuedBy: {
      type: DataTypes.STRING(100),
      field: 'issued_by'
    },
    issuedAt: {
      type: DataTypes.DATEONLY,
      field: 'issued_at'
    },
    expiresAt: {
      type: DataTypes.DATEONLY,
      field: 'expires_at'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_primary'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'client_documents',
    underscored: true,
    indexes: [
      { fields: ['client_id'] },
      { fields: ['tenant_id'] },
      { fields: ['client_id', 'is_primary'] }
    ]
  });
};
```

---

## 🎨 Componentes Frontend

### DocumentInput.jsx (Genérico)

```jsx
import { getCountryConfig } from '@shared/constants';

const DocumentInput = ({ 
  country, 
  documentType = 'person', 
  value, 
  onChange, 
  onBlur 
}) => {
  const config = getCountryConfig(country);
  const docConfig = documentType === 'company' 
    ? config.documentTypes.company 
    : config.documentTypes.person.tax; // O .primary según caso
  
  return (
    <div>
      <label>{docConfig.label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={docConfig.placeholder}
        maxLength={docConfig.maxLength}
      />
      <small>{docConfig.helpText}</small>
    </div>
  );
};
```

### MultiDocumentForm.jsx (Para clientes)

```jsx
const MultiDocumentForm = ({ clientId, tenantCountry }) => {
  const [documents, setDocuments] = useState([]);
  
  const addDocument = (docType) => {
    setDocuments([...documents, {
      documentType: docType,
      country: tenantCountry,
      documentCode: '',
      number: '',
      isPrimary: documents.length === 0
    }]);
  };
  
  return (
    <div>
      <h3>Documentos del Cliente</h3>
      {documents.map((doc, idx) => (
        <DocumentInput 
          key={idx}
          country={doc.country}
          documentType={doc.documentType}
          value={doc.number}
          onChange={(e) => updateDocument(idx, 'number', e.target.value)}
        />
      ))}
      <button onClick={() => addDocument('TAX')}>+ Agregar documento fiscal</button>
      <button onClick={() => addDocument('IDENTITY')}>+ Agregar documento identidad</button>
    </div>
  );
};
```

---

## ✅ Checklist de Implementación

### FASE 1 (Esta semana)
- [ ] Crear migración SQL: `create-client-documents-table.sql`
- [ ] Crear migración SQL: `update-tenants-multi-country.sql`
- [ ] Crear modelo: `back/src/data/models/ClientDocument.js`
- [ ] Actualizar relaciones en `back/src/data/index.js`
- [ ] Ejecutar migraciones en development
- [ ] Verificar que sistema actual sigue funcionando

### FASE 2 (Próximas 2 semanas)
- [ ] Script de migración de datos existentes
- [ ] Actualizar `ClientController.createClient` para escribir en ambos
- [ ] Actualizar `ClientController.getAllClients` para leer de ambos
- [ ] Crear endpoint: `POST /api/client/:id/documents`
- [ ] Crear endpoint: `GET /api/client/:id/documents`
- [ ] Testing exhaustivo con datos migrados

### FASE 3 (Próximo mes)
- [ ] Componente `DocumentInput.jsx`
- [ ] Componente `MultiDocumentForm.jsx`
- [ ] Actualizar `Clientes.jsx` para usar nuevo sistema
- [ ] Deprecar uso de campo `cuil` en frontend
- [ ] Plan de comunicación a usuarios
- [ ] Eliminar campos antiguos (después de 3+ meses)

---

## 🔐 Validaciones por País

```javascript
// shared/src/utils/validateDocument.js
import { getCountryConfig } from '@shared/constants';

export const validateDocument = (number, documentCode, country) => {
  const config = getCountryConfig(country);
  
  // Buscar en person.primary, person.tax, company
  const docConfig = 
    config.documentTypes.person.primary?.type === documentCode ? config.documentTypes.person.primary :
    config.documentTypes.person.tax?.type === documentCode ? config.documentTypes.person.tax :
    config.documentTypes.company.type === documentCode ? config.documentTypes.company :
    null;
  
  if (!docConfig) return { valid: false, error: 'Tipo de documento no válido para este país' };
  
  const isValid = docConfig.format.test(number);
  return {
    valid: isValid,
    error: isValid ? null : `Formato inválido. Use: ${docConfig.placeholder}`
  };
};
```

---

## 📊 Ejemplo de Uso Completo

### Backend: Crear cliente con múltiples documentos

```javascript
// POST /api/client
exports.createClient = async (req, res) => {
  const { tenantId } = req.user;
  const { name, email, documents } = req.body;
  
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Crear cliente
    const client = await Client.create({
      tenantId,
      name,
      email,
      // cuil: null, // Ya no requerido
      migrated_to_documents: true
    }, { transaction });
    
    // 2. Crear documentos
    for (const doc of documents) {
      await ClientDocument.create({
        clientId: client.idClient,
        tenantId,
        ...doc
      }, { transaction });
    }
    
    await transaction.commit();
    
    // 3. Devolver con documentos incluidos
    const clientWithDocs = await Client.findByPk(client.idClient, {
      include: [{ model: ClientDocument, as: 'documents' }]
    });
    
    res.status(201).json(clientWithDocs);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};
```

### Frontend: Formulario adaptado a país

```jsx
const ClientForm = () => {
  const tenant = useSelector(state => state.auth.tenant);
  const country = tenant.country || 'AR';
  
  const [documents, setDocuments] = useState([
    { documentType: 'TAX', country, documentCode: 'CUIL', number: '', isPrimary: true }
  ]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createClient({ name, email, documents });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <input name="email" />
      
      <h3>Documentos</h3>
      {documents.map((doc, idx) => (
        <DocumentInput 
          key={idx}
          country={doc.country}
          documentCode={doc.documentCode}
          value={doc.number}
          onChange={(val) => updateDoc(idx, val)}
        />
      ))}
    </form>
  );
};
```

---

## 🎯 Próximos Pasos Inmediatos

1. **Revisar este plan** y confirmar enfoque
2. **Ejecutar FASE 1** (crear tablas y migraciones)
3. **Testing en development** con datos de prueba
4. **Backup de producción** antes de cualquier cambio
5. **Comenzar FASE 2** gradualmente

---

**Fin del documento de migración**
