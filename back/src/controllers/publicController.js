const prisma = require('../utils/prismaClient');

/**
 * Controlador para endpoints públicos (sin autenticación)
 * Landing pages de tenants con propiedades publicadas
 */

const PROPERTY_TYPE_LABELS = {
  casa: 'Casa', departamento: 'Departamento', duplex: 'Duplex',
  finca: 'Finca', local: 'Local Comercial', lote: 'Lote',
  oficina: 'Oficina', terreno: 'Terreno',
};

const buildPropertyTitle = (p) => {
  const typeName = PROPERTY_TYPE_LABELS[p.typeProperty] || p.typeProperty || 'Propiedad';
  const location = p.city || p.neighborhood || (p.address ? p.address.split(',')[0] : '');
  return location ? `${typeName} en ${location}` : typeName;
};

/**
 * GET /api/public/:subdomain
 * Obtiene datos del tenant y propiedades publicadas en su landing
 */
exports.getTenantLanding = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { type, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    const tenant = await prisma.tenants.findFirst({
      where: { subdomain: subdomain.toLowerCase() },
      select: { tenantId: true, businessName: true, subdomain: true, features: true }
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

    const companySettings = await prisma.admin_settings.findFirst({
      where: { tenant_id: tenant.tenantId },
      select: {
        company_name: true,
        company_address: true,
        company_phone: true,
        company_email: true,
        company_logo_url: true,
        company_whatsapp: true,
      }
    });

    const DAYS_SHOW_UNAVAILABLE = 15;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_SHOW_UNAVAILABLE);

    // Propiedades publicadas en landing: disponibles siempre, no disponibles solo 15 días
    const whereConditions = {
      tenantId: tenant.tenantId,
      isPublishedInLanding: true,
      OR: [
        { isAvailable: true },
        {
          isAvailable: false,
          updatedAt: { gte: cutoffDate },
        },
      ],
    };

    if (type && ['venta', 'alquiler'].includes(type.toLowerCase())) {
      whereConditions.type = type.toLowerCase();
    }

    if (req.query.typeProperty) {
      whereConditions.typeProperty = req.query.typeProperty.toLowerCase();
    }

    if (req.query.city) {
      whereConditions.city = { contains: req.query.city, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      whereConditions.price = {};
      if (minPrice) whereConditions.price.gte = parseFloat(minPrice);
      if (maxPrice) whereConditions.price.lte = parseFloat(maxPrice);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Para los filtros de ciudad y typeProperty, obtener valores únicos de las disponibles
    const [count, properties, allPublished] = await Promise.all([
      prisma.Property.count({ where: whereConditions }),
      prisma.Property.findMany({
        where: whereConditions,
        orderBy: [{ isAvailable: 'desc' }, { updatedAt: 'desc' }],
        take: parseInt(limit),
        skip: offset,
      }),
      prisma.Property.findMany({
        where: {
          tenantId: tenant.tenantId,
          isPublishedInLanding: true,
          OR: [
            { isAvailable: true },
            { isAvailable: false, updatedAt: { gte: cutoffDate } },
          ],
        },
        select: { city: true, typeProperty: true },
      }),
    ]);

    const cities = [...new Set(allPublished.map(p => p.city).filter(Boolean))].sort();
    const propertyTypes = [...new Set(allPublished.map(p => p.typeProperty).filter(Boolean))].sort();

    // 6. Formatear respuesta
    res.json({
      tenant: {
        name: tenant.businessName,
        subdomain: tenant.subdomain,
        logo: companySettings?.company_logo_url || null,
        contact: {
          phone: companySettings?.company_phone || null,
          email: companySettings?.company_email || null,
          whatsapp: companySettings?.company_whatsapp || null,
          address: companySettings?.company_address || null
        }
      },
      properties: properties.map(p => ({
        id: p.propertyId,
        title: buildPropertyTitle(p),
        description: p.description ? p.description.substring(0, 150) + '...' : null,
        type: p.type,
        rentalType: p.rentalType || 'TRADICIONAL',
        minStayDays: p.minStayDays || null,
        typeProperty: p.typeProperty,
        price: p.price,
        location: {
          address: p.address,
          neighborhood: p.neighborhood,
          city: p.city,
        },
        features: {
          rooms: p.rooms,
          bathrooms: p.bathrooms,
          superficieTotal: p.superficieTotal,
          superficieCubierta: p.superficieCubierta,
        },
        images: p.images || [],
        mainImage: (p.images && p.images.length > 0) ? p.images[0] : null,
        isAvailable: p.isAvailable,
        closedAt: p.isAvailable === false ? p.updatedAt : null,
        highlights: p.highlights || null,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      filters: {
        cities,
        propertyTypes,
      },
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

    const tenant = await prisma.tenants.findFirst({
      where: { subdomain: subdomain.toLowerCase() },
      select: { tenantId: true, businessName: true, features: true }
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

    const property = await prisma.Property.findFirst({
      where: {
        propertyId: parseInt(propertyId),
        tenantId: tenant.tenantId,
        isPublishedInLanding: true,
      }
    });

    if (!property) {
      return res.status(404).json({ 
        error: 'Propiedad no encontrada',
        message: 'Esta propiedad no está disponible públicamente'
      });
    }

    const companySettings = await prisma.admin_settings.findFirst({
      where: { tenant_id: tenant.tenantId },
      select: {
        company_name: true,
        company_phone: true,
        company_email: true,
        company_whatsapp: true,
        company_logo_url: true,
      }
    });

    // 5. Incrementar contador de vistas (opcional - implementar después)
    // await property.increment('views');

    // 6. Respuesta con todos los detalles
    res.json({
      property: {
        id: property.propertyId,
        title: buildPropertyTitle(property),
        description: property.description,
        type: property.type,
        rentalType: property.rentalType || 'TRADICIONAL',
        minStayDays: property.minStayDays || null,
        typeProperty: property.typeProperty,
        price: property.price,
        location: {
          address: property.address,
          neighborhood: property.neighborhood,
          city: property.city,
        },
        features: {
          rooms: property.rooms,
          bathrooms: property.bathrooms,
          superficieTotal: property.superficieTotal,
          superficieCubierta: property.superficieCubierta,
          frente: property.frente,
          profundidad: property.profundidad,
        },
        images: property.images || [],
        isAvailable: property.isAvailable,
        highlights: property.highlights || null,
        linkMaps: property.linkMaps || null,
        linkInstagram: property.linkInstagram || null,
      },
      tenant: {
        name: tenant.businessName,
        logo: companySettings?.company_logo_url || null,
        contact: {
          phone: companySettings?.company_phone || null,
          email: companySettings?.company_email || null,
          whatsapp: companySettings?.company_whatsapp || null
        }
      }
    });

  } catch (error) {
    console.error('Error en getPropertyDetail:', error);
    res.status(500).json({ 
      error: 'Error al cargar propiedad'
    });
  }
};

/**
 * GET /api/public/:subdomain/loteos
 * Lista los loteos publicados del tenant
 */
exports.getPublicLoteos = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const tenant = await prisma.tenants.findFirst({
      where: { subdomain: subdomain.toLowerCase() },
      select: { tenantId: true, businessName: true, features: true },
    });

    if (!tenant) return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
    if (!tenant.features?.landingPage) return res.status(403).json({ error: 'Landing no disponible' });

    const loteos = await prisma.loteos.findMany({
      where: { tenantId: tenant.tenantId, isPublished: true },
      include: {
        lotes: { orderBy: { number: 'asc' } },
        _count: { select: { lotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, loteos });
  } catch (error) {
    console.error('Error en getPublicLoteos:', error);
    return res.status(500).json({ error: 'Error al cargar loteos' });
  }
};

/**
 * GET /api/public/:subdomain/loteos/:loteoId
 * Detalle de un loteo con todos sus lotes
 */
exports.getPublicLoteoDetail = async (req, res) => {
  try {
    const { subdomain, loteoId } = req.params;

    const tenant = await prisma.tenants.findFirst({
      where: { subdomain: subdomain.toLowerCase() },
      select: { tenantId: true, businessName: true, features: true },
    });

    if (!tenant) return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
    if (!tenant.features?.landingPage) return res.status(403).json({ error: 'Landing no disponible' });

    const loteo = await prisma.loteos.findFirst({
      where: { id: Number(loteoId), tenantId: tenant.tenantId, isPublished: true },
      include: { lotes: { orderBy: { number: 'asc' } } },
    });

    if (!loteo) return res.status(404).json({ error: 'Loteo no encontrado' });

    const companySettings = await prisma.admin_settings.findFirst({
      where: { tenant_id: tenant.tenantId },
      select: { company_name: true, company_phone: true, company_whatsapp: true, company_logo_url: true },
    });

    return res.status(200).json({
      success: true,
      loteo,
      tenant: {
        name: companySettings?.company_name || tenant.businessName,
        logo: companySettings?.company_logo_url || null,
        phone: companySettings?.company_phone || null,
        whatsapp: companySettings?.company_whatsapp || null,
      },
    });
  } catch (error) {
    console.error('Error en getPublicLoteoDetail:', error);
    return res.status(500).json({ error: 'Error al cargar loteo' });
  }
};
