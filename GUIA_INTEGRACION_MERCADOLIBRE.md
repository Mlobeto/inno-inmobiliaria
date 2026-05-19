# 🏢 Guía de Integración MercadoLibre para Tenants

## 📋 Índice
1. [Arquitectura de la Integración](#arquitectura)
2. [Configuración Inicial](#configuracion)
3. [Flujo OAuth para Tenants](#oauth)
4. [Publicación de Propiedades](#publicacion)
5. [Sincronización de Mensajes](#mensajes)
6. [Webhooks](#webhooks)
7. [Testing](#testing)

> **Actualización (2026):** La integración está implementada en código. Los tenants conectan desde **Configuración → Integraciones** (`MercadoLibreIntegration.jsx`). Webhook: `POST {BACKEND_URL}/api/webhooks/mercadolibre`. OAuth state firmado con `JWT_SECRET_KEY`. Las consultas se sincronizan a **leads**, no a `MercadoLibreMessages`.

---

## 🏗️ Arquitectura de la Integración {#arquitectura}

### Modelo de Datos
Necesitamos agregar campos a la base de datos para almacenar tokens y configuración de MercadoLibre:

```sql
-- Tabla para almacenar configuración de MercadoLibre por tenant
CREATE TABLE "MercadoLibreConfig" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES "Tenants"("tenantId"),
  "mlUserId" VARCHAR(100),
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT false,
  "lastSync" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("tenantId")
);

-- Tabla para vincular propiedades con publicaciones en ML
CREATE TABLE "PropertyMLListings" (
  "id" SERIAL PRIMARY KEY,
  "propertyId" INTEGER NOT NULL REFERENCES "Property"("propertyId"),
  "tenantId" INTEGER NOT NULL REFERENCES "Tenants"("tenantId"),
  "mlListingId" VARCHAR(100) NOT NULL,
  "mlStatus" VARCHAR(50), -- active, paused, closed
  "mlPermalink" TEXT,
  "lastSync" TIMESTAMP,
  "syncErrors" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("propertyId", "tenantId")
);

-- Tabla para mensajes/consultas de ML
CREATE TABLE "MercadoLibreMessages" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INTEGER NOT NULL REFERENCES "Tenants"("tenantId"),
  "propertyId" INTEGER REFERENCES "Property"("propertyId"),
  "mlMessageId" VARCHAR(100) NOT NULL,
  "mlQuestionId" VARCHAR(100),
  "mlUserId" VARCHAR(100),
  "userNickname" VARCHAR(255),
  "message" TEXT,
  "answer" TEXT,
  "status" VARCHAR(50), -- UNANSWERED, ANSWERED
  "isRead" BOOLEAN DEFAULT false,
  "receivedAt" TIMESTAMP,
  "answeredAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("mlMessageId")
);
```

---

## ⚙️ Configuración Inicial {#configuracion}

### 1. Crear Aplicación en MercadoLibre

1. Ve a [MercadoLibre Developers](https://developers.mercadolibre.com.ar/apps/)
2. Crea una nueva aplicación
3. Configura:
   - **Nombre**: InnoInmobiliaria Integration
   - **Descripción**: Publicación automática de propiedades
   - **Redirect URI**: `https://tudominio.com/api/mercadolibre/callback`
   - **Scopes necesarios**: `read`, `write`, `offline_access`

4. Guarda las credenciales:

```env
# .env
ML_CLIENT_ID=tu_client_id_aqui
ML_CLIENT_SECRET=tu_client_secret_aqui
ML_REDIRECT_URI=https://tudominio.com/api/mercadolibre/callback
```

### 2. Instalar SDK de MercadoLibre

```bash
cd back
npm install mercadolibre
```

---

## 🔐 Flujo OAuth para Tenants {#oauth}

### Paso 1: Endpoint para iniciar autenticación

**Backend: `back/src/routes/mercadolibre.js`**

```javascript
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const MercadoLibreController = require('../controllers/MercadoLibreController');

router.use(authMiddleware);
router.use(tenancyMiddleware);

// Iniciar autenticación OAuth
router.get('/auth/start', MercadoLibreController.startAuth);

// Callback de OAuth
router.get('/callback', MercadoLibreController.handleCallback);

// Obtener estado de conexión
router.get('/status', MercadoLibreController.getConnectionStatus);

// Desconectar
router.post('/disconnect', MercadoLibreController.disconnect);

// Publicar propiedad
router.post('/publish/:propertyId', MercadoLibreController.publishProperty);

// Pausar/reactivar publicación
router.put('/listings/:propertyId/status', MercadoLibreController.updateListingStatus);

// Eliminar publicación
router.delete('/listings/:propertyId', MercadoLibreController.deleteListingSync);

// Obtener mensajes
router.get('/messages', MercadoLibreController.getMessages);

// Responder mensaje
router.post('/messages/:messageId/answer', MercadoLibreController.answerMessage);

// Webhook receiver
router.post('/webhook', MercadoLibreController.handleWebhook);

module.exports = router;
```

### Paso 2: Controlador de MercadoLibre

**Backend: `back/src/controllers/MercadoLibreController.js`**

```javascript
const mercadolibre = require('mercadolibre');
const { MercadoLibreConfig, PropertyMLListings, Property } = require('../data');

// Configuración del cliente ML
const meli = new mercadolibre.Meli(
  process.env.ML_CLIENT_ID,
  process.env.ML_CLIENT_SECRET,
  process.env.ML_REDIRECT_URI
);

// 1. INICIAR AUTENTICACIÓN
exports.startAuth = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // Generar URL de autorización
    const authUrl = meli.getAuthURL(
      process.env.ML_REDIRECT_URI,
      'AR', // País
      `tenant_${tenantId}` // State para identificar al tenant
    );
    
    res.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error('Error al iniciar auth ML:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar autenticación con MercadoLibre'
    });
  }
};

// 2. CALLBACK DE OAUTH
exports.handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // Extraer tenantId del state
    const tenantId = parseInt(state.replace('tenant_', ''));
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/mercadolibre?error=no_code`);
    }
    
    // Intercambiar código por access token
    const response = await meli.authorize(code, process.env.ML_REDIRECT_URI);
    
    const {
      access_token,
      refresh_token,
      user_id,
      expires_in
    } = response;
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
    
    // Guardar en DB
    await MercadoLibreConfig.upsert({
      tenantId,
      mlUserId: user_id,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: expiresAt,
      isActive: true,
      updatedAt: new Date()
    });
    
    // Redirigir al frontend
    res.redirect(`${process.env.FRONTEND_URL}/mercadolibre?success=true`);
  } catch (error) {
    console.error('Error en callback ML:', error);
    res.redirect(`${process.env.FRONTEND_URL}/mercadolibre?error=callback_failed`);
  }
};

// 3. VERIFICAR ESTADO DE CONEXIÓN
exports.getConnectionStatus = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const config = await MercadoLibreConfig.findOne({
      where: { tenantId }
    });
    
    if (!config || !config.isActive) {
      return res.json({
        success: true,
        connected: false
      });
    }
    
    // Verificar si el token está expirado
    const now = new Date();
    const isExpired = config.tokenExpiresAt < now;
    
    if (isExpired) {
      // Intentar refrescar token
      try {
        const refreshed = await refreshAccessToken(config);
        
        return res.json({
          success: true,
          connected: true,
          mlUserId: refreshed.mlUserId,
          lastSync: config.lastSync
        });
      } catch (error) {
        return res.json({
          success: true,
          connected: false,
          error: 'token_expired'
        });
      }
    }
    
    res.json({
      success: true,
      connected: true,
      mlUserId: config.mlUserId,
      lastSync: config.lastSync
    });
  } catch (error) {
    console.error('Error al verificar conexión ML:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar conexión'
    });
  }
};

// 4. REFRESCAR ACCESS TOKEN
async function refreshAccessToken(config) {
  try {
    const response = await meli.refreshAccessToken(config.refreshToken);
    
    const {
      access_token,
      refresh_token,
      expires_in
    } = response;
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
    
    await config.update({
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date()
    });
    
    return config;
  } catch (error) {
    // Si falla el refresh, desactivar conexión
    await config.update({ isActive: false });
    throw error;
  }
}

// 5. DESCONECTAR
exports.disconnect = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    await MercadoLibreConfig.update(
      { isActive: false },
      { where: { tenantId } }
    );
    
    res.json({
      success: true,
      message: 'Desconectado de MercadoLibre'
    });
  } catch (error) {
    console.error('Error al desconectar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desconectar'
    });
  }
};

