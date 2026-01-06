const { Client, Lease, Property, ClientDocument, sequelize } = require('../data');

// POST: Crear un cliente (con dual-write a client_documents)
exports.createClient = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        console.log("POST /client - Datos recibidos:", req.body);
        console.log("POST /client - TenantId:", tenantId);
        
        const { cuil, ...clientData } = req.body;
        
        // 1. Crear el cliente (con cuil para compatibilidad)
        const newClient = await Client.create({
            ...clientData,
            cuil, // Mantener campo legacy
            tenantId,
            migrated_to_documents: true // Marcar como migrado desde el inicio
        }, { transaction });
        
        console.log("POST /client - Cliente creado:", newClient?.idClient);
        
        // 2. Si hay CUIL, crear documento en client_documents (dual-write)
        if (cuil) {
            await ClientDocument.create({
                clientId: newClient.idClient,
                tenantId,
                documentType: 'TAX',
                country: 'AR',
                documentCode: 'CUIL',
                number: cuil,
                isPrimary: true,
                isVerified: false
            }, { transaction });
            
            console.log("POST /client - Documento CUIL creado en client_documents");
        }
        
        await transaction.commit();
        
        res.status(201).json(newClient);
    } catch (error) {
        await transaction.rollback();
        
        console.error("POST /client - Error al crear cliente:", error);
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationErrors = error.errors.map(err => err.message);
            console.error("POST /client - Errores de validación:", validationErrors);
            res.status(400).json({ error: 'Error de validación', details: validationErrors });
        } else {
            res.status(500).json({ error: 'Error al crear el cliente', details: error.message });
        }
    }
};

// GET: Obtener todos los clientes
exports.getAllClients = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        
        const clients = await Client.findAll({
            where: { tenantId } // Filtrar por tenant
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
        
        const client = await Client.findOne({
            where: { idClient, tenantId }, // Filtrar por tenant
            include: [
                {
                    model: Lease,
                    as: 'LeasesAsRenter',
                    include: [{ model: Property }] 
                },
                {
                    model: Lease,
                    as: 'LeasesAsLandlord',
                    include: [{ model: Property }]
                }
            ]
        });
        if (!client) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
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

        const updated = await Client.update(dataToUpdate, { 
            where: { idClient, tenantId } // Filtrar por tenant
        });

        if (!updated[0]) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.status(200).json({ message: 'Cliente actualizado' });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const validationErrors = error.errors.map(err => err.message);
            res.status(400).json({ error: 'Error de validación', details: validationErrors });
        } else {
            res.status(500).json({ error: 'Error al actualizar el cliente', details: error.message });
        }
    }
};

// DELETE: Eliminar un cliente
exports.deleteClient = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        const { idClient } = req.params;
        
        const deleted = await Client.destroy({ 
            where: { idClient, tenantId } // Filtrar por tenant
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.status(200).json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cliente', details: error.message });
    }
};