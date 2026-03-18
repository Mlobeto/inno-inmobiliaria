const prisma = require('../utils/prismaClient');

// POST: Asignar una propiedad a un cliente con rol
exports.addPropertyToClientWithRole = async (req, res) => {
    try {
        const { idClient, propertyId, role, clientData } = req.body;
        const { tenantId } = req.user; // Obtener tenantId del token JWT

        // Validación de campos
        if (!propertyId || !role) {
            return res.status(400).json({
                error: 'Faltan datos requeridos',
                details: 'Asegúrese de enviar el ID de la propiedad y el rol.'
            });
        }

        // Buscar al cliente por su idClient
        let client = idClient ? await prisma.Clients.findFirst({ where: { idClient: parseInt(idClient), tenantId } }) : null;

        // Si no existe, intenta crear el cliente si se envía clientData
        if (!client) {
            if (!clientData) {
                return res.status(400).json({ error: 'Cliente no encontrado y no se proporcionaron datos para crearlo.' });
            }
            try {
                client = await prisma.Clients.create({ data: { ...clientData, tenantId } });
            } catch (error) {
                return res.status(400).json({
                    error: 'Error al crear el cliente',
                    details: error.message
                });
            }
        }

        // Buscar la propiedad por ID
        const property = await prisma.Property.findFirst({ where: { propertyId: parseInt(propertyId), tenantId } });
        if (!property) {
            return res.status(404).json({ error: 'Propiedad no encontrada' });
        }

        // Verificar si ya existe la relación entre el cliente y la propiedad
        const existingClientProperty = await prisma.ClientProperties.findFirst({
            where: { clientId: client.idClient, propertyId: parseInt(propertyId) }
        });

        if (existingClientProperty) {
            return res.status(400).json({
                error: 'La propiedad ya está asociada a este cliente',
                details: 'No se puede agregar la propiedad al cliente si ya está asociada.'
            });
        }

        // Asociar la propiedad al cliente con el rol
        await prisma.ClientProperties.create({
            data: {
                clientId: client.idClient,
                propertyId: property.propertyId,
                role: role,
                tenantId: tenantId,
            }
        });

        // Responder con éxito
        res.status(200).json({
            message: 'Propiedad asociada al cliente con rol exitosamente',
            client: client,
            property: property,
            role: role
        });

    } catch (error) {
        console.error('Error al asociar propiedad con rol:', error);
        res.status(500).json({
            error: 'Error al asociar la propiedad con el cliente',
            details: error.message
        });
    }
};