module.exports = {
  startAuth: exports.startAuth,
  handleCallback: exports.handleCallback,
  getConnectionStatus: exports.getConnectionStatus,
  disconnect: exports.disconnect
};
```

---

## 📤 Publicación de Propiedades {#publicacion}

### Mapeo de Categorías ML

```javascript
// back/src/utils/mercadoLibreCategoryMapper.js

// Categorías de MercadoLibre para inmuebles en Argentina
const ML_CATEGORIES = {
  // VENTA
  departamento_venta: 'MLA1473', // Departamentos
  casa_venta: 'MLA1472', // Casas
  ph_venta: 'MLA1474', // PH
  terreno_venta: 'MLA1476', // Terrenos y Lotes
  local_venta: 'MLA1477', // Locales Comerciales
  oficina_venta: 'MLA1479', // Oficinas
  
  // ALQUILER
  departamento_alquiler: 'MLA1459', // Departamentos
  casa_alquiler: 'MLA1468', // Casas
  ph_alquiler: 'MLA105971', // PH
  local_alquiler: 'MLA1478', // Locales Comerciales
  oficina_alquiler: 'MLA1480', // Oficinas
};

function getMercadoLibreCategory(property) {
  const { type, typeProperty } = property;
  
  // type: 'venta' | 'alquiler'
  // typeProperty: 'Departamento' | 'Casa' | 'PH' | 'Terreno' | 'Local' | 'Oficina'
  
  const key = `${typeProperty.toLowerCase()}_${type}`;
  return ML_CATEGORIES[key] || ML_CATEGORIES.departamento_alquiler;
}

