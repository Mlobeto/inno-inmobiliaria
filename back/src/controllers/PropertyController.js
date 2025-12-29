const { Client, Property, ClientProperty } = require("../data");

// POST: Crear una propiedad
exports.createProperty = async (req, res) => {
    try {
      const {
        address,
        neighborhood,
        city,
        type,
        typeProperty,
        price,
        precioReferencia,
        images,
        comision,
        escritura,
        matriculaOPadron,
        frente,
        profundidad,
        linkInstagram,
        linkMaps, // ✅ Agregado
        rooms,
        socio,
        inventory,
        superficieCubierta,
        superficieTotal,
      } = req.body;
  
      // Validación básica - solo campos requeridos según el modelo
      if (
        !address ||
        !neighborhood ||
        !city ||
        !type ||
        !typeProperty ||
        !price ||
        !escritura ||
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
      const newProperty = await Property.create({
        address,
        neighborhood,
        city,
        type,
        typeProperty,
        price,
        precioReferencia: precioReferencia || null,
        images: images || [], // ✅ Opcional, array vacío por defecto
        comision,
        escritura,
        matriculaOPadron: matriculaOPadron || null,
        frente: frente || null,
        profundidad: profundidad || null,
        linkInstagram: linkInstagram || null,
        linkMaps: linkMaps || null, // ✅ Agregado
        rooms: parsedRooms,
        isAvailable: true,
        description: req.body.description || "",
        plantType: req.body.plantType || null, // ✅ Cambiado a null
        plantQuantity: req.body.plantQuantity || null, // ✅ Cambiado a null
        bathrooms: req.body.bathrooms || null, // ✅ Cambiado a null
        highlights: req.body.highlights || "",
        socio: socio || null,
        inventory: inventory || null,
        superficieCubierta: superficieCubierta || null,
        superficieTotal: superficieTotal || null
      });

      // Si se proporciona idClient y role, crear la relación
      if (req.body.idClient && req.body.role) {
        console.log(`Creando relación: Cliente ${req.body.idClient} como ${req.body.role} de propiedad ${newProperty.propertyId}`);
        
        await ClientProperty.create({
          clientId: req.body.idClient,
          propertyId: newProperty.propertyId,
          role: req.body.role
        });

        console.log('Relación creada exitosamente');
      }
  
      // Responder con la propiedad creada
      res.status(201).json(newProperty);
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
    const client = await Client.findByPk(idClient, {
      include: Property,
    });
    if (!client) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.status(200).json(client.Properties);
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
    const { type } = req.params;
    if (!["venta", "alquiler"].includes(type)) {
      return res
        .status(400)
        .json({ error: 'Tipo inválido. Debe ser "venta" o "alquiler".' });
    }

    const properties = await Property.findAll({ where: { type } });
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
    const { propertyId } = req.params;
    
    console.log('[UpdateProperty] Datos recibidos:', {
      propertyId,
      body: req.body
    });

    const updated = await Property.update(req.body, { where: { propertyId } });
    
    console.log('[UpdateProperty] Resultado:', updated);
    
    if (!updated[0]) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
    
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
    const { propertyId } = req.params;
    const deleted = await Property.destroy({ where: { propertyId } });
    if (!deleted) {
      return res.status(404).json({ error: "Propiedad no encontrada" });
    }
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
      if (priceMin) where.price[Sequelize.Op.gte] = priceMin;
      if (priceMax) where.price[Sequelize.Op.lte] = priceMax;
    }
    if (rooms) where.rooms = rooms;
    if (planType) where.planType = planType;
    if (plantQuantity) where.plantQuantity = plantQuantity;
    if (bathrooms) where.bathrooms = bathrooms;
    // Filtro por escritura
    if (escritura) where.escritura = escritura;
    // Filtro por isAvailable, convirtiendo el string a booleano
    if (typeof isAvailable !== 'undefined') {
      where.isAvailable = isAvailable === 'true';
    }
    // Si necesitás filtrar por comision, se puede agregar igualmente:
    if (comision) where.comision = comision;

    // Paginación
    const offset = (page - 1) * limit; // Calcular el offset de la página actual
    const properties = await Property.findAll({
      where,
      limit, // Limitar la cantidad de resultados por página
      offset, // Desplazamiento para la paginación
    });

    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({
      error: "Error al filtrar las propiedades",
      details: error.message,
    });
  }
};

exports.getAllProperties = async (req, res) => {
  try {
    // Obtener todas las propiedades con los clientes relacionados y sus roles
    const properties = await Property.findAll({
      include: [
        {
          model: Client,
          through: {
            attributes: ['role'], // Incluir solo el campo de rol desde la tabla intermedia
          },
          attributes: ['idClient', 'name', 'email', 'mobilePhone'], // Campos del cliente
        },
      ],
    });

    // Responder con las propiedades obtenidas
    res.status(200).json(properties);
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
    const { propertyId } = req.params;
    console.log('Params received:', req.params);
    console.log('Buscando propiedad con ID:', propertyId);

    // Convert propertyId to integer
    const id = parseInt(propertyId);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de propiedad inválido' });
    }

    const property = await Property.findByPk(id, {
      include: [
        {
          model: Client,
          through: {
            attributes: ['role'],
          },
          attributes: ['idClient', 'name', 'email', 'mobilePhone'],
        },
      ],
    });

    if (!property) {
      console.log('Propiedad no encontrada con ID:', id);
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    console.log('Propiedad encontrada:', JSON.stringify(property, null, 2));
    res.status(200).json(property);
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

    const property = await Property.findByPk(id);

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    // Plantilla por defecto si no existe una personalizada
    const defaultTemplate = `Gracias por ponerte en contacto con Quintero Lobeto Propiedades! Estamos encantados de poder ayudar. 

{descripcion}

Te comento que estamos en lanzamiento de ofertas y este es el primero!

Precio: AR$ {precio}
Ubicación: {direccion}

Estamos a tu entera disposición por dudas, precio o consultas.`;

    const template = property.whatsappTemplate || defaultTemplate;

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

    // Reemplazar variables en la plantilla
    let whatsappText = template
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
      .replace(/{escritura}/g, property.escritura || '');

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
        '{precio}', '{direccion}', '{ciudad}', '{barrio}',
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