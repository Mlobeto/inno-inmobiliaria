# 📱 Funcionalidad de Plantilla WhatsApp para Propiedades

## 🎯 Descripción General

El sistema ahora incluye:
1. **Campo `whatsappTemplate`** editable en cada propiedad
2. **Campo `images`** para agregar imágenes desde el frontend (ya existía)
3. **Endpoint `/api/property/:id/whatsapp`** que genera el texto formateado listo para copiar

---

## 📋 Campos Agregados al Modelo Property

### 1. **whatsappTemplate** (TEXT, opcional)
Plantilla personalizable para cada propiedad con variables que se reemplazan automáticamente.

**Plantilla por Defecto:**
```
Gracias por ponerte en contacto con Quintero Lobeto Propiedades! Estamos encantados de poder ayudar. 

{descripcion}

Te comento que estamos en lanzamiento de ofertas y este es el primero!

Precio: AR$ {precio}
Ubicación: {direccion}

Estamos a tu entera disposición por dudas, precio o consultas.
```

### 2. **images** (ARRAY de STRING, opcional)
Array de URLs de imágenes que se pueden agregar desde el frontend.

**Ejemplo:**
```javascript
images: [
  "https://example.com/imagen1.jpg",
  "https://example.com/imagen2.jpg"
]
```

---

## 🔧 Variables Disponibles

Puedes usar estas variables en tu plantilla personalizada:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{precio}` | Precio formateado con separadores | AR$ 9.000.000 |
| `{direccion}` | Dirección completa | Londres 123 |
| `{ciudad}` | Ciudad | Londres |
| `{barrio}` | Barrio/Vecindario | Barrio El Canal |
| `{tipo}` | Tipo de propiedad | casa, lote, finca |
| `{tipoOperacion}` | Venta o Alquiler | venta |
| `{habitaciones}` | Número de habitaciones | 3 |
| `{baños}` | Número de baños | 2 |
| `{superficieTotal}` | Superficie total en m² | 500 |
| `{superficieCubierta}` | Superficie cubierta | 200 |
| `{descripcion}` | Descripción generada automáticamente | Casa en venta - 3 habitaciones, 2 baños |
| `{destacados}` | Características destacadas | Piscina, Quincho, Garaje |
| `{escritura}` | Estado de escritura | escritura, prescripcion en tramite |

---

## 🚀 Uso del Endpoint

### **GET** `/api/property/:id/whatsapp`

Obtiene el texto de WhatsApp formateado para una propiedad específica.

#### **Ejemplo de Request:**
```http
GET http://localhost:3001/api/property/1/whatsapp
```

#### **Ejemplo de Response:**
```json
{
  "success": true,
  "propertyId": 1,
  "address": "Londres 123",
  "whatsappText": "Gracias por ponerte en contacto con Quintero Lobeto Propiedades! Estamos encantados de poder ayudar. \n\nLote en venta en Barrio El Canal\n\nTe comento que estamos en lanzamiento de ofertas y este es el primero!\n\nPrecio: AR$ 9.000.000\nUbicación: Londres 123\n\nEstamos a tu entera disposición por dudas, precio o consultas.",
  "template": "Gracias por ponerte en contacto...",
  "availableVariables": [
    "{precio}", "{direccion}", "{ciudad}", "{barrio}",
    "{tipo}", "{tipoOperacion}", "{habitaciones}", "{baños}",
    "{superficieTotal}", "{superficieCubierta}", "{descripcion}",
    "{destacados}", "{escritura}"
  ]
}
```

---

## 📝 Ejemplos de Plantillas Personalizadas

### **Ejemplo 1: Lotes en Barrio El Canal**
```
Gracias por ponerte en contacto con Quintero Lobeto Propiedades! Estamos encantados de poder ayudar. 

Lotes en barrio el canal Londres Catamarca, ubicados a 800mts de la ruta nacional 40. 

Te comento que estamos en lanzamiento de ofertas en lotes y este es el primero!

📍 Ubicación: {direccion}
💰 Precio: {precio}
📐 Superficie: {superficieTotal}m²

Estamos a tu entera disposición por dudas, precio o consultas.
```

### **Ejemplo 2: Casa en Venta**
```
¡Hola! 👋 Gracias por contactar a Quintero Lobeto Propiedades.

🏠 {tipo} en {tipoOperacion}
📍 {direccion}, {ciudad}
🛏️ {habitaciones} habitaciones | 🚿 {baños} baños
📐 {superficieTotal}m² totales

💰 Precio: {precio}

✨ Destacados:
{destacados}

¿Te interesa agendar una visita? ¡Estamos para ayudarte!
```

### **Ejemplo 3: Finca Rural**
```
🌾 ¡Hermosa Finca en Venta!

Quintero Lobeto Propiedades te ofrece:

📍 {direccion}, {ciudad}
🌳 Tipo: {tipo}
📐 {superficieTotal}m²
💰 {precio}

📄 Documentación: {escritura}

Ideal para inversión o proyecto personal.
¡Consultanos sin compromiso!
```

---

## 🖼️ Manejo de Imágenes

### **Agregar Imágenes desde el Frontend**

Las imágenes se guardan en el campo `images` como un array de URLs.

**Ejemplo de Request (PUT):**
```http
PUT http://localhost:3001/api/property/1
Content-Type: application/json