module.exports = { getMercadoLibreCategory };
```

### Publicar Propiedad

```javascript
// Agregar a MercadoLibreController.js

const { getMercadoLibreCategory } = require('../utils/mercadoLibreCategoryMapper');

exports.publishProperty = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { propertyId } = req.params;
    
    // 1. Obtener configuración de ML
    const mlConfig = await MercadoLibreConfig.findOne({
      where: { tenantId, isActive: true }
    });
    
    if (!mlConfig) {
      return res.status(400).json({
        success: false,
        message: 'No estás conectado a MercadoLibre'
      });
    }
    
    // 2. Verificar token
    const now = new Date();
    if (mlConfig.tokenExpiresAt < now) {
      await refreshAccessToken(mlConfig);
    }
    
    // 3. Obtener propiedad
    const property = await Property.findOne({
      where: { propertyId, tenantId }
    });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada'
      });
    }
    
    // 4. Preparar datos para ML
    const mlData = {
      title: property.address.substring(0, 60), // Máximo 60 caracteres
      category_id: getMercadoLibreCategory(property),
      price: parseFloat(property.price),
      currency_id: 'ARS',
      available_quantity: 1,
      buying_mode: 'classified', // Para inmuebles siempre es 'classified'
      listing_type_id: 'gold_special', // Publicación destacada
      condition: 'not_specified',
      description: buildDescription(property),
      pictures: buildPictures(property),
      attributes: buildAttributes(property),
      location: {
        address_line: property.address,
        neighborhood: {
          name: property.neighborhood
        },
        city: {
          name: property.city || 'Buenos Aires'
        }
      }
    };
    
    // 5. Publicar en ML
    meli.setAccessToken(mlConfig.accessToken);
    
    const response = await meli.post('/items', mlData);
    
    const { id: mlListingId, permalink } = response;
    
    // 6. Guardar en DB
    await PropertyMLListings.create({
      propertyId,
      tenantId,
      mlListingId,
      mlStatus: 'active',
      mlPermalink: permalink,
      lastSync: new Date()
    });
    
    res.json({
      success: true,
      message: 'Propiedad publicada en MercadoLibre',
      mlListingId,
      permalink
    });
  } catch (error) {
    console.error('Error al publicar en ML:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al publicar propiedad'
    });
  }
};

