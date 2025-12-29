# Sistema de Editor de Contratos - Documentación Completa

## 🎯 Descripción
Sistema completo para editar contratos de alquiler con un editor tipo Word (TinyMCE) y exportar a PDF preservando el contenido editado.

---

## 📋 Cambios Implementados

### Backend

#### 1. Modelo de Datos - `back/src/data/models/Lease.js`
```javascript
customContent: {
  type: DataTypes.TEXT,
  allowNull: true,
  comment: 'Contenido HTML personalizado del contrato editado manualmente'
}
```

#### 2. Migración SQL - `back/migrations/add-custom-content-to-leases.sql`
```sql
ALTER TABLE "Leases" 
ADD COLUMN IF NOT EXISTS "customContent" TEXT;
```

**⚠️ IMPORTANTE**: Ejecutar esta migración en producción (Render):
```bash
# Conectarse a la BD de producción y ejecutar:
psql -h <host> -U <user> -d <database> -f back/migrations/add-custom-content-to-leases.sql
```

#### 3. Controller - `back/src/controllers/LeaseController.js`
- La función `updateLease` ya acepta cualquier campo en `updateData`, incluyendo `customContent`
- No requiere cambios adicionales

---

### Frontend

#### 1. Nuevo Componente - `QL Front/src/Components/Contratos/ContratoEditor.jsx`
**Funcionalidad:**
- Modal con editor TinyMCE
- Carga automática del contrato (HTML generado o customContent guardado)
- Botones: Guardar, Cancelar, Restaurar Original
- Guarda el HTML editado en `lease.customContent`

**Props:**
- `lease`: objeto con datos del contrato
- `onClose`: callback al cerrar el modal

**Tecnología:**
- TinyMCE con plugins completos
- SweetAlert2 para confirmaciones
- Redux para guardar cambios

#### 2. Nueva Utility - `QL Front/src/utils/generarHTMLContrato.js`
**Funcionalidad:**
- Convierte un objeto `lease` a HTML completo
- Estilos CSS inline para mejor renderizado
- Funciones auxiliares: formateo de fechas, montos, números a letras

**Exporta:**
```javascript
export const generarHTMLContrato = (lease) => { /* ... */ }
```

#### 3. Componente Modificado - `QL Front/src/Components/Contratos/EstadoContratos.jsx`
**Cambios:**
1. Import del nuevo componente:
   ```javascript
   import ContratoEditor from "./ContratoEditor";
   import { IoCreateOutline } from 'react-icons/io5';
   ```

2. Nuevo estado:
   ```javascript
   const [editorLease, setEditorLease] = useState(null);
   ```

3. Nuevos handlers:
   ```javascript
   const handleEditContract = (lease) => setEditorLease(lease);
   const handleCloseEditor = async () => {
     setEditorLease(null);
     await fetchLeases(); // Recargar
   };
   ```

4. Nuevo botón en la UI (columna de acciones):
   ```javascript
   <button
     onClick={() => handleEditContract(lease)}
     className="p-2 text-purple-600 hover:text-purple-800 transition-colors duration-200"
     title="Editar Contrato"
   >
     <IoCreateOutline className="w-5 h-5" />
   </button>
   ```

5. Modal al final del componente:
   ```javascript
   {editorLease && (
     <ContratoEditor lease={editorLease} onClose={handleCloseEditor} />
   )}
   ```

#### 4. PDF Generator Modificado - `QL Front/src/Components/PdfTemplates/ContratoAlquiler.jsx`
**Cambios:**
1. Import de html2canvas:
   ```javascript
   import html2canvas from 'html2canvas';
   ```

2. Función `generatePdf()` ahora es `async`

3. Nueva lógica al inicio:
   ```javascript
   if (lease.customContent) {
     // Genera PDF desde HTML editado usando html2canvas
     // Convierte HTML → Canvas → PDF
     // Maneja múltiples páginas automáticamente
   }
   // Si no hay customContent, usa generación estándar con jsPDF
   ```

