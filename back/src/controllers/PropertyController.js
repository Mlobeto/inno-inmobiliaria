const prisma = require('../utils/prismaClient');
const { logAudit } = require('../utils/audit');

const OPERATION_TYPE_MAP = {
  venta: 'venta',
  alquiler: 'alquiler',
  sale: 'venta',
  rent: 'alquiler',
};

const LEGACY_LEGAL_STATUS_MAP = {
  escritura: 'DEED',
  'escritura en tramite': 'DEED_IN_PROCESS',
  escritura_en_tramite: 'DEED_IN_PROCESS',
  boleto: 'PURCHASE_AGREEMENT',
  posesion: 'POSSESSION',
  cesion_derechos: 'ASSIGNMENT_OF_RIGHTS',
  'sesión de derechos posesorios': 'ASSIGNMENT_OF_RIGHTS',
  herencia: 'INHERITANCE_IN_PROCESS',
  fideicomiso: 'TRUST',
  usucapion: 'ADVERSE_POSSESSION',
  'prescripcion en tramite': 'ADVERSE_POSSESSION',
  regularizacion: 'TITLE_REGULARIZATION',
  'prescripcion adjudicada': 'TITLE_REGULARIZATION',
  ph: 'HORIZONTAL_PROPERTY',
  loteo: 'SUBDIVISION',
};

const VALID_LEGAL_STATUS = new Set([
  'DEED',
  'DEED_IN_PROCESS',
  'PURCHASE_AGREEMENT',
  'POSSESSION',
  'ASSIGNMENT_OF_RIGHTS',
  'INHERITANCE_IN_PROCESS',
  'TRUST',
  'ADVERSE_POSSESSION',
  'TITLE_REGULARIZATION',
  'HORIZONTAL_PROPERTY',
  'SUBDIVISION',
]);

const normalizeOperationType = (value) => {
  if (!value || typeof value !== 'string') return null;
  return OPERATION_TYPE_MAP[value.toLowerCase()] || null;
};

const normalizeLegalStatus = (value) => {
  if (!value || typeof value !== 'string') return null;

  const upperValue = value.toUpperCase();
  if (VALID_LEGAL_STATUS.has(upperValue)) {
    return upperValue;
  }

  return LEGACY_LEGAL_STATUS_MAP[value.toLowerCase()] || null;
};

const addLegacyLegalStatus = (property) => ({
  ...property,
  escritura: property.legalStatus,
});

