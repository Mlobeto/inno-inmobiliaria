# 📊 Resumen: Documentos por País LATAM

## ✅ Configuración Actualizada

He actualizado la configuración de países con la información correcta que proporcionaste:

### 🔑 Distinción Importante

**Para Clientes (Personas Físicas)**:
- Pueden usar **documento de identidad** (DNI, Cédula, RG, etc.)
- O **documento fiscal/tributario** (CUIL, CPF, RUT, etc.)

**Para Inmobiliarias (Empresas)**:
- SIEMPRE usan **documento fiscal empresarial** (CUIT, CNPJ, RFC, etc.)

---

## 🇦🇷 ARGENTINA

### Personas
- **Documento público**: DNI (7-8 dígitos)
- **Documento fiscal**: CUIL (XX-XXXXXXXX-X)
- **Extranjeros**: CDI (para quienes operan fiscalmente)

### Empresas
- **CUIT** (XX-XXXXXXXX-X)

### Matrícula
- ✅ **OBLIGATORIA** - Colegio de Corredores Inmobiliarios (por provincia)

---

## 🇧🇷 BRASIL

### Personas
- **Documento público**: RG / Carteira de Identidade
- **Documento fiscal**: CPF (XXX.XXX.XXX-XX)

### Empresas
- **CNPJ** (XX.XXX.XXX/XXXX-XX)

### Matrícula
- ✅ **OBLIGATORIA** - CRECI (Conselho Regional de Corretores de Imóveis)

---

## 🇨🇱 CHILE

### Personas
- **Documento público**: RUN/DNI nacional
- **Documento fiscal**: RUT (normalmente mismo número que RUN)

### Empresas
- **RUT Empresa** (XX.XXX.XXX-X)

### Matrícula
- ❌ **NO OBLIGATORIA** - Registro voluntario

---

## 🇨🇴 COLOMBIA

### Personas
- **Documento público**: Cédula de Ciudadanía (CC)
- **Documento fiscal**: NIT (tax number)

### Empresas
- **NIT** (XXXXXXXXX-X)

### Matrícula
- ✅ **OBLIGATORIA** - Lonja de Propiedad Raíz

---

## 🇪🇨 ECUADOR

### Personas
- **Documento público**: Cédula de Identidad (CI) - 10 dígitos
- **Documento fiscal**: El CI también se usa como tax ID

### Empresas
- **RUC** (13 dígitos)

### Matrícula
- ❌ **NO OBLIGATORIA** - Registro opcional

---

## 🇲🇽 MÉXICO

### Personas
- **Documento público**: CURP / INE (para residentes)
- **Documento fiscal**: RFC (tax ID)

### Empresas
- **RFC** (AAA000000XXX)

### Matrícula
- ❌ **NO OBLIGATORIA** - Cédula Profesional (opcional)

---

## 🇵🇪 PERÚ

### Personas
- **Documento público**: DNI (8 dígitos)
- **Documento fiscal**: RUC (tax ID)

### Empresas
- **RUC** (11 dígitos)

### Matrícula
- ❌ **NO OBLIGATORIA** - Registro SUNARP (opcional)

---

## 🇺🇾 URUGUAY

### Personas
- **Documento público**: Cédula de Identidad
- **Documento fiscal**: RUT (tax number)

### Empresas
- **RUT** (12 dígitos)

### Matrícula
- ✅ **OBLIGATORIA** - Ministerio de Economía y Finanzas

---

## 🎯 Implementación en el Sistema

### Para el MVP (Argentina actual)

**Clientes**:
- Campo: `cuil` (aunque es mejor llamarlo `document`)
- Validación: XX-XXXXXXXX-X
- Aceptar: CUIL, DNI o CDI

**Inmobiliarias (Tenant)**:
- Campo: `cuit`
- Validación: XX-XXXXXXXX-X
- Solo CUIT para empresas

**Matrícula**:
- Campo: `matricula` (obligatorio)
- Validación: número
- Entidad: Colegio de Corredores (por provincia)

### Para Expansión Futura

**Modelo Client**:
```javascript
{
  document: String,          // El número del documento
  documentType: String,      // 'DNI', 'CUIL', 'CPF', 'RUT', etc.
  documentCountry: String,   // 'AR', 'BR', 'CL', etc.
  name: String,
  email: String,
  // ...
}
```