{
  "images": [
    "https://cloudinary.com/imagen1.jpg",
    "https://cloudinary.com/imagen2.jpg",
    "https://cloudinary.com/imagen3.jpg"
  ]
}
```

---

## 💻 Integración con el Frontend

### **1. Obtener Texto de WhatsApp**

```javascript
const getWhatsAppText = async (propertyId) => {
  try {
    const response = await fetch(`http://localhost:3001/api/property/${propertyId}/whatsapp`);
    const data = await response.json();
    
    if (data.success) {
      return data.whatsappText;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### **2. Copiar al Portapapeles**

```javascript
const copyToClipboard = async (propertyId) => {
  const text = await getWhatsAppText(propertyId);
  
  try {
    await navigator.clipboard.writeText(text);
    alert('✅ Texto copiado! Ahora puedes pegarlo en WhatsApp');
  } catch (error) {
    console.error('Error al copiar:', error);
  }
};
```

### **3. Botón en el Listado de Propiedades**

```jsx
<button 
  onClick={() => copyToClipboard(property.propertyId)}
  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
>
  📋 Copiar para WhatsApp
</button>
```

### **4. Editar Plantilla Personalizada**

```jsx
const [whatsappTemplate, setWhatsappTemplate] = useState('');

const updateTemplate = async (propertyId, template) => {
  try {
    const response = await fetch(`http://localhost:3001/api/property/${propertyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        whatsappTemplate: template
      })
    });
    
    const data = await response.json();
    alert('✅ Plantilla actualizada!');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Componente
<div>
  <label>Plantilla de WhatsApp (usa variables como {precio}, {direccion})</label>
  <textarea
    value={whatsappTemplate}
    onChange={(e) => setWhatsappTemplate(e.target.value)}
    rows={10}
    className="w-full p-2 border rounded"
  />
  <button onClick={() => updateTemplate(propertyId, whatsappTemplate)}>
    Guardar Plantilla
  </button>
</div>
```

---

## 🔍 Características Especiales

### **1. Información Adicional por Tipo de Propiedad**

- **Fincas:** Automáticamente agrega info de plantas si existe
  ```
  Cultivo: Nogal - 500 plantas
  ```

- **Lotes:** Automáticamente agrega medidas
  ```
  Medidas: Frente 10m x Profundidad 30m
  ```

### **2. Formato de Precio**

El precio se formatea automáticamente con separadores de miles:
- `9000000` → `AR$ 9.000.000`
- `8200000` → `AR$ 8.200.000`

### **3. Descripción Automática**

Si usas `{descripcion}`, se genera automáticamente basada en los datos:
```
Casa en venta - 3 habitaciones, 2 baños, 200m² en Centro
```

---

## 📱 Flujo de Uso Recomendado

1. **Admin crea la propiedad** con todos los datos
2. **Admin personaliza la plantilla** (opcional) usando variables
3. **En el listado de propiedades**, hace clic en "Copiar para WhatsApp"
4. **El sistema genera el texto** reemplazando las variables
5. **El texto se copia al portapapeles**
6. **Admin pega directamente en WhatsApp** y envía al cliente

---

## 🎨 Ejemplo Completo de Integración Frontend

```jsx
import React, { useState } from 'react';
import { IoLogoWhatsapp, IoCopyOutline } from 'react-icons/io5';

const PropertyCard = ({ property }) => {
  const [copied, setCopied] = useState(false);

  const copyWhatsAppText = async () => {
    try {
      const response = await fetch(`/api/property/${property.propertyId}/whatsapp`);
      const data = await response.json();

      if (data.success) {
        await navigator.clipboard.writeText(data.whatsappText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al copiar el texto');
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow">
      <h3>{property.address}</h3>
      <p>Precio: AR$ {property.price.toLocaleString()}</p>
      
      <button
        onClick={copyWhatsAppText}
        className="mt-2 bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-600"
      >
        {copied ? (
          <>
            <IoCopyOutline /> ¡Copiado!
          </>
        ) : (
          <>
            <IoLogoWhatsapp /> Copiar para WhatsApp
          </>
        )}
      </button>
    </div>
  );
};

export default PropertyCard;
```

---

## ✅ Checklist de Implementación

- [x] Campo `whatsappTemplate` agregado al modelo Property
- [x] Campo `images` ya existía en el modelo
- [x] Función `getWhatsAppText` creada en PropertyController
- [x] Ruta `/api/property/:id/whatsapp` configurada
- [x] Variables dinámicas implementadas
- [x] Formato de precio con separadores
- [x] Información especial para fincas y lotes
- [ ] Componente React para copiar texto
- [ ] Componente React para editar plantilla
- [ ] Testing de la funcionalidad

---

## 🎉 ¡Listo para Usar!

Ahora puedes:
1. ✅ Agregar imágenes a las propiedades desde el frontend
2. ✅ Personalizar la plantilla de WhatsApp para cada propiedad
3. ✅ Copiar texto formateado con un solo clic
4. ✅ Pegar directamente en WhatsApp

**¡Aumenta tu productividad y cierra más ventas!** 🚀
