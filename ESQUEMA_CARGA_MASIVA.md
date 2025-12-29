# Esquema para Carga Masiva - Sistema Inmobiliario

## 📋 Esquemas de Excel para Importación Masiva

### 📊 1. CLIENTES - Archivo: `clientes_carga_masiva.xlsx`

#### Columnas requeridas (en este orden exacto):

| Columna | Nombre Campo | Tipo | Obligatorio | Descripción | Ejemplo |
|---------|-------------|------|-------------|-------------|---------|
| A | **cuil** | STRING | ✅ Sí | CUIL formato xx-xxxxxxxx-x | 20-12345678-9 |
| B | **name** | STRING | ✅ Sí | Nombre completo | Juan Pérez |
| C | **email** | STRING | ✅ Sí | Email válido | juan.perez@email.com |
| D | **direccion** | STRING | ✅ Sí | Dirección completa | Av. Libertador 1234 |
| E | **ciudad** | STRING | ❌ No | Ciudad | Buenos Aires |
| F | **provincia** | STRING | ❌ No | Provincia | Buenos Aires |
| G | **mobilePhone** | STRING | ✅ Sí | Teléfono (10 dígitos) | 1123456789 |

#### ⚠️ Validaciones importantes:
- **CUIL**: Formato exacto xx-xxxxxxxx-x con dígito verificador válido
- **Email**: Debe ser un email válido y único
- **Teléfono**: Exactamente 10 dígitos numéricos
- **CUIL**: Debe ser único en el sistema

---

### 🏠 2. PROPIEDADES - Archivo: `propiedades_carga_masiva.xlsx`

#### Columnas requeridas (en este orden exacto):

| Columna | Nombre Campo | Tipo | Obligatorio | Descripción | Valores Permitidos/Ejemplo |
|---------|-------------|------|-------------|-------------|---------------------------|
| A | **address** | STRING | ✅ Sí | Dirección de la propiedad | Av. Corrientes 1234 |
| B | **neighborhood** | STRING | ❌ No | Barrio | Palermo |
| C | **socio** | STRING | ❌ No | Socio propietario | María González |
| D | **city** | STRING | ❌ No | Ciudad | Buenos Aires |
| E | **type** | STRING | ✅ Sí | Tipo operación | `venta` o `alquiler` |
| F | **typeProperty** | STRING | ✅ Sí | Tipo de propiedad | Ver valores permitidos ⬇️ |
| G | **price** | NUMBER | ✅ Sí | Precio (sin puntos/comas) | 150000 |
| H | **rooms** | NUMBER | ❌ No | Cantidad de habitaciones | 3 |
| I | **comision** | NUMBER | ✅ Sí | Comisión (0-100) | 5.5 |
| J | **isAvailable** | BOOLEAN | ❌ No | Disponible | TRUE o FALSE |
| K | **description** | TEXT | ❌ No | Descripción detallada | Casa con jardín... |
| L | **escritura** | STRING | ✅ Sí | Tipo de escritura | Ver valores permitidos ⬇️ |
| M | **plantType** | STRING | ❌ No | Tipo de planta (solo fincas) | Soja |
| N | **plantQuantity** | NUMBER | ❌ No | Cantidad plantas (solo fincas) | 100 |
| O | **bathrooms** | NUMBER | ❌ No | Cantidad de baños | 2 |
| P | **highlights** | TEXT | ❌ No | Características destacadas | Pileta, quincho |
| Q | **inventory** | TEXT | ❌ No | Inventario | Muebles incluidos |
| R | **superficieCubierta** | STRING | ❌ No | Superficie cubierta | 120 m² |
| S | **superficieTotal** | STRING | ❌ No | Superficie total | 200 m² |

#### 🏘️ Valores permitidos para **typeProperty**:
- `casa`
- `departamento` 
- `duplex`
- `finca`
- `local`
- `oficina`
- `lote`
- `terreno`

#### 📄 Valores permitidos para **escritura**:
- `prescripcion en tramite`
- `escritura`
- `prescripcion adjudicada`
- `posesion`

---

## 📝 Ejemplos de Archivos Excel

### 🧑‍💼 Ejemplo CLIENTES:
```
CUIL               | Nombre        | Email              | Direccion         | Ciudad      | Provincia    | Telefono
20-12345678-9     | Juan Pérez    | juan@email.com     | Av. Libertador 123| Buenos Aires| Buenos Aires | 1123456789
27-87654321-4     | María García  | maria@email.com    | San Martín 456    | Rosario     | Santa Fe     | 3414567890
23-11223344-5     | Carlos López  | carlos@email.com   | Belgrano 789      | Córdoba     | Córdoba      | 3515678901
```

### 🏠 Ejemplo PROPIEDADES:
```
address           | neighborhood | type    | typeProperty | price  | rooms | comision | escritura
Av. Corrientes 123| Palermo      | venta   | casa         | 250000 | 3     | 3.5      | escritura
Rivadavia 456     | Flores       | alquiler| departamento | 45000  | 2     | 6.0      | prescripcion en tramite
San Martín 789    | Belgrano     | venta   | duplex       | 180000 | 4     | 4.0      | prescripcion adjudicada
```

---

## 🔧 Script de Importación

Una vez creados los archivos Excel, necesitarás:

1. **Dependencias a instalar en el backend:**
   ```bash
   npm install xlsx multer
   ```

2. **Ruta de carga:** `/api/upload/clients` y `/api/upload/properties`

3. **Formato de respuesta:**
   - ✅ Registros procesados exitosamente
   - ❌ Errores con detalles de validación
   - 📊 Resumen de importación

---

## 📋 Notas Importantes:

### ✅ Para un procesamiento exitoso:
- Usar exactamente los nombres de columna especificados
- Respetar el orden de las columnas
- No dejar filas vacías en el medio
- Verificar que los datos obligatorios estén completos
- Validar CUILs antes de cargar

### ⚠️ Limitaciones:
- Máximo 1000 registros por archivo
- Archivos Excel (.xlsx) únicamente
- Los emails deben ser únicos
- Los CUILs deben ser únicos
- Las imágenes se cargarán por separado

### 🎯 Recomendaciones:
- Hacer pruebas con pocos registros primero
- Mantener backup de datos existentes
- Revisar logs de importación para detectar errores
- Validar datos antes de la carga masiva

---

¿Te gustaría que implemente el script de importación completo?