**Modelo Tenant**:
```javascript
{
  country: String,           // 'AR', 'BR', 'CL', etc.
  companyDocument: String,   // CUIT, CNPJ, RFC, etc.
  documentType: String,      // 'CUIT', 'CNPJ', 'RFC', etc.
  realEstateLicense: String, // Matrícula/CRECI/etc.
  licenseRequired: Boolean,  // Según país
  // ...
}
```

---

## 💡 Recomendaciones

### 🚀 Para Ahora (Fase 1 - Argentina)

1. ✅ Mantener campo `cuil` en clientes
2. ✅ Mantener campo `cuit` en tenants
3. ✅ Usar `PROVINCIAS_ARGENTINA` para dropdown
4. ✅ Validación específica para Argentina
5. ⚠️ **Importante**: Documentar que `cuil` puede aceptar DNI también

### 📋 Para Después (Fase 2 - Multi-país)

1. Renombrar `cuil` → `document` + agregar `documentType`
2. Agregar campo `country` a Tenant (migración ya creada)
3. Validación dinámica según país
4. Dropdown de provincias/estados según país
5. Campos de matrícula condicionales según país

### 🎨 UX Sugerido para Multi-país

**En Registro de Tenant**:
```
┌─────────────────────────────────────┐
│ Selecciona tu país                  │
│ ┌─────────────────────────────────┐ │
│ │ 🇦🇷 Argentina                   ▼│ │
│ └─────────────────────────────────┘ │
│                                     │
│ CUIT (Empresa)                      │
│ ┌─────────────────────────────────┐ │
│ │ XX-XXXXXXXX-X                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✅ Matrícula Obligatoria            │
│ Matrícula Inmobiliaria              │
│ ┌─────────────────────────────────┐ │
│ │ 12345                            │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**En Formulario de Cliente**:
```
┌─────────────────────────────────────┐
│ CUIL / DNI / CDI                    │
│ ┌─────────────────────────────────┐ │
│ │ XX-XXXXXXXX-X                    │ │
│ └─────────────────────────────────┘ │
│ 💡 Acepta CUIL, DNI o CDI           │
└─────────────────────────────────────┘
```

---

## 📁 Archivos Actualizados

1. ✅ **`shared/src/constants/countryConfigs.js`**
   - 8 países configurados (AR, BR, CL, CO, EC, MX, PE, UY)
   - Distinción entre documento público y fiscal
   - Información de matrícula por país
   - Formatos de teléfono, moneda, dirección

2. ✅ **`shared/src/constants/argentinLocations.js`**
   - 24 provincias de Argentina
   - Ciudades principales
   - Funciones helper

3. ✅ **`shared/src/constants/index.js`**
   - Exports centralizados para fácil importación

4. ✅ **`docs/PLAN_INTERNACIONALIZACION_LATAM.md`**
   - Plan completo de expansión
   - Investigación de requisitos
   - Estrategia por fases

5. ✅ **`back/migrations/add-country-to-tenants.sql`**
   - Migración lista para ejecutar
   - Agrega campo `country` a tenants

6. ✅ **`front/src/Components/Clientes/Clientes.jsx`**
   - Dropdown de provincias (en lugar de texto libre)
   - RTK Query para crear clientes
   - Validación CUIL

---

## 🎯 Próximos Pasos

### Inmediato (para probar MVP)
1. ✅ Iniciar backend y frontend
2. ✅ Probar formulario de clientes con dropdown de provincias
3. ✅ Verificar que CUIL valida correctamente
4. ✅ Crear primer cliente de prueba

### Corto plazo (cuando tengas tiempo)
1. Ejecutar migración `add-country-to-tenants.sql`
2. Agregar campo `country` defaultValue='AR' en frontend
3. Documentar que `cuil` acepta DNI también

### Largo plazo (cuando tengas demanda)
1. Implementar selector de país en registro
2. Validación dinámica por país
3. Campos condicionales según país
4. Consultoría legal por país

---

**Estado Actual**: Sistema listo para Argentina con estructura preparada para expansión LATAM 🚀
