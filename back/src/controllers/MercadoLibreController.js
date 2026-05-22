const prisma = require('../utils/prismaClient');
const { getMercadoLibreCategory, getListingType } = require('../utils/mercadoLibreCategoryMapper');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/encryption');
const { signMlOAuthState, resolveMlOAuthTenantId } = require('../utils/mlOAuthState');
const {
  validatePropertyForMlPublish,
  formatMlPublishError,
} = require('../utils/mlPublishHelpers');
const { getMlRedirectUri } = require('../utils/mlOAuthConfig');
const {
  buildMlAuthUrl,
  exchangeMlAuthorizationCode,
  refreshMlAccessToken,
  mlGet,
  mlPost,
  mlPut,
} = require('../utils/mlApiClient');

/** URL pública del API (webhooks). En prod debe coincidir con ML_REDIRECT_URI / Azure. */
function getPublicBackendUrl() {
  const explicit = (process.env.BACKEND_URL || process.env.API_URL || '').trim();
  if (explicit) {
    return explicit.replace(/\/$/, '').replace(/\/api\/?$/i, '');
  }
  const redirect = process.env.ML_REDIRECT_URI || '';
  const match = redirect.match(/^(https?:\/\/[^/]+)/i);
  if (match) {
    return match[1];
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://inno-prod-api.proudmoss-fef6994b.eastus2.azurecontainerapps.io';
  }
  return 'http://localhost:3001';
}

function getMlWebhookUrl() {
  return `${getPublicBackendUrl()}/api/webhooks/mercadolibre`;
}

class MercadoLibreController {
  async getActiveMlConfig(tenantId) {
    const config = await prisma.MercadoLibreConfig.findFirst({
      where: { tenantId, isActive: true },
    });
    if (!config) return null;

    if (config.tokenExpiresAt < new Date()) {
      try {
        return await this.refreshAccessToken(config);
      } catch {
        return null;
      }
    }
    return config;
  }

  async getAccessTokenForConfig(mlConfig) {
    let config = mlConfig;
    if (config.tokenExpiresAt < new Date()) {
      config = await this.refreshAccessToken(config);
    }
    return this.decryptStoredToken(config, 'accessToken');
  }

  encryptTokenValue(token) {
    if (!token) {
      return {
        token: null,
        iv: null,
        authTag: null,
        salt: null,
      };
    }

    const encryptedData = encrypt(token);
    return {
      token: encryptedData.encrypted,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
      salt: encryptedData.salt,
    };
  }

  decryptStoredToken(config, tokenField) {
    const encryptedToken = config?.[tokenField];
    if (!encryptedToken) {
      return null;
    }

    const ivField = `${tokenField}Iv`;
    const authTagField = `${tokenField}AuthTag`;
    const saltField = `${tokenField}Salt`;

    const iv = config?.[ivField];
    const authTag = config?.[authTagField];
    const salt = config?.[saltField];

    if (!iv || !authTag || !salt) {
      return encryptedToken;
    }

    return decrypt({
      encrypted: encryptedToken,
      iv,
      authTag,
      salt,
    });
  }

  // ========================================
  // 1. AUTENTICACIÓN OAUTH
  // ========================================
  