**Flujo HTML → PDF:**
1. Crea div temporal con el HTML editado
2. Usa html2canvas para convertir a imagen
3. Inserta imagen en jsPDF
4. Calcula y agrega páginas adicionales si es necesario
5. Guarda con nombre: `Contrato_{Nombre}_{Fecha}.pdf`

---

## 🔄 Flujo de Trabajo Completo

### Usuario sin ediciones (flujo normal)
```
1. Usuario crea contrato → BD guarda datos
2. Usuario click "Descargar PDF" → jsPDF genera PDF estándar
3. PDF descargado
```

### Usuario con ediciones (nuevo flujo)
```
1. Usuario crea contrato → BD guarda datos
2. Usuario click "Editar Contrato" (ícono púrpura) → Modal con TinyMCE
3. TinyMCE carga:
   - Si existe lease.customContent → lo carga
   - Si no existe → generarHTMLContrato(lease)
4. Usuario edita el contrato en el editor
5. Usuario click "Guardar" → dispatch(updateLease(id, { customContent: html }))
6. Backend guarda en BD
7. Usuario click "Descargar PDF" → ContratoAlquiler detecta customContent
8. html2canvas convierte HTML → Canvas → PDF
9. PDF descargado con ediciones
```

---

## 📦 Dependencias Instaladas

### Backend
Ninguna nueva (usa Sequelize existente)

### Frontend
```json
{
  "@tinymce/tinymce-react": "^5.2.1",
  "html2canvas": "^1.4.1"
}
```

**Instalación:**
```bash
cd "QL Front"
npm install @tinymce/tinymce-react html2canvas
```

---

## 🎨 UI/UX

