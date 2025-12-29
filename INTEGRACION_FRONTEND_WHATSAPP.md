# 🚀 Guía de Integración Frontend - WhatsApp para Propiedades

## ✅ Cambios Realizados

### 1. **Redux Actions** (`actions-types.js` y `actions.js`)

Se agregaron nuevas acciones para manejar:
- ✅ `getWhatsAppText` - Obtener texto formateado de WhatsApp
- ✅ `updateWhatsAppTemplate` - Actualizar plantilla personalizada
- ✅ `updatePropertyImages` - Actualizar imágenes de la propiedad
- ✅ `copyWhatsAppToClipboard` - Copiar al portapapeles directamente

### 2. **Redux Reducer** (`reducer.js`)

Se agregó el estado `whatsappText` para almacenar el texto generado.

### 3. **Componente `WhatsAppButton.jsx`**

Componente reutilizable que incluye:
- Botón para copiar texto de WhatsApp
- Editor de plantilla personalizada
- Modal con preview de variables disponibles

---

## 📝 Cómo Integrar en el Listado de Propiedades

### **Opción 1: Agregar Botón en Cada Fila**

Edita `Listado.jsx` para agregar el botón de WhatsApp:

```jsx
import WhatsAppButton from './WhatsAppButton';

// Dentro del mapeo de propiedades en la tabla:
<td className="px-4 py-3 text-right space-x-2">
  {/* Botones existentes (editar, eliminar, etc.) */}
  
  {/* 🆕 Botón de WhatsApp */}
  <WhatsAppButton 
    propertyId={property.propertyId} 
    property={property} 
  />
</td>
```

### **Opción 2: Agregar en el Menú de Acciones**

Si tienes un menú dropdown de acciones, agrega:

```jsx
<div className="dropdown-menu">
  {/* Otras opciones */}
  
  <WhatsAppButton 
    propertyId={property.propertyId} 
    property={property} 
  />
</div>
```

---

## 🎨 Uso del Componente WhatsAppButton

### **Props Requeridas:**

```jsx
<WhatsAppButton 
  propertyId={123}           // ID de la propiedad
  property={{                // Objeto de la propiedad (opcional pero recomendado)
    address: "Londres 123",
    price: 9000000,
    whatsappTemplate: "Tu plantilla..."  // Opcional
  }}
/>
```

### **Funcionalidades del Componente:**

1. **Botón "Copiar WhatsApp":**
   - Al hacer clic, obtiene el texto formateado del backend
   - Copia automáticamente al portapapeles
   - Muestra confirmación visual "¡Copiado!"

2. **Botón "Editar Plantilla" (lápiz):**
   - Abre modal con editor de plantilla
   - Muestra variables disponibles
   - Permite guardar plantilla personalizada

3. **Modal de Edición:**
   - Textarea para editar plantilla
   - Muestra datos de la propiedad (dirección, precio)
   - Lista de variables disponibles
   - Botones Guardar/Cancelar

---

## 💻 Ejemplos de Integración Completa

### **Ejemplo 1: En Tabla de Propiedades**

```jsx
// Listado.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllProperties } from '../../redux/Actions/actions';
import WhatsAppButton from './WhatsAppButton';

const Listado = () => {
  const dispatch = useDispatch();
  const properties = useSelector(state => state.allProperties);

  useEffect(() => {
    dispatch(getAllProperties());
  }, [dispatch]);

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th>Dirección</th>
          <th>Precio</th>
          <th>Tipo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {properties.map(property => (
          <tr key={property.propertyId}>
            <td>{property.address}</td>
            <td>AR$ {property.price.toLocaleString()}</td>
            <td>{property.type}</td>
            <td>
              {/* 🆕 Botón de WhatsApp */}
              <WhatsAppButton 
                propertyId={property.propertyId} 
                property={property} 
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Listado;
```

### **Ejemplo 2: En Card de Propiedad**

```jsx
// PropertyCard.jsx
import WhatsAppButton from './WhatsAppButton';

const PropertyCard = ({ property }) => {
  return (
    <div className="border rounded-lg p-4 shadow">
      <img src={property.images[0]} alt={property.address} />
      <h3 className="text-xl font-bold">{property.address}</h3>
      <p className="text-gray-600">AR$ {property.price.toLocaleString()}</p>
      
      <div className="mt-4 flex gap-2">
        {/* Otros botones */}
        
        {/* 🆕 Botón de WhatsApp */}
        <WhatsAppButton 
          propertyId={property.propertyId} 
          property={property} 
        />
      </div>
    </div>
  );
};

export default PropertyCard;
```

### **Ejemplo 3: Uso Manual de las Acciones**

Si prefieres crear tu propia UI, puedes usar las acciones directamente:

```jsx
import { useDispatch } from 'react-redux';
import { 
  getWhatsAppText, 
  copyWhatsAppToClipboard, 
  updateWhatsAppTemplate 
} from '../../redux/Actions/actions';

const MyComponent = ({ propertyId }) => {
  const dispatch = useDispatch();

  // Opción 1: Copiar directamente
  const handleCopy = async () => {
    await dispatch(copyWhatsAppToClipboard(propertyId));
  };

  // Opción 2: Obtener texto y hacer algo con él
  const handleGetText = async () => {
    const data = await dispatch(getWhatsAppText(propertyId));
    console.log('Texto:', data.whatsappText);
    // Hacer algo con el texto...
  };

  // Opción 3: Actualizar plantilla
  const handleUpdateTemplate = async () => {
    const newTemplate = "Mi plantilla personalizada con {precio} y {direccion}";
    await dispatch(updateWhatsAppTemplate(propertyId, newTemplate));
  };

  return (
    <div>
      <button onClick={handleCopy}>Copiar WhatsApp</button>
      <button onClick={handleGetText}>Ver Texto</button>
      <button onClick={handleUpdateTemplate}>Actualizar Plantilla</button>
    </div>
  );
};
```

---

## 🔧 Personalización del Componente

### **Cambiar Colores:**

```jsx
// En WhatsAppButton.jsx, modifica las clases:

// Botón verde de WhatsApp
className="bg-gradient-to-r from-green-400 to-green-600"

// Cambiar a azul:
className="bg-gradient-to-r from-blue-400 to-blue-600"

// Cambiar a rojo:
className="bg-gradient-to-r from-red-400 to-red-600"
```

### **Cambiar Tamaño:**

```jsx
// Botón pequeño
<button className="px-2 py-1 text-xs">...</button>

// Botón mediano (actual)
<button className="px-4 py-2 text-sm">...</button>

// Botón grande
<button className="px-6 py-3 text-base">...</button>
```

### **Modo Compacto (Solo Icono):**

```jsx
<button className="p-2 rounded-lg bg-green-500 text-white">
  <IoLogoWhatsapp className="text-xl" />
</button>
```

---

## 📋 Variables Disponibles en la Plantilla

Cuando editas la plantilla, puedes usar estas variables:

| Variable | Se Reemplaza Con | Ejemplo |
|----------|------------------|---------|
| `{precio}` | Precio formateado | AR$ 9.000.000 |
| `{direccion}` | Dirección completa | Londres 123 |
| `{ciudad}` | Ciudad | Londres |
| `{barrio}` | Barrio/Vecindario | Barrio El Canal |
| `{tipo}` | Tipo de propiedad | lote, casa, finca |
| `{tipoOperacion}` | Venta o Alquiler | venta |
| `{habitaciones}` | Número de habitaciones | 3 |
| `{baños}` | Número de baños | 2 |
| `{superficieTotal}` | Superficie total | 500m² |
| `{superficieCubierta}` | Superficie cubierta | 200m² |
| `{descripcion}` | Descripción auto-generada | Casa en venta - 3 hab, 2 baños |
| `{destacados}` | Características destacadas | Piscina, Quincho, Garaje |
| `{escritura}` | Estado de escritura | escritura, prescripcion |

---

## 🐛 Solución de Problemas

### **Error: "Cannot read property 'whatsappText' of undefined"**
**Solución:** Asegúrate de que el estado inicial en el reducer incluya `whatsappText: null`

### **Error: "Property images not updating"**
**Solución:** Verifica que estés usando `updatePropertyImages` en lugar de `updateProperty`

### **El texto no se copia al portapapeles**
**Solución:** Verifica que estés usando HTTPS o localhost (el Clipboard API requiere contexto seguro)

### **El modal no se cierra después de guardar**
**Solución:** Asegúrate de que `setShowTemplateEditor(false)` se llame en `handleSaveTemplate`

---

## ✅ Checklist de Integración

- [x] Actions agregadas en `actions-types.js`
- [x] Actions implementadas en `actions.js`
- [x] Reducer actualizado con casos de WhatsApp
- [x] Componente `WhatsAppButton.jsx` creado
- [ ] Componente agregado al `Listado.jsx`
- [ ] Probar copiar texto de WhatsApp
- [ ] Probar editar plantilla personalizada
- [ ] Verificar que el portapapeles funcione
- [ ] Verificar que las variables se reemplacen correctamente

---

## 🎉 ¡Listo para Usar!

Con esta integración, ahora puedes:
1. ✅ Copiar texto de WhatsApp con un solo clic
2. ✅ Personalizar plantillas para cada propiedad
3. ✅ Ver variables disponibles y ejemplos
4. ✅ Guardar plantillas editables
5. ✅ Mejorar la productividad de ventas

**¡Aumenta tus conversiones con mensajes personalizados!** 📱🚀