// Helper: Construir descripción
function buildDescription(property) {
  let desc = `${property.description}\n\n`;
  
  desc += `📍 Ubicación: ${property.address}, ${property.neighborhood}\n`;
  desc += `🏠 Tipo: ${property.typeProperty}\n`;
  desc += `💰 Precio: $${property.price}\n`;
  
  if (property.rooms) desc += `🛏️ Ambientes: ${property.rooms}\n`;
  if (property.bathrooms) desc += `🚿 Baños: ${property.bathrooms}\n`;
  if (property.superficieTotal) desc += `📐 Superficie: ${property.superficieTotal}m²\n`;
  
  return desc.substring(0, 50000); // Máximo 50k caracteres
}

// Helper: Construir array de imágenes
function buildPictures(property) {
  if (!property.images || !Array.isArray(property.images)) {
    return [];
  }
  
  return property.images.slice(0, 10).map(url => ({ source: url }));
}

// Helper: Construir atributos
function buildAttributes(property) {
  const attrs = [];
  
  if (property.rooms) {
    attrs.push({
      id: 'ROOMS',
      value_name: property.rooms.toString()
    });
  }
  
  if (property.bathrooms) {
    attrs.push({
      id: 'BATHROOMS',
      value_name: property.bathrooms.toString()
    });
  }
  
  if (property.superficieTotal) {
    attrs.push({
      id: 'TOTAL_AREA',
      value_name: property.superficieTotal.toString(),
      value_struct: {
        number: parseFloat(property.superficieTotal),
        unit: 'm²'
      }
    });
  }
  
  // Operación (venta/alquiler)
  attrs.push({
    id: 'OPERATION',
    value_id: property.type === 'venta' ? '242068' : '242069'
  });
  
  return attrs;
}
```

---

## 💬 Sincronización de Mensajes {#mensajes}

```javascript
// Agregar a MercadoLibreController.js

exports.getMessages = async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const mlConfig = await MercadoLibreConfig.findOne({
      where: { tenantId, isActive: true }
    });
    
    if (!mlConfig) {
      return res.status(400).json({
        success: false,
        message: 'No estás conectado a MercadoLibre'
      });
    }
    
    // Obtener preguntas de ML
    meli.setAccessToken(mlConfig.accessToken);
    
    const response = await meli.get('/my/received_questions/search', {
      status: 'UNANSWERED',
      sort_fields: 'date_created',
      sort_types: 'DESC',
      limit: 50
    });
    
    const questions = response.questions || [];
    
    // Guardar en DB
    for (const q of questions) {
      await MercadoLibreMessages.upsert({
        tenantId,
        mlMessageId: q.id.toString(),
        mlQuestionId: q.id.toString(),
        mlUserId: q.from.id.toString(),
        userNickname: q.from.nickname,
        message: q.text,
        status: q.status,
        receivedAt: new Date(q.date_created),
        isRead: false
      });
    }
    
    // Obtener de DB
    const messages = await MercadoLibreMessages.findAll({
      where: { tenantId },
      order: [['receivedAt', 'DESC']],
      limit: 50
    });
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes'
    });
  }
};

exports.answerMessage = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { messageId } = req.params;
    const { answer } = req.body;
    
    const mlConfig = await MercadoLibreConfig.findOne({
      where: { tenantId, isActive: true }
    });
    
    if (!mlConfig) {
      return res.status(400).json({
        success: false,
        message: 'No estás conectado a MercadoLibre'
      });
    }
    
    const message = await MercadoLibreMessages.findOne({
      where: { id: messageId, tenantId }
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado'
      });
    }
    
    // Responder en ML
    meli.setAccessToken(mlConfig.accessToken);
    
    await meli.post(`/answers`, {
      question_id: parseInt(message.mlQuestionId),
      text: answer
    });
    
    // Actualizar en DB
    await message.update({
      answer,
      status: 'ANSWERED',
      answeredAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Respuesta enviada'
    });
  } catch (error) {
    console.error('Error al responder mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar respuesta'
    });
  }
};
```

---

## 🔔 Webhooks {#webhooks}

```javascript
// Agregar a MercadoLibreController.js