// POST: Crear una propiedad
exports.createProperty = async (req, res) => {
    try {
      const {
        address,
        neighborhood,
        city,
        type,
        operationType,
        typeProperty,
        price,
        precioReferencia,
        images,
        comision,
        legalStatus,
        escritura,
        matriculaOPadron,
        frente,
        profundidad,
        linkInstagram,
        linkMaps,
        rooms,
        socio,
        inventory,
        superficieCubierta,
        superficieTotal,
        rentalType,
        minStayDays,
        currency,
      } = req.body;
  
      const normalizedOperationType = normalizeOperationType(operationType || type);
      const normalizedLegalStatus = normalizeLegalStatus(legalStatus || escritura);

      // Validación básica - solo campos requeridos según el modelo
      if (
        !address ||
        !neighborhood ||
        !city ||
        !normalizedOperationType ||
        !typeProperty ||
        !price ||
        !normalizedLegalStatus ||
        !comision
      ) {
        return res.status(400).json({
          error: "Faltan datos requeridos",
          details: "Por favor asegúrese de que todos los campos estén completos.",
        });
      }
  
      // Validación de tipo de precio
      if (isNaN(price)) {
        return res.status(400).json({
          error: "El precio debe ser un número válido",
          details: `Precio recibido: ${price}`,
        });
      }
  
      // Convertir rooms a número si está presente
      const parsedRooms = rooms ? parseInt(rooms, 10) : null;
      if (rooms && isNaN(parsedRooms)) {
        return res.status(400).json({
          error: "El campo 'rooms' debe ser un número válido",
          details: `Valor recibido para 'rooms': ${rooms}`,
        });
      }
  
      // Crear la propiedad
      const { tenantId } = req.user; // Obtener tenantId del token JWT
      
      const newProperty = await prisma.Property.create({
        data: {
          tenantId,
          address,
          neighborhood,
          city,
          type: normalizedOperationType,
          typeProperty,
          price: parseFloat(price),
          precioReferencia: precioReferencia ? parseFloat(precioReferencia) : null,
          images: images || [],
          comision: parseFloat(comision),
          legalStatus: normalizedLegalStatus,
          matriculaOPadron: matriculaOPadron || null,
          frente: frente || null,
          profundidad: profundidad || null,
          linkInstagram: linkInstagram || null,
          linkMaps: linkMaps || null,
          rooms: parsedRooms,
          isAvailable: true,
          description: req.body.description || "",
          plantType: req.body.plantType || null,
          plantQuantity: req.body.plantQuantity ? parseInt(req.body.plantQuantity, 10) : null,
          bathrooms: req.body.bathrooms ? parseInt(req.body.bathrooms, 10) : null,
          highlights: req.body.highlights || "",
          socio: socio || null,
          inventory: inventory || null,
          superficieCubierta: superficieCubierta || null,
          superficieTotal: superficieTotal || null,
          requisito: req.body.requisito || null,
          rentalType: rentalType || 'TRADICIONAL',
          minStayDays: minStayDays ? parseInt(minStayDays, 10) : null,
          currency: ['ARS', 'USD'].includes(currency) ? currency : 'ARS',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Si se proporciona idClient y role, crear la relación
      if (req.body.idClient && req.body.role) {
        console.log(`Creando relación: Cliente ${req.body.idClient} como ${req.body.role} de propiedad ${newProperty.propertyId}`);
        
        await prisma.ClientProperties.create({
          data: {
            tenantId,
            clientId: req.body.idClient,
            propertyId: newProperty.propertyId,
            role: req.body.role,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });

        console.log('Relación creada exitosamente');
      }
  
      // Responder con la propiedad creada
      logAudit({
        tenantId,
        adminId: req.user.adminId,
        action: 'CREATE',
        resource: 'property',
        resourceId: newProperty.propertyId,
        newValues: { address: newProperty.address, type: newProperty.type, typeProperty: newProperty.typeProperty, price: newProperty.price },
        req,
      });
      res.status(201).json(addLegacyLegalStatus(newProperty));
    } catch (error) {
      console.error("Error al crear propiedad:", error);
      res.status(500).json({
        error: "Error al crear la propiedad",
        details: error.message,
        stack: error.stack,
      });
    }
  };
  

// GET: Obtener todas las propiedades de un cliente
exports.getPropertiesByIdClient = async (req, res) => {
  try {
    const { idClient } = req.params;
    const client = await prisma.Clients.findUnique({
      where: { idClient: parseInt(idClient) },
      include: { ClientProperties: { include: { Property: true } } },
    });
    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.status(200).json(client.ClientProperties.map(cp => cp.Property));
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al obtener las propiedades del cliente",
        details: error.message,
      });
  }
};

exports.getPropertiesByType = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { type } = req.params;
    if (!["venta", "alquiler"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'Tipo inválido. Debe ser "venta" o "alquiler".' });
    }

    const properties = await prisma.Property.findMany({ where: { type, tenantId } });
    res.status(200).json(properties);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al obtener las propiedades por tipo",
        details: error.message,
      });
  }
};

