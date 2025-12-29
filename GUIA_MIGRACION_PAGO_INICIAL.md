# Guía para ejecutar la migración del tipo de pago inicial

## Cambios implementados

Se ha agregado un nuevo tipo de pago: **"Inicial Contrato Alquiler"**

### Características:
- **Tipo:** `initial` 
- **Uso:** Se cobra una sola vez al crear el contrato
- **Validación:** Solo se permite un pago inicial por contrato
- **Campos:** No requiere `installmentNumber` ni `totalInstallments`

## Archivos modificados

1. **back/src/data/models/PaymentReceipt.js**
   - Agregado tipo `"initial"` al ENUM
   - Campos `installmentNumber` y `totalInstallments` ahora son opcionales (nullable)

2. **back/src/controllers/PaymentController.js**
   - Validación para evitar múltiples pagos iniciales por contrato
   - Manejo del tipo `"initial"` sin campos de cuotas

3. **back/migrations/add-initial-payment-type.sql**
   - Migración SQL para actualizar la base de datos

## Ejecutar la migración

### Opción 1: Desde Render (Recomendado para producción)

1. Ve a tu dashboard de Render
2. Busca tu servicio de backend
3. Ve a la pestaña "Shell"
4. Ejecuta:
```bash
cd /opt/render/project/src/back/migrations
node runMigrations.js
```

### Opción 2: Desde terminal local (requiere acceso a la base de datos)

1. Configura la variable de entorno `DATABASE_URL`:
```bash
export DATABASE_URL="postgresql://usuario:password@host/database?sslmode=require"
```

2. Ejecuta el script:
```bash
bash ejecutar-migracion-payment-initial.sh
```

### Opción 3: Ejecutar SQL directamente en Neon

1. Ve a https://console.neon.tech
2. Selecciona tu proyecto
3. Ve a SQL Editor
4. Copia y pega el contenido de `back/migrations/add-initial-payment-type.sql`
5. Ejecuta el SQL

## Uso del nuevo tipo de pago

### Ejemplo de request POST /payment

```json
{
  "idClient": 123,
  "leaseId": 456,
  "paymentDate": "2025-11-15",
  "amount": 50000,
  "period": "Inicial - Noviembre 2025",
  "type": "initial"
}
```

### Validaciones:
- ✅ Solo un pago inicial por contrato
- ✅ No requiere `installmentNumber` ni `totalInstallments`
- ❌ Error si ya existe un pago inicial: "Ya existe un pago inicial para este contrato"

## Tipos de pago disponibles

| Tipo | Descripción | Requiere cuotas |
|------|-------------|-----------------|
| `installment` | Cuota mensual de alquiler | ✅ Sí |
| `commission` | Comisión inmobiliaria | ❌ No |
| `initial` | Pago inicial del contrato | ❌ No |

## Verificación post-migración

Después de ejecutar la migración, verifica:

```sql
-- Verificar tipos disponibles
SELECT e.enumlabel 
FROM pg_enum e 
JOIN pg_type t ON e.enumtid = t.oid 
WHERE t.typname = 'enum_PaymentReceipts_type';

-- Verificar campos opcionales
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'PaymentReceipts' 
  AND column_name IN ('installmentNumber', 'totalInstallments');
```

Resultado esperado:
- Tipos: `installment`, `commission`, `initial`
- `installmentNumber`: `YES` (nullable)
- `totalInstallments`: `YES` (nullable)
