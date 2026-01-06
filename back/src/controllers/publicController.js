const { Property, Tenant, AdminSetting } = require('../data');
const { Op } = require('sequelize');

/**
 * Controlador para endpoints públicos (sin autenticación)
 * Landing pages de tenants con propiedades publicadas
 */

/**
 * GET /api/public/:subdomain
 * Obtiene datos del tenant y propiedades publicadas en su landing
 */
exports.getTenantLanding = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { type, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    // 1. Buscar tenant por subdominio
    const tenant = await Tenant.findOne({
      where: { subdomain: subdomain.toLowerCase() },
      attributes: ['tenantId', 'companyName', 'subdomain', 'features']
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Inmobiliaria no encontrada',
        message: 'No existe una inmobiliaria con este subdominio'
      });
    }

    // 2. Verificar que tenga acceso a landing pages
    if (!tenant.features?.landingPage) {
      return res.status(403).json({ 
        error: 'Landing no disponible',
        message: 'Esta inmobiliaria no tiene habilitadas las landing pages públicas'
      });
    }

    // 3. Obtener configuración de la empresa (logo, contacto, etc)
    const companySettings = await AdminSetting.findOne({
      where: { tenantId: tenant.tenantId },
      attributes: [
        'company_name',
        'company_address', 
        'company_phone',
        'company_email',
        'company_logo',
        'company_whatsapp'
      ]
    });

    // 4. Construir filtros para propiedades
    const whereConditions = {
      tenantId: tenant.tenantId,
      isPublishedInLanding: true
    };

    // Excluir propiedades vendidas o alquiladas hace más de 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    whereConditions[Op.or] = [
      // Propiedades disponibles (cualquier tipo)
      { 
        status: { [Op.notIn]: ['Vendida', 'Alquilada'] }
      },
      // Propiedades alquiladas recientemente (menos de 7 días)
      { 
        status: 'Alquilada',
        rentedAt: { [Op.gte]: sevenDaysAgo }
      }
    ];

    if (type && ['venta', 'alquiler'].includes(type.toLowerCase())) {
      whereConditions.type = type.toLowerCase();
    }

    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereConditions.price[Op.lte] = parseFloat(maxPrice);
    }

    // 5. Obtener propiedades publicadas con paginación
    const offset = (page - 1) * limit;
    
    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereConditions,
      attributes: [
        'propertyId',
        'title',
        'description',
        'type',
        'price',
        'currency',
        'address',
        'neighborhood',
        'city',
        'province',
        'country',
        'bedrooms',
        'bathrooms',
        'garages',
        'surface',
        'coveredSurface',
        'images',
        'status',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // 6. Formatear respuesta
    res.json({
      tenant: {
        name: tenant.companyName,
        subdomain: tenant.subdomain,
        logo: companySettings?.company_logo || null,
        contact: {
          phone: companySettings?.company_phone || null,
          email: companySettings?.company_email || null,
          whatsapp: companySettings?.company_whatsapp || null,
          address: companySettings?.company_address || null
        }
      },
      properties: properties.map(p => ({
        id: p.propertyId,
        title: p.title,
        description: p.description?.substring(0, 150) + '...',
        type: p.type,
        price: p.price,
        currency: p.currency,
        location: {
          address: p.address,
          neighborhood: p.neighborhood,
          city: p.city,
          province: p.province,
          country: p.country
        },
        features: {
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          garages: p.garages,
          surface: p.surface,
          coveredSurface: p.coveredSurface
        },
        images: p.images || [],
        mainImage: (p.images && p.images.length > 0) ? p.images[0] : null,
        status: p.status
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error en getTenantLanding:', error);
    res.status(500).json({ 
      error: 'Error al cargar landing',
      message: 'Ocurrió un error al obtener los datos de la inmobiliaria'
    });
  }
};

/**
 * GET /api/public/:subdomain/property/:propertyId
 * Obtiene detalle completo de una propiedad publicada
 */
exports.getPropertyDetail = async (req, res) => {
  try {
    const { subdomain, propertyId } = req.params;

    // 1. Buscar tenant por subdominio
    const tenant = await Tenant.findOne({
      where: { subdomain: subdomain.toLowerCase() },
      attributes: ['tenantId', 'companyName', 'features']
    });

    if (!tenant) {
      return res.status(404).json({ 
        error: 'Inmobiliaria no encontrada'
      });
    }

    // 2. Verificar acceso a landing
    if (!tenant.features?.landingPage) {
      return res.status(403).json({ 
        error: 'Landing no disponible'
      });
    }

    // 3. Buscar propiedad
    const property = await Property.findOne({
      where: {
        propertyId,
        tenantId: tenant.tenantId,
        isPublishedInLanding: true
      }
    });

    if (!property) {
      return res.status(404).json({ 
        error: 'Propiedad no encontrada',
        message: 'Esta propiedad no está disponible públicamente'
      });
    }

    // 4. Obtener datos de contacto
    const companySettings = await AdminSetting.findOne({
      where: { tenantId: tenant.tenantId },
      attributes: [
        'company_name',
        'company_phone',
        'company_email',
        'company_whatsapp',
        'company_logo'
      ]
    });

    // 5. Incrementar contador de vistas (opcional - implementar después)
    // await property.increment('views');

    // 6. Respuesta con todos los detalles
    res.json({
      property: {
        id: property.propertyId,
        title: property.title,
        description: property.description,
        type: property.type,
        price: property.price,
        currency: property.currency,
        location: {
          address: property.address,
          neighborhood: property.neighborhood,
          city: property.city,
          province: property.province,
          country: property.country,
          latitude: property.latitude,
          longitude: property.longitude
        },
        features: {
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          garages: property.garages,
          surface: property.surface,
          coveredSurface: property.coveredSurface,
          age: property.age,
          orientation: property.orientation
        },
        amenities: property.amenities || [],
        images: property.images || [],
        status: property.status,
        condition: property.condition
      },
      tenant: {
        name: tenant.companyName,
        contact: {
          phone: companySettings?.company_phone || null,
          email: companySettings?.company_email || null,
          whatsapp: companySettings?.company_whatsapp || null
        },
        logo: companySettings?.company_logo || null
      }
    });

  } catch (error) {
    console.error('Error en getPropertyDetail:', error);
    res.status(500).json({ 
      error: 'Error al cargar propiedad'
    });
  }
};
