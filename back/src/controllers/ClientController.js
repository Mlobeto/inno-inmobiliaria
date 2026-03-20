const prisma = require('../utils/prismaClient');
const { logAudit } = require('../utils/audit');

exports.createClient = async (req, res) => {
    try {
        const { tenantId } = req.user;
        console.log("POST /client - Datos recibidos:", req.body);
        console.log("POST /client - TenantId:", tenantId);
        
        const { cuil, codigoPostal, codigo_postal, ...clientData } = req.body;
        const normalizedCodigoPostal = codigo_postal ?? codigoPostal;
        const normalizedEmail = typeof clientData.email === 'string' ? clientData.email.trim().toLowerCase() : clientData.email;
        if (normalizedEmail !== undefined) {
            clientData.email = normalizedEmail;
        }

        const uniqueFilters = [];
        if (cuil) uniqueFilters.push({ cuil });
        if (normalizedEmail) uniqueFilters.push({ email: normalizedEmail });

        if (uniqueFilters.length > 0) {
            const existingClient = await prisma.Clients.findFirst({
                where: { OR: uniqueFilters },
                select: {
                    idClient: true,
                    tenantId: true,
                    cuil: true,
                    email: true,
                    deletedAt: true,
                },
            });

            if (existingClient) {
                const duplicatedField = existingClient.cuil === cuil ? 'cuil' : 'email';
                return res.status(409).json({
                    error: `Ya existe un cliente con ese ${duplicatedField}`,
                    duplicatedField,
                    duplicatedValue: duplicatedField === 'cuil' ? cuil : normalizedEmail,
                    existingClientId: existingClient.idClient,
                    existingTenantId: existingClient.tenantId,
                    isSoftDeleted: !!existingClient.deletedAt,
                });
            }
        }
        
        const newClient = await prisma.$transaction(async tx => {
            // 1. Crear el cliente
            const client = await tx.Clients.create({
                data: {
                    ...clientData,
                    cuil,
                    ...(normalizedCodigoPostal !== undefined ? { codigo_postal: normalizedCodigoPostal } : {}),
                    tenantId,
                    migrated_to_documents: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            
            console.log("POST /client - Cliente creado:", client?.idClient);
            
            // 2. Si hay CUIL, crear documento en client_documents (dual-write)
            if (cuil) {
                await tx.client_documents.create({
                    data: {
                        client_id: client.idClient,
                        tenant_id: tenantId,
                        document_type: 'TAX',
                        country: 'AR',
                        document_code: 'CUIL',
                        number: cuil,
                        is_primary: true,
                        is_verified: false,
                    }
                });
                console.log("POST /client - Documento CUIL creado en client_documents");
            }
            
            return client;
        });
        
        logAudit({
          tenantId,
          adminId: req.user.adminId,
          action: 'CREATE',
          resource: 'client',
          resourceId: newClient.idClient,
          req,
        });
        res.status(201).json(newClient);
    } catch (error) {
        console.error("POST /client - Error al crear cliente:", error);

        if (error?.code === 'P2002') {
            return res.status(409).json({
                error: 'Ya existe un cliente con email o CUIL duplicado',
                details: error.message,
            });
        }

        res.status(500).json({ error: 'Error al crear el cliente', details: error.message });
    }
};

// GET: Obtener todos los clientes
exports.getAllClients = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        
        const clients = await prisma.Clients.findMany({
            where: { tenantId }
        });
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los clientes', details: error.message });
    }
};

// GET: Obtener un cliente por ID
exports.getClientById = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        const { idClient } = req.params;
        
        const clientRaw = await prisma.Clients.findFirst({
            where: { idClient: parseInt(idClient), tenantId },
            include: {
                Leases_Leases_renterIdToClients: { include: { Property: true } },
                Leases_Leases_landlordIdToClients: { include: { Property: true } },
            }
        });
        if (!clientRaw) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        const { Leases_Leases_renterIdToClients, Leases_Leases_landlordIdToClients, ...rest } = clientRaw;
        const client = {
            ...rest,
            LeasesAsRenter: Leases_Leases_renterIdToClients,
            LeasesAsLandlord: Leases_Leases_landlordIdToClients,
        };
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el cliente', details: error.message });
    }
};

// PUT: Actualizar un cliente
exports.updateClient = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        const { idClient } = req.params;
        // Solo actualizamos mobilePhone y email
        const dataToUpdate = {};
        if (req.body.mobilePhone) dataToUpdate.mobilePhone = req.body.mobilePhone;
        if (req.body.email) dataToUpdate.email = req.body.email;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ error: 'No se envió ningún cambio en teléfono o mail' });
        }

        const result = await prisma.Clients.updateMany({
            where: { idClient: parseInt(idClient), tenantId },
            data: dataToUpdate,
        });

        if (!result.count) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        logAudit({
          tenantId,
          adminId: req.user.adminId,
          action: 'UPDATE',
          resource: 'client',
          resourceId: idClient,
          newValues: { fields: Object.keys(dataToUpdate) },
          req,
        });
        res.status(200).json({ message: 'Cliente actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el cliente', details: error.message });
    }
};

// DELETE: Eliminar un cliente
exports.deleteClient = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        const { idClient } = req.params;
        
        const result = await prisma.Clients.deleteMany({
            where: { idClient: parseInt(idClient), tenantId },
        });

        if (!result.count) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        logAudit({
          tenantId,
          adminId: req.user.adminId,
          action: 'DELETE',
          resource: 'client',
          resourceId: idClient,
          req,
        });
        res.status(200).json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cliente', details: error.message });
    }
};