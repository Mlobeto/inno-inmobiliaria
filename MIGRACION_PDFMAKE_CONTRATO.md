# Migración de jsPDF a pdfMake - ContratoAlquiler

## Fecha: ${new Date().toLocaleDateString('es-AR')}

## Motivo de la Migración
- **Problema**: jsPDF no permite justificar texto correctamente, generaba espaciado irregular entre palabras
- **Solución**: Migración a pdfMake, una librería con soporte nativo para justificación de texto

## Cambios Realizados

### 1. Instalación de Dependencias
```bash
npm install pdfmake
```

### 2. Archivo Modificado
- **Archivo**: `src/Components/PdfTemplates/ContratoAlquiler.jsx`
- **Backup creado**: `src/Components/PdfTemplates/ContratoAlquiler.backup.jsx`

### 3. Cambios Principales

#### Importaciones
**Antes (jsPDF):**
```javascript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../../utils/tahoma-normal';
```

**Después (pdfMake):**
```javascript
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;
```

#### Generación del PDF
- **Antes**: Usaba `jsPDF` con manejo manual de posiciones Y, saltos de página, y justificación problemática
- **Después**: Usa estructura de `docDefinition` de pdfMake con estilos predefinidos

#### Estilos Implementados
```javascript
const styles = {
  header: {
    fontSize: 11,
    bold: true,
    alignment: 'center',
    margin: [0, 0, 0, 10]
  },
  clauseTitle: {
    fontSize: 9,
    bold: true,
    margin: [0, 8, 0, 4]
  },
  body: {
    fontSize: 9,
    alignment: 'justify',  // ✅ JUSTIFICACIÓN NATIVA
    margin: [0, 0, 0, 6]
  },
  // ... más estilos
}
```

### 4. Ventajas de pdfMake

✅ **Justificación nativa**: No genera espacios irregulares entre palabras
✅ **Manejo automático de páginas**: No necesita calcular posiciones Y manualmente
✅ **Estructura declarativa**: Más fácil de mantener y modificar
✅ **Estilos reutilizables**: Código más limpio y organizado
✅ **Mejor tipografía**: Saltos de línea y espaciado más profesional

### 5. Funcionalidades Preservadas

✅ Título dinámico según tipo de propiedad (Comercial, Vivienda, etc.)
✅ Texto de partes con/sin socio
✅ 16 cláusulas del contrato completas
✅ Cláusulas dinámicas de garantes (múltiples)
✅ Inventario con formato de lista
✅ Líneas de firma para locador, locatario y garantes
✅ Formateo de fechas con corrección de zona horaria
✅ Conversión de números a letras en español
✅ Formateo de montos en pesos argentinos

### 6. Estructura del Documento

```
1. Título del contrato (centrado, negrita)
2. Texto de las partes (justificado)
3. Cláusulas 1-11 (título negrita + texto justificado)
4. Cláusulas de garantes (dinámicas según cantidad)
5. Cláusulas finales 13-16
6. Inventario (título + lista)
7. Líneas de firma (locador y locatario)
8. Líneas de firma de garantes (si existen)
```

### 7. Tamaño de Fuente y Espaciado
- **Título**: 11pt, negrita
- **Cláusulas (títulos)**: 9pt, negrita
- **Texto del cuerpo**: 9pt, justificado
- **Firmas**: 7pt, centrado
- **Márgenes de página**: 40pt todos los lados

### 8. Testing Requerido

🔲 Generar contrato con 1 garante
🔲 Generar contrato con múltiples garantes
🔲 Generar contrato sin garantes
🔲 Verificar justificación de texto (no debe tener espacios irregulares)
🔲 Verificar saltos de página automáticos
🔲 Verificar formateo de fechas
🔲 Verificar formateo de montos
🔲 Verificar inventario largo (múltiples líneas)
🔲 Verificar líneas de firma correctamente alineadas

### 9. Rollback (si es necesario)

Si se necesita volver a la versión anterior:
```bash
cd "C:/Users/merce/Desktop/QLInmobiliaria/QL Front"
rm src/Components/PdfTemplates/ContratoAlquiler.jsx
mv src/Components/PdfTemplates/ContratoAlquiler.backup.jsx src/Components/PdfTemplates/ContratoAlquiler.jsx
npm uninstall pdfmake
```

### 10. Notas Adicionales

- **Fuente**: pdfMake usa Roboto por defecto (fuente de buena calidad con soporte completo de español)
- **Compatibilidad**: Funciona en todos los navegadores modernos
- **Tamaño del bundle**: pdfMake es ~300KB más pesado que jsPDF, pero la mejora en calidad lo justifica
- **Eliminado**: Ya no se necesitan los archivos `Tahoma-normal.js` y `Tahoma-bold.js`

## Autor
GitHub Copilot

## Próximos Pasos
1. Probar la generación del PDF en el frontend
2. Verificar la calidad de justificación del texto
3. Si todo funciona correctamente, eliminar el archivo backup después de confirmar que no hay problemas