exports.handleWebhook = async (req, res) => {
  try {
    // MercadoLibre envía notificaciones sobre cambios en publicaciones, preguntas, etc.
    const { topic, resource } = req.body;
    
    console.log('Webhook recibido:', { topic, resource });
    
    // Responder inmediatamente a ML
    res.status(200).send('OK');
    
    // Procesar notificación de forma asíncrona
    switch (topic) {
      case 'questions':
        // Nueva pregunta recibida
        await handleNewQuestion(resource);
        break;
        
      case 'items':
        // Cambio en publicación (pausada, cerrada, etc.)
        await handleItemUpdate(resource);
        break;
        
      default:
        console.log('Tipo de webhook no manejado:', topic);
    }
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).send('ERROR');
  }
};

async function handleNewQuestion(resource) {
  try {
    // resource es la URL del recurso: /questions/QUESTION_ID
    const questionId = resource.split('/').pop();
    
    // Obtener detalles de la pregunta desde ML
    // (necesitarás identificar a qué tenant pertenece)
    // Por ahora, sincronizarla la próxima vez que el tenant llame a getMessages()
    console.log('Nueva pregunta:', questionId);
  } catch (error) {
    console.error('Error al manejar nueva pregunta:', error);
  }
}

async function handleItemUpdate(resource) {
  try {
    const itemId = resource.split('/').pop();
    
    // Actualizar estado de la publicación en DB
    const listing = await PropertyMLListings.findOne({
      where: { mlListingId: itemId }
    });
    
    if (listing) {
      // Obtener estado actual desde ML
      // y actualizar en DB
      console.log('Publicación actualizada:', itemId);
    }
  } catch (error) {
    console.error('Error al manejar actualización de item:', error);
  }
}
```

---

## 🧪 Testing {#testing}

### 1. Testing en Sandbox

MercadoLibre ofrece un entorno de pruebas:

1. Crea usuarios de prueba en https://developers.mercadolibre.com.ar/test-users
2. Usa las credenciales de test en `.env`:

```env
ML_CLIENT_ID=tu_test_client_id
ML_CLIENT_SECRET=tu_test_client_secret
```

### 2. Frontend: Componente de Integración

Crear un componente para que los tenants conecten su cuenta:

```jsx
// front/src/Components/MercadoLibre/MercadoLibreConnect.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import { IoLogoUsd, IoCheckmarkCircle, IoAlertCircle } from 'react-icons/io5';

const MercadoLibreConnect = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/mercadolibre/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConnected(response.data.connected);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/mercadolibre/auth/start', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Abrir ventana de autorización
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar de MercadoLibre?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/mercadolibre/disconnect', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConnected(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <IoLogoUsd className="w-6 h-6 text-yellow-400" />
            MercadoLibre
          </h3>
          <p className="text-slate-300 mt-2">
            {connected 
              ? 'Conectado - Puedes publicar propiedades' 
              : 'Conecta tu cuenta para publicar propiedades automáticamente'}
          </p>
        </div>
        
        <div>
          {connected ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg"
            >
              Conectar Cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MercadoLibreConnect;
```

---

## 📝 Próximos Pasos

1. **Crear migraciones de DB** para las nuevas tablas
2. **Registrar rutas** en `back/src/routes/index.js`
3. **Crear modelos Sequelize** para las nuevas tablas
4. **Implementar el controller completo**
5. **Agregar botón "Publicar en ML"** en el listado de propiedades
6. **Configurar webhooks** en la app de ML
7. **Testing exhaustivo** en sandbox

---

## 🚀 Consideraciones Importantes

### Límites de la API
- **Rate limit**: 10,000 requests/hour en producción
- **Imágenes**: Máximo 10 por publicación
- **Título**: Máximo 60 caracteres
- **Descripción**: Máximo 50,000 caracteres

### Costos
- Publicaciones gratuitas tienen visibilidad limitada
- Publicaciones destacadas (`gold_special`) tienen costo
- Consultar tarifas en MercadoLibre

### Seguridad
- Nunca expongas los tokens en el frontend
- Encripta los tokens en la base de datos
- Implementa refresh automático de tokens
- Valida webhooks con firma HMAC

---

¿Necesitas que implemente alguna parte específica de la integración?