// PUT: Actualizar una propiedad
exports.updateProperty = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { propertyId } = req.params;
    
    console.log('[UpdateProperty] Datos recibidos:', {
      propertyId,
      tenantId,
      body: req.body
    });

    const cleanedData = { ...req.body };
    const numericFields = ['precioReferencia', 'plantQuantity', 'rooms', 'bathrooms'];
    const textFields = ['frente', 'profundidad', 'matriculaOPadron', 'socio', 'plantType'];
    
    numericFields.forEach(field => {
      if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
        cleanedData[field] = null;
      }
    });
    
    // Limpiar campos de texto opcionales: convertir strings vacíos a null
    textFields.forEach(field => {
      if (cleanedData[field] === '') {
        cleanedData[field] = null;
      }
    });

    // Mantener requisito si viene en el body
    if (req.body.requisito !== undefined) {
      cleanedData.requisito = req.body.requisito || null;
    }

    // Validar y normalizar currency si viene en el body
    if (req.body.currency !== undefined) {
      cleanedData.currency = ['ARS', 'USD'].includes(req.body.currency) ? req.body.currency : 'ARS';
    }

    const normalizedOperationType = normalizeOperationType(cleanedData.operationType || cleanedData.type);
    if ((cleanedData.operationType !== undefined || cleanedData.type !== undefined) && !normalizedOperationType) {
      return res.status(400).json({
        error: "Tipo de operación inválido",
        details: "Use venta/alquiler o sale/rent",
      });
    }
    if (normalizedOperationType) {
      cleanedData.type = normalizedOperationType;
    }
    delete cleanedData.operationType;

    const normalizedLegalStatus = normalizeLegalStatus(cleanedData.legalStatus || cleanedData.escritura);
    if ((cleanedData.legalStatus !== undefined || cleanedData.escritura !== undefined) && !normalizedLegalStatus) {
      return res.status(400).json({
        error: "Estado legal inválido",
      });
    }
    if (normalizedLegalStatus) {
      cleanedData.legalStatus = normalizedLegalStatus;
    }
    delete cleanedData.escritura;

    const result = await prisma.Property.updateMany({ where: { propertyId: parseInt(propertyId), tenantId }, data: cleanedData });

    
    console.log('[UpdateProperty] Resultado:', result);
    
    if (!result.count) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
    
    logAudit({
      tenantId,
      adminId: req.user.adminId,
      action: 'UPDATE',
      resource: 'property',
      resourceId: propertyId,
      newValues: cleanedData,
      req,
    });
    res.status(200).json({ message: "Propiedad actualizada" });
  } catch (error) {
    console.error('[UpdateProperty] Error:', {
      message: error.message,
      stack: error.stack,
      propertyId: req.params.propertyId,
      body: req.body
    });
    
    res.status(500).json({
      error: "Error al actualizar la propiedad",
      details: error.message,
    });
  }
};

// DELETE: Eliminar una propiedad
exports.deleteProperty = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { propertyId } = req.params;
    
    const result = await prisma.Property.deleteMany({ where: { propertyId: parseInt(propertyId), tenantId } });
    if (!result.count) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
    logAudit({
      tenantId,
      adminId: req.user.adminId,
      action: 'DELETE',
      resource: 'property',
      resourceId: propertyId,
      req,
    });
    res.status(200).json({ message: "Propiedad eliminada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Error al eliminar la propiedad",
        details: error.message,
      });
  }
};

/**
 * PUT /api/property/:propertyId/publish-landing
 * Publicar/despublicar propiedad en landing page
 */
exports.togglePublishLanding = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { propertyId } = req.params;
    const { isPublishedInLanding } = req.body;

    // Verificar que el tenant tenga acceso a landing pages
    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    
    if (!tenant?.features?.landingPage) {
      return res.status(403).json({ 
        error: 'Landing no disponible',
        message: 'Tu plan actual no incluye landing pages. Actualiza a Plan Profesional o Empresarial.'
      });
    }

    // Actualizar propiedad
    const updateResult = await prisma.Property.updateMany({
      where: { propertyId: parseInt(propertyId), tenantId },
      data: { isPublishedInLanding: !!isPublishedInLanding },
    });

    if (!updateResult.count) {
      return res.status(404).json({ 
        error: 'Propiedad no encontrada' 
      });
    }

    const property = await prisma.Property.findFirst({ 
      where: { propertyId: parseInt(propertyId), tenantId },
      select: { propertyId: true, address: true, isPublishedInLanding: true },
    });

    res.json({
      message: isPublishedInLanding 
        ? 'Propiedad publicada en landing' 
        : 'Propiedad oculta de landing',
      property: {
        id: property.propertyId,
        address: property.address,
        isPublishedInLanding: property.isPublishedInLanding,
      }
    });

  } catch (error) {
    console.error('Error en togglePublishLanding:', error);
    res.status(500).json({
      error: 'Error al actualizar publicación',
      details: error.message
    });
  }
};

