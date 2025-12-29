# 📝 Corrección de Rutas - Backend sin prefijo /api/

## Fecha: 4 de Octubre 2025

## 🔴 Problema Encontrado

Las nuevas acciones de Redux para WhatsApp usaban `/api/` en las URLs, pero el backend **NO usa ese prefijo**:

```javascript
// ❌ INCORRECTO
axios.get(`/api/property/${propertyId}/whatsapp`)
axios.put(`/api/property/${propertyId}`)

// ✅ CORRECTO (backend real)
axios.get(`/property/${propertyId}/whatsapp`)
axios.put(`/property/${propertyId}`)
```

### Errores generados:
- ❌ 404 en `/api/property/1/whatsapp`
- ❌ 404 en `/api/property/1`
- ❌ "propertyId no está presente en la respuesta"
- ❌ "Error al copiar"
- ❌ "Error al guardar plantilla"

---

## ✅ Solución Implementada

### **Opción elegida**: Modificar las acciones de Redux (NO el backend)

**Razón**: Cambiar el backend para usar `/api/` afectaría **TODAS** las rutas existentes:
- `/auth/login` → `/api/auth/login` ❌
- `/client` → `/api/client` ❌  
- `/property` → `/api/property` ❌
- Y todas las demás rutas...

Esto rompería toda la aplicación en producción.

---

## 📝 Cambios Realizados

### Archivo: `QL Front/src/redux/Actions/actions.js`

#### 1. **getWhatsAppText** - Línea 956
```javascript
// ANTES:
const response = await axios.get(`/api/property/${propertyId}/whatsapp`);

// DESPUÉS:
const response = await axios.get(`/property/${propertyId}/whatsapp`);
```

#### 2. **updateWhatsAppTemplate** - Línea 987
```javascript
// ANTES:
const response = await axios.put(`/api/property/${propertyId}`, {
  whatsappTemplate: template,
});

// DESPUÉS:
const response = await axios.put(`/property/${propertyId}`, {
  whatsappTemplate: template,
});
```

#### 3. **updatePropertyImages** - Línea 1028
```javascript
// ANTES:
const response = await axios.put(`/api/property/${propertyId}`, {
  images: images,
});

// DESPUÉS:
const response = await axios.put(`/property/${propertyId}`, {
  images: images,
});
```

---

## 🔍 Configuración del Backend

### `back/src/app.js` - Línea 58
```javascript
// Routes se montan en la raíz, SIN prefijo /api/
app.use("/", routes)
```

### `back/src/routes/index.js`
```javascript
router.use("/admin", require("./admin"));
router.use("/auth", require("./auth"));
router.use("/client", require("./client"));
router.use("/property", require("./property"));  // ← SIN /api/
// ... otras rutas
```

### URLs finales del backend:
- ✅ `https://qlinmobiliaria.onrender.com/auth/login`
- ✅ `https://qlinmobiliaria.onrender.com/client`
- ✅ `https://qlinmobiliaria.onrender.com/property`
- ✅ `https://qlinmobiliaria.onrender.com/property/1/whatsapp`

---

## 📊 Estado de las Rutas

### **Rutas que SÍ funcionan** (sin /api/):
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/auth/login` | POST | Login de usuario |
| `/client` | GET | Obtener clientes |
| `/property` | GET/POST | Propiedades |
| `/lease` | GET/POST | Contratos |
| `/payment` | GET/POST | Pagos |

### **Rutas corregidas** (ahora sin /api/):
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/property/:id/whatsapp` | GET | Obtener texto WhatsApp ✅ |
| `/property/:id` | PUT | Actualizar propiedad ✅ |

---

## ✅ Verificación

### Frontend (`main.jsx`):
```javascript
// Base URL del axios apunta a:
axios.defaults.baseURL = "https://qlinmobiliaria.onrender.com";

// Por lo tanto:
// axios.get("/property/1") → https://qlinmobiliaria.onrender.com/property/1 ✅
```

---

## 🎯 Resultado Final

Después de estos cambios:

1. ✅ **getWhatsAppText** hace petición a `/property/1/whatsapp`
2. ✅ **updateWhatsAppTemplate** hace petición a `/property/1`
3. ✅ **updatePropertyImages** hace petición a `/property/1`
4. ✅ **Todas las rutas coinciden con el backend**
5. ✅ **No se rompen rutas existentes**

---

## 🚀 Testing Post-Deploy

Probar en producción:

1. **Crear una propiedad** ✅
2. **Abrir listado de propiedades** ✅
3. **Click en botón de WhatsApp** ✅
4. **Copiar texto de WhatsApp** ✅ (debe funcionar sin 404)
5. **Editar plantilla de WhatsApp** ✅ (debe funcionar sin 404)
6. **Guardar cambios** ✅ (debe funcionar sin 404)

---

## 📁 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `back/src/app.js` | ✅ Revertido a `app.use("/", routes)` |
| `QL Front/src/redux/Actions/actions.js` | ✅ Eliminado `/api/` de 3 funciones |

---

## ⚠️ Nota Importante

**No agregar `/api/` al backend** a menos que:
1. Actualices **TODAS** las peticiones del frontend
2. Actualices la documentación de la API
3. Actualices cualquier cliente externo que use la API
4. Hagas un plan de migración completo

Por ahora, mantener el backend **SIN** el prefijo `/api/` es la mejor opción. ✅

---

## 📋 Checklist Final

- [x] Revertido cambio de `/api/` en `app.js`
- [x] Corregido `getWhatsAppText`
- [x] Corregido `updateWhatsAppTemplate`
- [x] Corregido `updatePropertyImages`
- [x] Documentación actualizada
- [ ] Commit y push a GitHub
- [ ] Deploy en Vercel
- [ ] Pruebas en producción

---

## 🎉 Estado

**Todo listo para hacer commit y deploy.** Las rutas ahora coinciden correctamente con el backend. 🚀
