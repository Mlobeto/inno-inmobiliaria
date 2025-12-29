const { Client, Lease, Property } = require('../data');

// POST: Crear un cliente
exports.createClient = async (req, res) => {
    try {
        console.log("POST /client - Datos recibidos:", req.body);
        const newClient = await Client.create(req.body);
        console.log("POST /client - Cliente creado:", newClient?.idClient);
        res.status(201).json(newClient);
    } catch (error) {
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
        const clients = await Client.findAll();
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los clientes', details: error.message });
    }
};

// GET: Obtener un cliente por ID
exports.getClientById = async (req, res) => {
    try {
        const { idClient } = req.params;
        const client = await Client.findByPk(idClient, {
            include: [
                {
                    model: Lease,
                    as: 'LeasesAsTenant',
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
        const { idClient } = req.params;
        // Solo actualizamos mobilePhone y email
        const dataToUpdate = {};
        if (req.body.mobilePhone) dataToUpdate.mobilePhone = req.body.mobilePhone;
        if (req.body.email) dataToUpdate.email = req.body.email;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ error: 'No se envió ningún cambio en teléfono o mail' });
        }

        const updated = await Client.update(dataToUpdate, { where: { idClient } });

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
        const { idClient } = req.params;
        const deleted = await Client.destroy({ where: { idClient } });

        if (!deleted) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.status(200).json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el cliente', details: error.message });
    }
};