exports.getFilteredProperties = async (req, res) => {
  try {
    const {
      type,
      city,
      neighborhood,
      priceMin,
      priceMax,
      rooms,
      typeProperty,
      planType,
      plantQuantity,
      bathrooms,
      escritura,
      legalStatus,
      comision,
      isAvailable,
      page = 1, // Página por defecto
      limit = 10, // Número de resultados por página
    } = req.query;

    // Validar precios (si priceMin existe, no debe ser mayor que priceMax)
    if (priceMin && priceMax && parseFloat(priceMin) > parseFloat(priceMax)) {
      return res.status(400).json({
        error: "El precio mínimo no puede ser mayor que el precio máximo.",
      });
    }

    // Construir el objeto 'where' para la consulta
    const where = {};

    if (type) where.type = type; // Tipo de propiedad (venta, alquiler)
    if (typeProperty) where.typeProperty = typeProperty; // Tipo específico (casa, departamento, etc.)
    if (city) where.city = city;
    if (neighborhood) where.neighborhood = neighborhood;
    if (priceMin || priceMax) {
      where.price = {};
      if (priceMin) where.price.gte = parseFloat(priceMin);
      if (priceMax) where.price.lte = parseFloat(priceMax);
    }
    if (rooms) where.rooms = rooms;
    if (planType) where.planType = planType;
    if (plantQuantity) where.plantQuantity = plantQuantity;
    if (bathrooms) where.bathrooms = bathrooms;
    const normalizedQueryLegalStatus = normalizeLegalStatus(legalStatus || escritura);
    if (legalStatus || escritura) {
      if (!normalizedQueryLegalStatus) {
        return res.status(400).json({
          error: "Estado legal inválido en filtros",
        });
      }
      where.legalStatus = normalizedQueryLegalStatus;
    }
    // Filtro por isAvailable, convirtiendo el string a booleano
    if (typeof isAvailable !== 'undefined') {
      where.isAvailable = isAvailable === 'true';
    }
    // Si necesitás filtrar por comision, se puede agregar igualmente:
    if (comision) where.comision = comision;

    // Paginación
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    where.tenantId = tenantId; // Filtrar por tenant
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const properties = await prisma.Property.findMany({
      where,
      take: parseInt(limit),
      skip: offset,
    });

    res.status(200).json(properties.map(addLegacyLegalStatus));
  } catch (error) {
    res.status(500).json({
      error: "Error al filtrar las propiedades",
      details: error.message,
    });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    
    const properties = await prisma.Property.findMany({
      where: { tenantId },
      include: {
        ClientProperties: {
          include: {
            Clients: {
              select: { idClient: true, name: true, email: true, mobilePhone: true, cuil: true, provincia: true, direccion: true, ciudad: true },
            },
          },
        },
      },
    });

    const formatted = properties.map(p => {
      const { ClientProperties, ...rest } = p;
      return {
        ...rest,
        escritura: rest.legalStatus,
        Clients: ClientProperties.map(cp => ({ ...cp.Clients, ClientProperty: { role: cp.role } })),
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error al obtener propiedades con clientes:", error);
    res.status(500).json({
      error: "Error al obtener propiedades con clientes",
      details: error.message,
    });
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { propertyId } = req.params;
    console.log('Params received:', req.params);
    console.log('Buscando propiedad con ID:', propertyId, 'Tenant:', tenantId);

    // Convert propertyId to integer
    const id = parseInt(propertyId);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de propiedad inválido' });
    }

    const property = await prisma.Property.findFirst({
      where: { propertyId: id, tenantId },
      include: {
        ClientProperties: {
          include: {
            Clients: {
              select: { idClient: true, name: true, email: true, mobilePhone: true },
            },
          },
        },
      },
    });

    if (!property) {
      console.log('Propiedad no encontrada con ID:', id);
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    const { ClientProperties, ...rest } = property;
    const formatted = {
      ...rest,
      escritura: rest.legalStatus,
      Clients: ClientProperties.map(cp => ({ ...cp.Clients, ClientProperty: { role: cp.role } })),
    };

    console.log('Propiedad encontrada:', JSON.stringify(formatted, null, 2));
    res.status(200).json(formatted);
  } catch (error) {
    console.error('Error completo:', error);
    res.status(500).json({
      error: 'Error al obtener la propiedad',
      details: error.message,
      stack: error.stack
    });
  }
};

// GET: Obtener texto de WhatsApp para una propiedad
exports.getWhatsAppText = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const property = await prisma.Property.findFirst({
      where: { propertyId: parseInt(id), tenantId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    // Obtener la plantilla de WhatsApp de las configuraciones del tenant
    const settings = await prisma.admin_settings.findFirst({ where: { tenant_id: tenantId } });

    // Plantilla por defecto si no existe una personalizada
    const defaultTemplate = `Gracias por ponerte en contacto con *{empresa}*! Estamos encantados de poder ayudar. 

{descripcion}

Precio: {precio}
Ubicación: {direccion}

Estamos a tu entera disposición por dudas, precio o consultas.`;

    const template = settings?.whatsapp_template || property.whatsappTemplate || defaultTemplate;

    // Formatear precio con separadores de miles
    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(property.price);

    // Crear descripción detallada de la propiedad
    let propertyDescription = `${property.typeProperty.charAt(0).toUpperCase() + property.typeProperty.slice(1)} en ${property.type}`;
    
    if (property.rooms) {
      propertyDescription += ` - ${property.rooms} habitaciones`;
    }
    if (property.bathrooms) {
      propertyDescription += `, ${property.bathrooms} baños`;
    }
    if (property.superficieTotal) {
      propertyDescription += `, ${property.superficieTotal}m²`;
    }
    if (property.neighborhood) {
      propertyDescription += ` en ${property.neighborhood}`;
    }

    const companyName = settings?.company_name || '';

    // Reemplazar variables en la plantilla
    let whatsappText = template
      .replace(/Quintero Lobeto Propiedades/g, companyName) // compatibilidad con templates legacy en DB
      .replace(/{empresa}/g, companyName)
      .replace(/{precio}/g, formattedPrice)
      .replace(/{direccion}/g, property.address)
      .replace(/{ciudad}/g, property.city || '')
      .replace(/{barrio}/g, property.neighborhood || '')
      .replace(/{tipo}/g, property.typeProperty)
      .replace(/{tipoOperacion}/g, property.type)
      .replace(/{habitaciones}/g, property.rooms || 'N/A')
      .replace(/{baños}/g, property.bathrooms || 'N/A')
      .replace(/{superficieTotal}/g, property.superficieTotal || 'N/A')
      .replace(/{superficieCubierta}/g, property.superficieCubierta || 'N/A')
      .replace(/{descripcion}/g, propertyDescription)
      .replace(/{destacados}/g, property.highlights || '')
      .replace(/{escritura}/g, property.legalStatus || '');

    // Si es finca, agregar información de plantas
    if (property.typeProperty === 'finca' && property.plantType) {
      const plantInfo = `\n\nCultivo: ${property.plantType} - ${property.plantQuantity || 0} plantas`;
      whatsappText += plantInfo;
    }

    // Si es lote, agregar medidas
    if (property.typeProperty === 'lote' && (property.frente || property.profundidad)) {
      const loteInfo = `\n\nMedidas: Frente ${property.frente || 'N/A'}m x Profundidad ${property.profundidad || 'N/A'}m`;
      whatsappText += loteInfo;
    }

    res.status(200).json({
      success: true,
      propertyId: property.propertyId,
      address: property.address,
      whatsappText: whatsappText,
      template: template,
      availableVariables: [
        '{empresa}', '{precio}', '{direccion}', '{ciudad}', '{barrio}',
        '{tipo}', '{tipoOperacion}', '{habitaciones}', '{baños}',
        '{superficieTotal}', '{superficieCubierta}', '{descripcion}',
        '{destacados}', '{escritura}'
      ]
    });

  } catch (error) {
    console.error('Error al generar texto de WhatsApp:', error);
    res.status(500).json({
      error: 'Error al generar texto de WhatsApp',
      details: error.message
    });
  }
};