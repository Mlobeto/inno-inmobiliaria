const mercadolibre = require('mercadolibre');
const { 
  MercadoLibreConfig, 
  PropertyMLListings, 
  MercadoLibreMessages,
  Property,
  Subscription,
  Plan
} = require('../data');
const { getMercadoLibreCategory, getListingType } = require('../utils/mercadoLibreCategoryMapper');

// Configuración del cliente ML
const meli = new mercadolibre.Meli(
  process.env.ML_CLIENT_ID,
  process.env.ML_CLIENT_SECRET,
  process.env.ML_REDIRECT_URI
);

class MercadoLibreController {
  // ========================================
  // 1. AUTENTICACIÓN OAUTH
  // ========================================
  
  /**
   * Iniciar flujo OAuth - Generar URL de autorización
   */
  async startAuth(req, res) {
    try {
      const { tenantId } = req.user;
      
      console.log('🔐 Iniciando OAuth ML para tenant:', tenantId);
      
      // Generar URL de autorización
      const authUrl = meli.getAuthURL(
        process.env.ML_REDIRECT_URI,
        'AR', // País Argentina
        `tenant_${tenantId}` // State para identificar al tenant en callback
      );
      
      console.log('✅ URL generada:', authUrl);
      
      res.json({
        success: true,
        authUrl
      });
    } catch (error) {
      console.error('❌ Error al iniciar auth ML:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar autenticación con MercadoLibre',
        error: error.message
      });
    }
  }
  
  /**
   * Callback OAuth - Intercambiar código por tokens
   */
  async handleCallback(req, res) {
    try {
      const { code, state, error: oauthError } = req.query;
      
      console.log('📥 Callback ML recibido:', { code: !!code, state, error: oauthError });
      
      // Si el usuario canceló o hubo error
      if (oauthError || !code) {
        console.log('⚠️ Usuario canceló o error OAuth:', oauthError);
        return res.redirect(`${process.env.FRONTEND_URL}/admin/integraciones?ml_error=${oauthError || 'no_code'}`);
      }
      
      // Extraer tenantId del state
      const tenantId = parseInt(state.replace('tenant_', ''));
      
      if (!tenantId || isNaN(tenantId)) {
        console.error('❌ TenantId inválido en state:', state);
        return res.redirect(`${process.env.FRONTEND_URL}/admin/integraciones?ml_error=invalid_state`);
      }
      
      console.log('🔄 Intercambiando código por tokens...');
      
      // Intercambiar código por access token
      const response = await meli.authorize(code, process.env.ML_REDIRECT_URI);
      
      const {
        access_token,
        refresh_token,
        user_id,
        expires_in
      } = response;
      
      console.log('✅ Tokens obtenidos para usuario ML:', user_id);
      
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Guardar en DB
      await MercadoLibreConfig.upsert({
        tenantId,
        mlUserId: user_id.toString(),
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expiresAt,
        isActive: true,
        lastSync: new Date(),
        updatedAt: new Date()
      });
      
      console.log('💾 Configuración guardada en DB');
      
      // Redirigir al frontend con éxito
      res.redirect(`${process.env.FRONTEND_URL}/admin/company-settings?tab=integrations&ml_success=true`);
    } catch (error) {
      console.error('❌ Error en callback ML:', error);
      res.redirect(`${process.env.FRONTEND_URL}/admin/company-settings?tab=integrations&ml_error=callback_failed`);
    }
  }
  
  /**
   * Verificar estado de conexión
   */
  async getConnectionStatus(req, res) {
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
        console.log('⚠️ Token expirado, intentando refrescar...');
        
        // Intentar refrescar token
        try {
          await this.refreshAccessToken(config);
          
          return res.json({
            success: true,
            connected: true,
            mlUserId: config.mlUserId,
            lastSync: config.lastSync
          });
        } catch (error) {
          console.error('❌ Error al refrescar token:', error);
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
      console.error('❌ Error al verificar conexión ML:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar conexión'
      });
    }
  }
  
  /**
   * Refrescar access token usando refresh token
   */
  async refreshAccessToken(config) {
    try {
      console.log('🔄 Refrescando access token...');
      
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
      
      console.log('✅ Token refrescado exitosamente');
      
      return config;
    } catch (error) {
      console.error('❌ Error al refrescar token:', error);
      
      // Si falla el refresh, desactivar conexión
      await config.update({ isActive: false });
      throw error;
    }
  }
  
  /**
   * Desconectar MercadoLibre
   */
  async disconnect(req, res) {
    try {
      const { tenantId } = req.user;
      
      await MercadoLibreConfig.update(
        { 
          isActive: false,
          accessToken: null,
          refreshToken: null
        },
        { where: { tenantId } }
      );
      
      console.log('✅ Tenant desconectado de ML:', tenantId);
      
      res.json({
        success: true,
        message: 'Desconectado de MercadoLibre'
      });
    } catch (error) {
      console.error('❌ Error al desconectar:', error);
      res.status(500).json({
        success: false,
        message: 'Error al desconectar'
      });
    }
  }
  
  // ========================================
  // 2. PUBLICACIÓN DE PROPIEDADES
  // ========================================
  
  /**
   * Publicar propiedad en MercadoLibre
   */
  async publishProperty(req, res) {
    try {
      const { tenantId } = req.user;
      const { propertyId } = req.params;
      
      console.log('📤 Publicando propiedad en ML:', { tenantId, propertyId });
      
      // 1. Verificar que el tenant tiene ML configurado
      const mlConfig = await MercadoLibreConfig.findOne({
        where: { tenantId, isActive: true }
      });
      
      if (!mlConfig) {
        return res.status(400).json({
          success: false,
          message: 'No estás conectado a MercadoLibre. Conecta tu cuenta primero.'
        });
      }
      
      // 2. Verificar si el token está expirado
      const now = new Date();
      if (mlConfig.tokenExpiresAt < now) {
        await this.refreshAccessToken(mlConfig);
      }
      
      // 3. Verificar que la propiedad no esté ya publicada
      const existingListing = await PropertyMLListings.findOne({
        where: { propertyId, tenantId }
      });
      
      if (existingListing && existingListing.mlStatus === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Esta propiedad ya está publicada en MercadoLibre',
          mlListingId: existingListing.mlListingId,
          permalink: existingListing.mlPermalink
        });
      }
      
      // 4. Obtener propiedad
      const property = await Property.findOne({
        where: { propertyId, tenantId }
      });
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Propiedad no encontrada'
        });
      }
      
      // 5. Obtener plan del tenant para determinar tipo de publicación
      const subscription = await Subscription.findOne({
        where: { tenantId },
        include: [{ model: Plan, as: 'Plan' }]
      });
      
      const listingType = subscription?.Plan?.planId 
        ? getListingType(subscription.Plan.planId) 
        : 'classified';
      
      // 6. Preparar datos para ML
      const mlData = {
        title: this.buildTitle(property),
        category_id: getMercadoLibreCategory(property),
        price: parseFloat(property.price),
        currency_id: 'ARS',
        available_quantity: 1,
        buying_mode: 'classified', // Para inmuebles siempre es 'classified'
        listing_type_id: listingType,
        condition: 'not_specified',
        description: this.buildDescription(property),
        pictures: this.buildPictures(property),
        attributes: this.buildAttributes(property),
      };
      
      // Solo agregar location si tenemos los datos
      if (property.address) {
        mlData.location = {
          address_line: property.address,
        };
        
        if (property.neighborhood) {
          mlData.location.neighborhood = { name: property.neighborhood };
        }
        
        if (property.city) {
          mlData.location.city = { name: property.city };
        }
      }
      
      console.log('📋 Datos preparados para ML:', {
        title: mlData.title,
        category: mlData.category_id,
        price: mlData.price,
        pictures: mlData.pictures.length
      });
      
      // 7. Publicar en ML
      meli.setAccessToken(mlConfig.accessToken);
      
      const response = await meli.post('/items', mlData);
      
      const { id: mlListingId, permalink, status } = response;
      
      console.log('✅ Publicación creada en ML:', { mlListingId, status });
      
      // 8. Guardar en DB
      await PropertyMLListings.upsert({
        propertyId,
        tenantId,
        mlListingId,
        mlStatus: status || 'active',
        mlPermalink: permalink,
        mlTitle: mlData.title,
        mlPrice: mlData.price,
        lastSync: new Date()
      });
      
      res.json({
        success: true,
        message: 'Propiedad publicada en MercadoLibre exitosamente',
        mlListingId,
        permalink,
        status
      });
    } catch (error) {
      console.error('❌ Error al publicar en ML:', error);
      
      // Guardar error en DB si existe la propiedad
      const { propertyId } = req.params;
      const { tenantId } = req.user;
      
      await PropertyMLListings.update(
        { 
          syncErrors: error.message,
          lastSync: new Date()
        },
        { where: { propertyId, tenantId } }
      );
      
      res.status(500).json({
        success: false,
        message: error.message || 'Error al publicar propiedad en MercadoLibre'
      });
    }
  }
  
  /**
   * Construir título de publicación (máx 60 caracteres)
   */
  buildTitle(property) {
    let title = `${property.typeProperty} ${property.type}`;
    
    if (property.rooms) {
      title += ` ${property.rooms} amb`;
    }
    
    if (property.neighborhood) {
      const remaining = 60 - title.length - 3; // -3 por " - "
      const neighborhood = property.neighborhood.substring(0, remaining);
      title += ` - ${neighborhood}`;
    }
    
    return title.substring(0, 60);
  }
  
  /**
   * Construir descripción detallada
   */
  buildDescription(property) {
    let desc = '';
    
    // Descripción principal
    if (property.description) {
      desc += `${property.description}\n\n`;
    }
    
    // Información básica
    desc += `📍 Ubicación: ${property.address || 'Consultar'}`;
    if (property.neighborhood) desc += `, ${property.neighborhood}`;
    if (property.city) desc += `, ${property.city}`;
    desc += '\n';
    
    desc += `🏠 Tipo: ${property.typeProperty}\n`;
    desc += `💰 Precio: $${property.price}\n`;
    
    // Características
    if (property.rooms) desc += `🛏️ Ambientes: ${property.rooms}\n`;
    if (property.bathrooms) desc += `🚿 Baños: ${property.bathrooms}\n`;
    if (property.bedrooms) desc += `🛌 Dormitorios: ${property.bedrooms}\n`;
    if (property.superficieTotal) desc += `📐 Superficie: ${property.superficieTotal}m²\n`;
    if (property.superficieCubierta) desc += `📐 Superficie cubierta: ${property.superficieCubierta}m²\n`;
    
    // Características adicionales
    const features = [];
    if (property.garage === 'Si') features.push('Cochera');
    if (property.pool === 'Si') features.push('Pileta');
    if (property.balcony === 'Si') features.push('Balcón');
    if (property.garden === 'Si') features.push('Jardín');
    
    if (features.length > 0) {
      desc += `\n✨ Características: ${features.join(', ')}\n`;
    }
    
    // Nota final
    desc += '\n📞 Consultanos por más información sobre esta propiedad.';
    
    return desc.substring(0, 50000); // Máximo 50k caracteres
  }
  
  /**
   * Construir array de imágenes
   */
  buildPictures(property) {
    if (!property.images || !Array.isArray(property.images)) {
      return [];
    }
    
    // ML acepta máximo 10 imágenes
    return property.images.slice(0, 10).map(url => ({ source: url }));
  }
  
  /**
   * Construir atributos de la publicación
   */
  buildAttributes(property) {
    const attrs = [];
    
    // Ambientes
    if (property.rooms) {
      attrs.push({
        id: 'ROOMS',
        value_name: property.rooms.toString()
      });
    }
    
    // Dormitorios
    if (property.bedrooms) {
      attrs.push({
        id: 'BEDROOMS',
        value_name: property.bedrooms.toString()
      });
    }
    
    // Baños
    if (property.bathrooms) {
      attrs.push({
        id: 'BATHROOMS',
        value_name: property.bathrooms.toString()
      });
    }
    
    // Superficie total
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
    
    // Superficie cubierta
    if (property.superficieCubierta) {
      attrs.push({
        id: 'COVERED_AREA',
        value_name: property.superficieCubierta.toString(),
        value_struct: {
          number: parseFloat(property.superficieCubierta),
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
  
  /**
   * Actualizar estado de publicación (pausar/reactivar)
   */
  async updateListingStatus(req, res) {
    try {
      const { tenantId } = req.user;
      const { propertyId } = req.params;
      const { status } = req.body; // 'paused' o 'active'
      
      console.log('🔄 Actualizando estado ML:', { propertyId, status });
      
      // Validar status
      if (!['paused', 'active'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Usa "paused" o "active"'
        });
      }
      
      // Obtener config y listing
      const mlConfig = await MercadoLibreConfig.findOne({
        where: { tenantId, isActive: true }
      });
      
      if (!mlConfig) {
        return res.status(400).json({
          success: false,
          message: 'No estás conectado a MercadoLibre'
        });
      }
      
      const listing = await PropertyMLListings.findOne({
        where: { propertyId, tenantId }
      });
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Publicación no encontrada'
        });
      }
      
      // Actualizar en ML
      meli.setAccessToken(mlConfig.accessToken);
      
      await meli.put(`/items/${listing.mlListingId}`, {
        status
      });
      
      // Actualizar en DB
      await listing.update({
        mlStatus: status,
        lastSync: new Date()
      });
      
      console.log('✅ Estado actualizado');
      
      res.json({
        success: true,
        message: `Publicación ${status === 'paused' ? 'pausada' : 'reactivada'} exitosamente`,
        status
      });
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado de publicación'
      });
    }
  }
  
  /**
   * Eliminar publicación
   */
  async deleteListingSync(req, res) {
    try {
      const { tenantId } = req.user;
      const { propertyId } = req.params;
      
      console.log('🗑️ Eliminando publicación ML:', propertyId);
      
      const mlConfig = await MercadoLibreConfig.findOne({
        where: { tenantId, isActive: true }
      });
      
      if (!mlConfig) {
        return res.status(400).json({
          success: false,
          message: 'No estás conectado a MercadoLibre'
        });
      }
      
      const listing = await PropertyMLListings.findOne({
        where: { propertyId, tenantId }
      });
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Publicación no encontrada'
        });
      }
      
      // Cerrar en ML
      meli.setAccessToken(mlConfig.accessToken);
      
      await meli.put(`/items/${listing.mlListingId}`, {
        status: 'closed',
        deleted: true
      });
      
      // Eliminar de DB
      await listing.destroy();
      
      console.log('✅ Publicación eliminada');
      
      res.json({
        success: true,
        message: 'Publicación eliminada de MercadoLibre'
      });
    } catch (error) {
      console.error('❌ Error al eliminar publicación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar publicación'
      });
    }
  }
  
  /**
   * Obtener lista de publicaciones del tenant
   */
  async getListings(req, res) {
    try {
      const { tenantId } = req.user;
      
      const listings = await PropertyMLListings.findAll({
        where: { tenantId },
        include: [{
          model: Property,
          as: 'Property',
          attributes: ['propertyId', 'address', 'price', 'typeProperty', 'images']
        }],
        order: [['createdAt', 'DESC']]
      });
      
      res.json({
        success: true,
        listings
      });
    } catch (error) {
      console.error('❌ Error al obtener listings:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener publicaciones'
      });
    }
  }
}

module.exports = new MercadoLibreController();
