# 📤 Guía de Importación de Clientes con Insomnia

## 🎯 Pasos para Importar Clientes

### 1️⃣ Preparar el Backend

Asegúrate de que el servidor backend esté corriendo:

```bash
cd back
npm start
```

Deberías ver el mensaje:
```
🚀 listening on port: 3001 🚀
```

---

### 2️⃣ Importar la Colección en Insomnia

1. Abre **Insomnia**
2. Ve a **Application** → **Preferences** → **Data** → **Import Data**
3. Selecciona el archivo: `Insomnia_Collection_Importacion.json`
4. La colección **"QL Inmobiliaria - Importación"** aparecerá en tu workspace

---

### 3️⃣ Preparar el Archivo CSV

El archivo `clientes_a_importar.csv` ya está listo con el formato correcto:

```csv
cuil,name,email,direccion,ciudad,provincia,mobile,linkMaps
27-10917087-4,SUSANA DEL CARMEN ORTIZ DIAZ,susana.ortiz@gmail.com,Londres 123,Londres,Catamarca,3835482829,https://maps.app.goo.gl/example1
...
```

#### 📋 Campos Requeridos:
- ✅ **cuil** (obligatorio) - Formato: `xx-xxxxxxxx-x`
- ✅ **name** (obligatorio) - Nombre completo del cliente
- ✅ **email** (obligatorio) - Email válido
- ✅ **direccion** (obligatorio) - Dirección del cliente
- ✅ **mobile** (obligatorio) - Teléfono de 10 dígitos

#### 📋 Campos Opcionales:
- ⭕ **ciudad** - Ciudad del cliente
- ⭕ **provincia** - Provincia del cliente
- ⭕ **linkMaps** - Link de Google Maps (URL completa)

---

### 4️⃣ Usar Insomnia para Importar

#### **Opción A: Importar Clientes desde CSV**

1. En Insomnia, selecciona la request: **"Importar Clientes desde CSV"**
2. En la pestaña **Body**, verás un campo de tipo **file**
3. Haz clic en **Choose File** y selecciona `clientes_a_importar.csv`
4. Haz clic en **Send** (botón morado)

#### **Respuesta Exitosa:**

```json
{
  "success": true,
  "message": "Importación completada. 6 clientes procesados, 0 errores",
  "results": {
    "success": [
      {
        "row": 2,
        "client": {
          "id": 1,
          "name": "SUSANA DEL CARMEN ORTIZ DIAZ",
          "email": "susana.ortiz@gmail.com",
          "cuil": "27-10917087-4"
        }
      },
      // ... más clientes
    ],
    "errors": [],
    "summary": {
      "total": 6,
      "processed": 6,
      "failed": 0
    }
  }
}
```

#### **Respuesta con Errores:**

Si hay errores, verás algo como:

```json
{
  "success": true,
  "message": "Importación completada. 4 clientes procesados, 2 errores",
  "results": {
    "success": [ /* clientes exitosos */ ],
    "errors": [
      {
        "row": 3,
        "data": { /* datos del cliente */ },
        "errors": ["CUIL inválido o vacío"]
      },
      {
        "row": 5,
        "data": { /* datos del cliente */ },
        "errors": ["CUIL o email ya existe en el sistema"]
      }
    ],
    "summary": {
      "total": 6,
      "processed": 4,
      "failed": 2
    }
  }
}
```

---

### 5️⃣ Verificar la Importación

Usa la request **"Listar Todos los Clientes"** para verificar que los clientes se importaron correctamente:

1. Selecciona la request en Insomnia
2. Haz clic en **Send**
3. Verás todos los clientes en la base de datos

---

## 🔍 Otros Endpoints Útiles

### **Obtener Info de Plantillas**

Request: **"Obtener Info de Plantillas"**

Te devuelve información sobre los campos requeridos:

```json
{
  "success": true,
  "message": "Plantillas disponibles",
  "templates": {
    "clients": {
      "filename": "plantilla_clientes.xlsx",
      "description": "Plantilla para carga masiva de clientes",
      "requiredColumns": [
        "cuil (Formato: xx-xxxxxxxx-x)",
        "name (Texto)",
        "email (Email válido)",
        "direccion (Texto)",
        "ciudad (Texto, opcional)",
        "provincia (Texto, opcional)",
        "mobilePhone (10 dígitos)",
        "linkMaps (URL de Google Maps, opcional)"
      ]
    }
  }
}
```

---

## ⚠️ Validaciones Automáticas

El sistema valida automáticamente:

1. **CUIL:** 
   - Formato correcto (`xx-xxxxxxxx-x`)
   - Dígito verificador válido
   - No duplicado en la base de datos

2. **Email:**
   - Formato válido
   - No duplicado en la base de datos

3. **Teléfono:**
   - Exactamente 10 dígitos
   - Solo números

4. **Link de Google Maps:**
   - URL válida (si se proporciona)

---

## 📝 Ejemplos de Links de Google Maps Válidos

```
https://maps.app.goo.gl/ABC123
https://www.google.com/maps/place/...
https://goo.gl/maps/XYZ789
```

---

## 🐛 Solución de Problemas

### Error: "fetch failed" o "Connection refused"
- ✅ Verifica que el backend esté corriendo en `http://localhost:3001`

### Error: "CUIL inválido"
- ✅ Verifica el formato: `27-10917087-4`
- ✅ Asegúrate de que el dígito verificador sea correcto

### Error: "CUIL o email ya existe"
- ✅ El cliente ya está en la base de datos
- ✅ Usa un CUIL o email diferente

### Error: "Teléfono debe tener exactamente 10 dígitos"
- ✅ Formato correcto: `3835482829`
- ✅ Sin guiones, espacios o código de país

---

## 🎉 ¡Listo!

Ahora puedes importar clientes masivamente usando Insomnia. El campo `linkMaps` te permite guardar el enlace de Google Maps para cada cliente.