  /**
   * Iniciar flujo OAuth - Generar URL de autorización
   */
  async startAuth(req, res) {
    try {
      const { tenantId } = req.user;
      
      logger.info('Iniciando OAuth ML', { tenantId });
      
      // Generar URL de autorización
      const oauthState = signMlOAuthState(tenantId);
      const redirectUri = getMlRedirectUri();
      const authUrl = buildMlAuthUrl(redirectUri, oauthState);

      logger.info('URL OAuth ML generada', { tenantId, redirectUri });

      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      logger.error('Error al iniciar auth ML', { tenantId, error: error.message });
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
      
      logger.info('Callback ML recibido', { hasCode: !!code, state, oauthError });
      
      // Si el usuario canceló o hubo error
      if (oauthError || !code) {
        logger.warn('Usuario canceló o error OAuth', { oauthError });
        const errCode = encodeURIComponent(oauthError || 'no_code');
        return res.redirect(
          `${process.env.FRONTEND_URL}/admin/company-settings?tab=mercadolibre&ml_error=${errCode}`
        );
      }
      
      const tenantId = resolveMlOAuthTenantId(state);

      if (!tenantId) {
        logger.error('State OAuth ML inválido o alterado', { state: state?.slice?.(0, 40) });
        return res.redirect(
          `${process.env.FRONTEND_URL}/admin/company-settings?tab=mercadolibre&ml_error=invalid_state`
        );
      }
      
      logger.info('Intercambiando código OAuth por tokens ML', { tenantId });
      
      // Intercambiar código por access token
      const response = await exchangeMlAuthorizationCode(code, getMlRedirectUri());
      
      const {
        access_token,
        refresh_token,
        user_id,
        expires_in
      } = response;

      const encryptedAccessToken = this.encryptTokenValue(access_token);
      const encryptedRefreshToken = this.encryptTokenValue(refresh_token);
      
      logger.info('Tokens ML obtenidos', { mlUserId: user_id });
      
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Guardar en DB usando findOrCreate + update para disparar hooks de cifrado
      const existingConfig = await prisma.MercadoLibreConfig.findUnique({
        where: { tenantId },
      });

      const mlConfig = await prisma.MercadoLibreConfig.upsert({
        where: { tenantId },
        update: {
          mlUserId: user_id.toString(),
          accessToken: encryptedAccessToken.token,
          accessTokenIv: encryptedAccessToken.iv,
          accessTokenAuthTag: encryptedAccessToken.authTag,
          accessTokenSalt: encryptedAccessToken.salt,
          refreshToken: encryptedRefreshToken.token,
          refreshTokenIv: encryptedRefreshToken.iv,
          refreshTokenAuthTag: encryptedRefreshToken.authTag,
          refreshTokenSalt: encryptedRefreshToken.salt,
          tokenExpiresAt: expiresAt,
          isActive: true,
          lastSync: new Date(),
        },
        create: {
          tenantId,
          mlUserId: user_id.toString(),
          accessToken: encryptedAccessToken.token,
          accessTokenIv: encryptedAccessToken.iv,
          accessTokenAuthTag: encryptedAccessToken.authTag,
          accessTokenSalt: encryptedAccessToken.salt,
          refreshToken: encryptedRefreshToken.token,
          refreshTokenIv: encryptedRefreshToken.iv,
          refreshTokenAuthTag: encryptedRefreshToken.authTag,
          refreshTokenSalt: encryptedRefreshToken.salt,
          tokenExpiresAt: expiresAt,
          isActive: true,
          lastSync: new Date(),
        },
      });

      const created = !existingConfig;

      logger.info('Configuración ML guardada en DB', { tenantId, mlUserId: user_id, created });
      
      // Redirigir al frontend con éxito
      res.redirect(`${process.env.FRONTEND_URL}/admin/company-settings?tab=mercadolibre&ml_success=true`);
    } catch (error) {
      logger.error('Error en callback ML', {
        error: error.message,
        mlError: error.mlError,
        mlStatus: error.mlStatus,
        mlDescription: error.mlDescription,
      });
      const knownErrors = ['invalid_client', 'invalid_grant', 'unauthorized_client', 'forbidden'];
      const errCode = knownErrors.includes(error.mlError) ? error.mlError : 'callback_failed';
      res.redirect(
        `${process.env.FRONTEND_URL}/admin/company-settings?tab=mercadolibre&ml_error=${encodeURIComponent(errCode)}`
      );
    }
  }
  