### Botón "Editar Contrato"
- **Ubicación**: Columna de acciones en EstadoContratos
- **Ícono**: IoCreateOutline (lápiz)
- **Color**: Púrpura (#9333EA)
- **Hover**: Púrpura oscuro (#7E22CE)

### Modal del Editor
- **Tamaño**: Grande (max-w-7xl)
- **Altura editor**: 500px
- **Toolbar**: Completo (negrita, cursiva, listas, alineación, fuentes, etc.)
- **Idioma**: Español
- **Botones**:
  - ✅ Guardar Cambios (verde)
  - ❌ Cancelar (gris)
  - 🔄 Restaurar Original (amarillo con confirmación)

---

## 🔍 Características Técnicas

### TinyMCE Configuration
```javascript
plugins: [
  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 
  'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 
  'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'
]

toolbar: 'undo redo | blocks | bold italic forecolor | 
         alignleft aligncenter alignright alignjustify | 
         bullist numlist outdent indent | removeformat | help'
```

### HTML→PDF Process
1. **Preparación**: Crea div oculto con HTML
2. **Dimensiones**: 210mm (A4 width) + 20mm padding
3. **Conversión**: html2canvas con scale:2 para HD
4. **Paginación**: Automática si contenido excede altura A4
5. **Limpieza**: Remueve div temporal después de conversión

### Formato del HTML Generado
- **Encabezado**: Título dinámico (VIVIENDA vs LOCAL COMERCIAL)
- **Fecha**: Formato argentino
- **Partes**: Nombres en negrita
- **Cláusulas**: 5 principales con títulos destacados
- **Inventario**: Lista con bullets
- **Garantes**: Si existen
- **Firmas**: Líneas y espacios

---

## ⚙️ Configuración de Producción

### 1. Ejecutar Migración SQL
```bash
# En Render PostgreSQL:
1. Ir a dashboard de Render
2. Abrir PostgreSQL database
3. Click en "Console" o usar cliente SQL
4. Ejecutar:
   ALTER TABLE "Leases" ADD COLUMN IF NOT EXISTS "customContent" TEXT;
```

### 2. Deploy Backend (si es necesario)
```bash
git add back/src/data/models/Lease.js back/migrations/
git commit -m "feat: Add customContent field to Lease model"
git push origin main
# Render auto-deploy
```

### 3. Deploy Frontend
```bash
git add "QL Front/src/Components/Contratos/"
git add "QL Front/src/utils/generarHTMLContrato.js"
git add "QL Front/src/Components/PdfTemplates/ContratoAlquiler.jsx"
git commit -m "feat: Add contract editor with TinyMCE and HTML to PDF export"
git push origin main
# Vercel auto-deploy
```

---

## 🧪 Testing Manual

### Test 1: Editor Básico
1. Ir a "Estado de Contratos"
2. Click en ícono púrpura de un contrato
3. Verificar que se abre modal con TinyMCE
4. Verificar que el contrato se carga correctamente
5. Editar texto (agregar palabra)
6. Click "Guardar Cambios"
7. Verificar SweetAlert de éxito
8. Recargar página y verificar que cambio persiste

### Test 2: Exportación PDF con Edición
1. Editar un contrato (agregar "TEXTO DE PRUEBA" en alguna parte)
2. Guardar cambios
3. Click "Descargar PDF"
4. Abrir PDF descargado
5. Verificar que "TEXTO DE PRUEBA" aparece en el PDF
6. Verificar que formato se mantiene

### Test 3: Restaurar Original
1. Editar contrato
2. Guardar cambios
3. Volver a abrir editor
4. Click "Restaurar Original"
5. Confirmar en SweetAlert
6. Verificar que vuelve al HTML original
7. Guardar
8. Descargar PDF y verificar que no tiene ediciones

### Test 4: PDF Sin Ediciones (flujo original)
1. Crear nuevo contrato sin editarlo
2. Click "Descargar PDF"
3. Verificar que PDF se genera correctamente con jsPDF
4. Verificar fuentes pequeñas (7pt)
5. Verificar cláusulas en negrita
6. Verificar título dinámico según typeProperty

---

## 🐛 Troubleshooting

### Error: "Cannot read property 'customContent' of undefined"
**Causa**: lease no tiene customContent
**Solución**: El código ya maneja esto con `lease.customContent || generarHTMLContrato(lease)`

### Error: PDF en blanco después de editar
**Causa**: html2canvas no renderizó correctamente
**Solución**: 
1. Verificar que el HTML en customContent es válido
2. Revisar console.log para errores de html2canvas
3. Aumentar timeout antes de generar canvas

### Error: Migración SQL falla
**Causa**: Columna ya existe
**Solución**: La migración usa `IF NOT EXISTS`, es safe ejecutarla múltiples veces

### Editor no carga contenido
**Causa**: generarHTMLContrato retorna undefined
**Solución**: Verificar que lease tiene todos los campos necesarios (Tenant, Landlord, Property)

---

## 📊 Estadísticas de Cambios

### Archivos Modificados
- ✅ 1 modelo (Lease.js)
- ✅ 1 controller (LeaseController.js - sin cambios, ya soportaba)
- ✅ 1 componente existente (EstadoContratos.jsx)
- ✅ 1 componente existente (ContratoAlquiler.jsx)

### Archivos Creados
- ✅ 1 migración SQL
- ✅ 1 componente nuevo (ContratoEditor.jsx)
- ✅ 1 utility nueva (generarHTMLContrato.js)

### Líneas de Código
- Backend: ~20 líneas (modelo + comentarios)
- Frontend: ~600 líneas (componente 250 + utility 200 + modificaciones 150)

---

## 🚀 Próximos Pasos Sugeridos

1. **Optimización**: Cachear HTML generado para evitar recalcular
2. **Versionado**: Guardar historial de ediciones en tabla separada
3. **Templates**: Permitir múltiples plantillas de contrato
4. **Preview**: Mostrar preview del PDF antes de descargar
5. **Colaboración**: Permitir comentarios en secciones del contrato
6. **Firma Digital**: Integrar firma electrónica en el PDF

---

## 📞 Soporte

Para dudas o problemas con el sistema de edición de contratos:
1. Revisar esta documentación
2. Verificar logs en console del navegador
3. Revisar logs de backend en Render
4. Ejecutar tests manuales descritos arriba

---

**Última actualización**: ${new Date().toLocaleDateString('es-AR')}
**Versión**: 1.0.0
**Estado**: ✅ Producción Ready (pendiente migración SQL)
