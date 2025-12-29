# Instalación de Dependencias para Carga Masiva

## 📦 Dependencias necesarias

Para habilitar la funcionalidad de carga masiva, necesitas instalar las siguientes dependencias en el backend:

```bash
cd back
npm install xlsx multer
```

## 📋 Descripción de dependencias:

- **xlsx**: Librería para leer archivos Excel (.xlsx, .csv)
- **multer**: Middleware para manejar archivos multipart/form-data

## 🚀 Endpoints disponibles después de la instalación:

### 1. Importar Clientes
- **POST** `/api/import/clients`
- **Content-Type**: `multipart/form-data`
- **Field**: `file` (archivo Excel/CSV)

### 2. Importar Propiedades  
- **POST** `/api/import/properties`
- **Content-Type**: `multipart/form-data`
- **Field**: `file` (archivo Excel/CSV)

### 3. Obtener información de plantillas
- **GET** `/api/import/templates`

## 🔧 Uso desde el frontend:

```javascript
// Ejemplo de carga de clientes
const uploadClients = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/import/clients', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 📊 Respuesta del servidor:

```json
{
  "success": true,
  "message": "Importación completada. 45 clientes procesados, 2 errores",
  "results": {
    "success": [...],
    "errors": [...],
    "summary": {
      "total": 47,
      "processed": 45,
      "failed": 2
    }
  }
}
```