  /**
   * Verificar estado de conexión
   */
  async getConnectionStatus(req, res) {
    try {
      const { tenantId } = req.user;
      
      const config = await prisma.MercadoLibreConfig.findUnique({ where: { tenantId } });
      
      if (!config || !config.isActive) {
        return res.json({
          success: true,
          connected: false,
        });
      }

      const listingsCount = await prisma.PropertyMLListings.count({
        where: {
          tenantId,
          mlStatus: { in: ['active', 'paused', 'under_review'] },
        },
      });
      
      // Verificar si el token está expirado
      const now = new Date();
      const isExpired = config.tokenExpiresAt < now;
      
      if (isExpired) {
        logger.warn('Token ML expirado, intentando refrescar', { tenantId });
        
        // Intentar refrescar token
        try {
          const refreshedConfig = await this.refreshAccessToken(config);
          
          return res.json({
            success: true,
            connected: true,
            mlUserId: refreshedConfig.mlUserId,
            lastSync: refreshedConfig.lastSync,
            listingsCount,
          });
        } catch (error) {
          logger.error('Error al refrescar token ML', { tenantId, error: error.message });
          return res.json({
            success: true,
            connected: false,
            error: 'token_expired',
          });
        }
      }
      
      res.json({
        success: true,
        connected: true,
        mlUserId: config.mlUserId,
        lastSync: config.lastSync,
        listingsCount,
      });
    } catch (error) {
      logger.error('Error al verificar conexión ML', { tenantId, error: error.message });
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
      logger.info('Refrescando access token ML');

      const refreshToken = this.decryptStoredToken(config, 'refreshToken');
      if (!refreshToken) {
        throw new Error('No se encontró refresh token para MercadoLibre');
      }
      
      const response = await refreshMlAccessToken(refreshToken);
      
      const {
        access_token,
        refresh_token,
        expires_in
      } = response;

      const encryptedAccessToken = this.encryptTokenValue(access_token);
      const encryptedRefreshToken = this.encryptTokenValue(refresh_token);
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      const updatedConfig = await prisma.MercadoLibreConfig.update({
        where: { id: config.id },
        data: {
          accessToken: encryptedAccessToken.token,
          accessTokenIv: encryptedAccessToken.iv,
          accessTokenAuthTag: encryptedAccessToken.authTag,
          accessTokenSalt: encryptedAccessToken.salt,
          refreshToken: encryptedRefreshToken.token,
          refreshTokenIv: encryptedRefreshToken.iv,
          refreshTokenAuthTag: encryptedRefreshToken.authTag,
          refreshTokenSalt: encryptedRefreshToken.salt,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date(),
        }
      });
      
      logger.info('Token ML refrescado exitosamente');
      
      return updatedConfig;
    } catch (error) {
      logger.error('Error al refrescar token ML', { error: error.message });
      
      // Si falla el refresh, desactivar conexión
      await prisma.MercadoLibreConfig.update({
        where: { id: config.id },
        data: { isActive: false },
      });
      throw error;
    }
  }
  
  /**
   * Desconectar MercadoLibre
   */
  async disconnect(req, res) {
    try {
      const { tenantId } = req.user;
      
      await prisma.MercadoLibreConfig.updateMany({
        where: { tenantId },
        data: {
          isActive: false,
          accessToken: null,
          accessTokenIv: null,
          accessTokenAuthTag: null,
          accessTokenSalt: null,
          refreshToken: null,
          refreshTokenIv: null,
          refreshTokenAuthTag: null,
          refreshTokenSalt: null,
        },
      });
      
      logger.info('Tenant desconectado de ML', { tenantId });
      
      res.json({
        success: true,
        message: 'Desconectado de MercadoLibre'
      });
    } catch (error) {
      logger.error('Error al desconectar de ML', { tenantId, error: error.message });
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
      
      logger.info('Publicando propiedad en ML', { tenantId, propertyId });
      
      // 1. Verificar que el tenant tiene ML configurado
      const mlConfig = await prisma.MercadoLibreConfig.findFirst({ where: { tenantId, isActive: true } });
      
      if (!mlConfig) {
        return res.status(400).json({
          success: false,
          message: 'No estás conectado a MercadoLibre. Conecta tu cuenta primero.'
        });
      }
      
      // 2. Verificar si el token está expirado
      const now = new Date();
      let accessToken = this.decryptStoredToken(mlConfig, 'accessToken');
      if (mlConfig.tokenExpiresAt < now) {
        const refreshedConfig = await this.refreshAccessToken(mlConfig);
        accessToken = this.decryptStoredToken(refreshedConfig, 'accessToken');
      }
      
      // 3. Verificar que la propiedad no esté ya publicada
      const existingListing = await prisma.PropertyMLListings.findFirst({ where: { propertyId: parseInt(propertyId), tenantId } });
      
      if (existingListing && existingListing.mlStatus === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Esta propiedad ya está publicada en MercadoLibre',
          mlListingId: existingListing.mlListingId,
          permalink: existingListing.mlPermalink
        });
      }
      
      // 4. Obtener propiedad
      const property = await prisma.Property.findFirst({ where: { propertyId: parseInt(propertyId), tenantId } });
      
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Propiedad no encontrada'
        });
      }

      const validation = validatePropertyForMlPublish(property);
      if (!validation.ok) {
        return res.status(400).json({
          success: false,
          message: `Completá antes de publicar: ${validation.missing.join(', ')}.`,
          missing: validation.missing,
        });
      }
      
      // 5. Obtener plan del tenant para determinar tipo de publicación
      const subscription = await prisma.subscriptions.findFirst({
        where: {
          tenantId,
          status: { in: ['trialing', 'active'] },
        },
        include: { plans: true },
        orderBy: { createdAt: 'desc' },
      });
      
      const listingType = subscription?.plans?.planId
        ? getListingType(subscription.plans.planId)
        : 'classified';

      const mlData = this.buildItemCreatePayload(property, listingType);

      logger.info('Datos preparados para ML', {
        title: mlData.title,
        category: mlData.category_id,
        price: mlData.price,
        pictures: mlData.pictures.length
      });
      
      // 7. Publicar en ML
      const response = await mlPost('/items', accessToken, mlData);
      
      const { id: mlListingId, permalink, status } = response;
      
      logger.info('Publicación creada en ML', { tenantId, mlListingId, status });
      
      // 8. Guardar en DB
      await prisma.PropertyMLListings.upsert({
        where: {
          propertyId_tenantId: {
            propertyId: parseInt(propertyId),
            tenantId,
          },
        },
        update: {
          mlListingId,
          mlStatus: status || 'active',
          mlPermalink: permalink,
          mlTitle: mlData.title,
          mlPrice: mlData.price,
          lastSync: new Date(),
          syncErrors: null,
        },
        create: {
          propertyId: parseInt(propertyId),
          tenantId,
          mlListingId,
          mlStatus: status || 'active',
          mlPermalink: permalink,
          mlTitle: mlData.title,
          mlPrice: mlData.price,
          lastSync: new Date(),
        },
      });
      
      res.json({
        success: true,
        message: 'Propiedad publicada en MercadoLibre exitosamente',
        mlListingId,
        permalink,
        status
      });
    } catch (error) {
      logger.error('Error al publicar en ML', { tenantId, propertyId, error: error.message });
      
      // Guardar error en DB si existe la propiedad
      const { propertyId } = req.params;
      const { tenantId } = req.user;
      
      await prisma.PropertyMLListings.updateMany({
        where: { propertyId: parseInt(propertyId), tenantId },
        data: {
          syncErrors: error.message,
          lastSync: new Date(),
        },
      });
      
      res.status(500).json({
        success: false,
        message: formatMlPublishError(error),
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

  buildItemLocation(property) {
    if (!property.address) return null;
    const location = { address_line: property.address };
    if (property.neighborhood) {
      location.neighborhood = { name: property.neighborhood };
    }
    if (property.city) {
      location.city = { name: property.city };
    }
    return location;
  }

  buildItemCreatePayload(property, listingType) {
    const payload = {
      title: this.buildTitle(property),
      category_id: getMercadoLibreCategory(property),
      price: parseFloat(property.price),
      currency_id: 'ARS',
      available_quantity: 1,
      buying_mode: 'classified',
      listing_type_id: listingType,
      condition: 'not_specified',
      description: this.buildDescription(property),
      pictures: this.buildPictures(property),
      attributes: this.buildAttributes(property),
    };
    const location = this.buildItemLocation(property);
    if (location) payload.location = location;
    return payload;
  }

  buildItemUpdatePayload(property) {
    const payload = {
      title: this.buildTitle(property),
      price: parseFloat(property.price),
      pictures: this.buildPictures(property),
      attributes: this.buildAttributes(property),
    };
    const location = this.buildItemLocation(property);
    if (location) payload.location = location;
    return payload;
  }

  /**
   * Sincroniza una propiedad ya publicada en ML (título, precio, fotos, descripción, atributos).
   * Usado tras editar en GestProp y desde POST /listings/:propertyId/sync.
   */
  async syncPropertyListing(tenantId, propertyId) {
    const pid = parseInt(propertyId, 10);
    if (!Number.isFinite(pid)) {
      return { synced: false, skipped: 'invalid_property_id' };
    }

    const listing = await prisma.PropertyMLListings.findFirst({
      where: { tenantId, propertyId: pid },
    });

    if (!listing?.mlListingId) {
      return { synced: false, skipped: 'no_listing' };
    }

    if (!['active', 'paused'].includes((listing.mlStatus || '').toLowerCase())) {
      return {
        synced: false,
        skipped: 'listing_not_editable',
        mlStatus: listing.mlStatus,
      };
    }

    const mlConfig = await this.getActiveMlConfig(tenantId);
    if (!mlConfig) {
      return { synced: false, skipped: 'not_connected' };
    }

    const property = await prisma.Property.findFirst({
      where: { propertyId: pid, tenantId },
    });
    if (!property) {
      return { synced: false, skipped: 'property_not_found' };
    }

    const accessToken = await this.getAccessTokenForConfig(mlConfig);

    const itemBody = this.buildItemUpdatePayload(property);
    await mlPut(`/items/${listing.mlListingId}`, accessToken, itemBody);

    const plainDescription = this.buildDescription(property);
    try {
      await mlPut(`/items/${listing.mlListingId}/description?api_version=2`, accessToken, {
        plain_text: plainDescription,
      });
    } catch (descErr) {
      // Si no existía descripción, crear con POST
      if (/404|not found|bad request/i.test(descErr.message || '')) {
        await mlPost(`/items/${listing.mlListingId}/description`, accessToken, {
          plain_text: plainDescription,
        });
      } else {
        throw descErr;
      }
    }

    await prisma.PropertyMLListings.update({
      where: { id: listing.id },
      data: {
        mlTitle: itemBody.title,
        mlPrice: itemBody.price,
        lastSync: new Date(),
        syncErrors: null,
      },
    });

    logger.info('Propiedad sincronizada con ML', {
      tenantId,
      propertyId: pid,
      mlListingId: listing.mlListingId,
    });

    return {
      synced: true,
      mlListingId: listing.mlListingId,
      mlPermalink: listing.mlPermalink,
    };
  }

  async recordSyncError(tenantId, propertyId, message) {
    await prisma.PropertyMLListings.updateMany({
      where: { tenantId, propertyId: parseInt(propertyId, 10) },
      data: { syncErrors: message, lastSync: new Date() },
    });
  }

  /**
   * POST /api/mercadolibre/listings/:propertyId/sync
   */
  async syncListing(req, res) {
    const { tenantId } = req.user;
    const { propertyId } = req.params;
    try {
      const result = await this.syncPropertyListing(tenantId, propertyId);
      if (result.synced) {
        return res.json({
          success: true,
          message: 'Publicación actualizada en Mercado Libre',
          ...result,
        });
      }

      const messages = {
        no_listing: 'Esta propiedad no tiene publicación en Mercado Libre',
        not_connected: 'Conectá Mercado Libre en Integraciones',
        listing_not_editable: `No se puede editar un aviso en estado "${result.mlStatus}"`,
        property_not_found: 'Propiedad no encontrada',
      };

      const statusCode = result.skipped === 'not_connected' ? 400 : 404;
      return res.status(statusCode).json({
        success: false,
        message: messages[result.skipped] || 'No se pudo sincronizar',
        ...result,
      });
    } catch (error) {
      logger.error('Error sync listing ML', { tenantId, propertyId, error: error.message });
      await this.recordSyncError(tenantId, propertyId, error.message).catch(() => {});
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al sincronizar con Mercado Libre',
      });
    }
  }
  
  /**
   * Actualizar estado de publicación (pausar/reactivar)
   */
  async updateListingStatus(req, res) {
    try {
      const { tenantId } = req.user;
      const { propertyId } = req.params;
      const { status } = req.body; // 'paused' o 'active'
      
      logger.info('Actualizando estado ML', { tenantId, propertyId, status });
      
      // Validar status
      if (!['paused', 'active'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Usa "paused" o "active"'
        });
      }
      
      // Obtener config y listing
      const mlConfig = await prisma.MercadoLibreConfig.findFirst({ where: { tenantId, isActive: true } });
      
      if (!mlConfig) {
        return res.status(400).json({
          success: false,
          message: 'No estás conectado a MercadoLibre'
        });
      }
      
      const listing = await prisma.PropertyMLListings.findFirst({ where: { propertyId: parseInt(propertyId), tenantId } });
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Publicación no encontrada'
        });
      }
      
      // Actualizar en ML
      const accessToken = this.decryptStoredToken(mlConfig, 'accessToken');
      
      await mlPut(`/items/${listing.mlListingId}`, accessToken, {
        status
      });
      
      // Actualizar en DB
      await prisma.PropertyMLListings.update({
        where: { id: listing.id },
        data: {
          mlStatus: status,
          lastSync: new Date(),
        }
      });
      
      logger.info('Estado ML actualizado', { tenantId, propertyId, status });
      
      res.json({
        success: true,
        message: `Publicación ${status === 'paused' ? 'pausada' : 'reactivada'} exitosamente`,
        status
      });
    } catch (error) {
      logger.error('Error al actualizar estado ML', { tenantId, error: error.message });
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
      
      logger.info('Eliminando publicación ML', { tenantId, propertyId });
      
      const mlConfig = await prisma.MercadoLibreConfig.findFirst({ where: { tenantId, isActive: true } });
      
      if (!mlConfig) {
        return res.status(400).json({
          success: false,
          message: 'No estás conectado a MercadoLibre'
        });
      }
      
      const listing = await prisma.PropertyMLListings.findFirst({ where: { propertyId: parseInt(propertyId), tenantId } });
      
      if (!listing) {
        return res.status(404).json({
          success: false,
          message: 'Publicación no encontrada'
        });
      }
      
      // Cerrar en ML
      const accessToken = this.decryptStoredToken(mlConfig, 'accessToken');
      
      await mlPut(`/items/${listing.mlListingId}`, accessToken, {
        status: 'closed',
        deleted: true
      });
      
      // Eliminar de DB
      await prisma.PropertyMLListings.delete({ where: { id: listing.id } });
      
      logger.info('Publicación ML eliminada', { tenantId, propertyId });
      
      res.json({
        success: true,
        message: 'Publicación eliminada de MercadoLibre'
      });
    } catch (error) {
      logger.error('Error al eliminar publicación ML', { tenantId, propertyId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error al eliminar publicación'
      });
    }
  }
  
  // ========================================
  // 3. PREGUNTAS / CONSULTAS
  // ========================================

  /**
   * Crea o actualiza leads en CRM por cada pregunta ML (clave única tenant + mercadolibreQuestionId).
   */
  async syncMlQuestionsToLeads(tenantId, questionsPayload) {
    for (const q of questionsPayload) {
      try {
        const mqid = q.questionId != null ? String(q.questionId).trim() : '';
        if (!mqid) continue;

        const nick = typeof q.buyerNickname === 'string' ? q.buyerNickname.trim() : '';
        const displayName = nick || (q.buyerId != null ? `Consulta ML (${q.buyerId})` : 'Consulta Mercado Libre');

        const lines = [
          `[Mercado Libre — pregunta #${mqid}]`,
          q.propertyAddress ? `Propiedad: ${q.propertyAddress}` : null,
          q.operationTypeHint ? `Operación: ${q.operationTypeHint}` : null,
          q.mlPermalink ? `Publicación: ${q.mlPermalink}` : null,
          '',
          (q.text && String(q.text).trim()) || '(sin texto)',
        ];
        const notes = lines.filter((l) => l != null && l !== '').join('\n');

        const propertyId = q.propertyId != null ? Number(q.propertyId) : null;

        await prisma.leads.upsert({
          where: {
            tenantId_mercadolibreQuestionId: {
              tenantId,
              mercadolibreQuestionId: mqid,
            },
          },
          create: {
            tenantId,
            name: displayName.slice(0, 255),
            notes,
            mercadolibreQuestionId: mqid,
            propertyId: Number.isFinite(propertyId) ? propertyId : null,
            operationType: q.operationTypeHint || null,
            zone: q.zoneHint || null,
          },
          update: {
            name: displayName.slice(0, 255),
            notes,
            ...(Number.isFinite(propertyId) ? { propertyId } : {}),
            ...(q.operationTypeHint ? { operationType: q.operationTypeHint } : {}),
            ...(q.zoneHint != null ? { zone: q.zoneHint } : {}),
          },
        });
      } catch (err) {
        logger.warn('syncMlQuestionsToLeads: upsert omitido', {
          tenantId,
          questionId: q?.questionId,
          message: err.message,
        });
      }
    }
  }

  /**
   * Obtener preguntas de todas las publicaciones del tenant
   */
  async getQuestions(req, res) {
    const { tenantId } = req.user;
    try {
      const mlConfig = await this.getActiveMlConfig(tenantId);
      if (!mlConfig) {
        return res.status(400).json({ success: false, message: 'No estás conectado a MercadoLibre' });
      }

      const allQuestions = await this.fetchUnansweredQuestionsForTenant(tenantId);
      await this.syncMlQuestionsToLeads(tenantId, allQuestions);

      res.json({ success: true, questions: allQuestions });
    } catch (error) {
      logger.error('Error al obtener preguntas ML', { tenantId, error: error.message });
      res.status(500).json({ success: false, message: 'Error al obtener preguntas' });
    }
  }

  /**
   * Responder una pregunta
   */
  async answerQuestion(req, res) {
    const { tenantId } = req.user;
    const { questionId } = req.params;
    const { text } = req.body;
    try {
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'El texto de la respuesta es requerido' });
      }
      const mlConfig = await prisma.MercadoLibreConfig.findFirst({ where: { tenantId, isActive: true } });
      if (!mlConfig) {
        return res.status(400).json({ success: false, message: 'No estás conectado a MercadoLibre' });
      }

      let accessToken = this.decryptStoredToken(mlConfig, 'accessToken');
      if (mlConfig.tokenExpiresAt < new Date()) {
        const refreshed = await this.refreshAccessToken(mlConfig);
        accessToken = this.decryptStoredToken(refreshed, 'accessToken');
      }

      await mlPost('/answers', accessToken, { question_id: parseInt(questionId), text: text.trim() });

      logger.info('Pregunta ML respondida', { tenantId, questionId });
      res.json({ success: true, message: 'Respuesta enviada correctamente' });
    } catch (error) {
      logger.error('Error al responder pregunta ML', { tenantId, questionId, error: error.message });
      res.status(500).json({ success: false, message: error.message || 'Error al responder la pregunta' });
    }
  }

  mapMlQuestionToPayload(q, listing) {
    const p = listing?.Property;
    const zoneHint = [p?.neighborhood, p?.city].filter(Boolean).join(' · ') || null;
    return {
      questionId: q.id,
      text: q.text,
      status: q.status,
      dateCreated: q.date_created,
      buyerId: q.from?.id,
      buyerNickname: q.from?.nickname,
      mlListingId: listing?.mlListingId || q.item_id,
      mlPermalink: listing?.mlPermalink,
      propertyId: listing?.propertyId,
      propertyAddress: p?.address || 'Sin dirección',
      propertyType: p?.typeProperty || '',
      operationTypeHint: p?.type ? String(p.type) : null,
      zoneHint,
      answer: q.answer || null,
    };
  }

  async fetchUnansweredQuestionsForTenant(tenantId) {
    const mlConfig = await this.getActiveMlConfig(tenantId);
    if (!mlConfig) return [];

    const listings = await prisma.PropertyMLListings.findMany({
      where: { tenantId },
      include: {
        Property: {
          select: {
            propertyId: true,
            address: true,
            typeProperty: true,
            type: true,
            city: true,
            neighborhood: true,
          },
        },
      },
    });

    if (listings.length === 0) return [];

    const accessToken = await this.getAccessTokenForConfig(mlConfig);

    const questionsPerListing = await Promise.allSettled(
      listings.map(async (listing) => {
        const data = await mlGet(
          `/questions/search?item_id=${listing.mlListingId}&status=UNANSWERED&sort_fields=date_created&sort_types=DESC`,
          accessToken
        );
        return (data.questions || []).map((q) => this.mapMlQuestionToPayload(q, listing));
      })
    );

    return questionsPerListing
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }

  /**
   * Webhook de notificaciones Mercado Libre (preguntas, ítems).
   * POST /api/webhooks/mercadolibre
   */
  async handleWebhook(req, res) {
    res.status(200).send('OK');

    const body = req.body || {};
    setImmediate(() => {
      this.processMlWebhookNotification(body).catch((err) => {
        logger.error('Error procesando webhook ML', { error: err.message, topic: body.topic });
      });
    });
  }

  async processMlWebhookNotification(body) {
    const { topic, resource, user_id: userId } = body;
    if (!topic || !userId) return;

    const config = await prisma.MercadoLibreConfig.findFirst({
      where: { mlUserId: String(userId), isActive: true },
    });
    if (!config) {
      logger.warn('Webhook ML sin tenant para user_id', { userId, topic });
      return;
    }

    const accessToken = await this.getAccessTokenForConfig(config);

    if (topic === 'questions' && resource) {
      const match = String(resource).match(/questions\/(\d+)/i);
      const questionId = match?.[1];
      if (!questionId) return;

      const q = await mlGet(`/questions/${questionId}`, accessToken);
      if (!q || q.status !== 'UNANSWERED') return;

      const listing = await prisma.PropertyMLListings.findFirst({
        where: { tenantId: config.tenantId, mlListingId: String(q.item_id) },
        include: {
          Property: {
            select: {
              propertyId: true,
              address: true,
              typeProperty: true,
              type: true,
              city: true,
              neighborhood: true,
            },
          },
        },
      });

      const payload = this.mapMlQuestionToPayload(q, listing);
      await this.syncMlQuestionsToLeads(config.tenantId, [payload]);
      logger.info('Webhook ML: pregunta sincronizada a leads', {
        tenantId: config.tenantId,
        questionId,
      });
      return;
    }

    if (topic === 'items' && resource) {
      const match = String(resource).match(/items\/([A-Z0-9]+)/i);
      const itemId = match?.[1];
      if (!itemId) return;

      const item = await mlGet(`/items/${itemId}`, accessToken);
      const listingUpdate = {
        mlStatus: item.status,
        lastSync: new Date(),
      };
      if (item.price != null) listingUpdate.mlPrice = parseFloat(item.price);

      await prisma.PropertyMLListings.updateMany({
        where: { tenantId: config.tenantId, mlListingId: itemId },
        data: listingUpdate,
      });
      logger.info('Webhook ML: ítem actualizado', { tenantId: config.tenantId, itemId, status: item.status });
    }
  }

  /**
   * Obtener lista de publicaciones del tenant
   */
  async getListings(req, res) {
    try {
      const { tenantId } = req.user;
      
      const listings = await prisma.PropertyMLListings.findMany({
        where: { tenantId },
        include: {
          Property: {
            select: {
              propertyId: true,
              address: true,
              price: true,
              typeProperty: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      res.json({
        success: true,
        listings
      });
    } catch (error) {
      logger.error('Error al obtener listings ML', { tenantId, error: error.message });
      res.status(500).json({
        success: false,
        message: 'Error al obtener publicaciones'
      });
    }
  }
}

module.exports = new MercadoLibreController();
