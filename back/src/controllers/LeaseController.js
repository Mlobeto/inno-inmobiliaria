const { Lease, Property, Client, ClientProperty, PaymentReceipt, Garantor, RentUpdate } = require('../data');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Function to decode base64 string to buffer
function decodeBase64(dataString) {
  try {
    // Verificar si el string comienza con el prefijo esperado
    const base64Data = dataString.startsWith('data:application/pdf;base64,')
      ? dataString.slice('data:application/pdf;base64,'.length)
      : dataString; // Si no comienza con el prefijo, usar el string completo

    // Decodificar el string Base64
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer;
  } catch (error) {
    console.error('decodeBase64 - Error al decodificar Base64:', error);
    throw new Error('Error al decodificar la cadena Base64');
  }
}

// Función para arreglar las foreign key constraints (usar solo una vez)
const fixForeignKeyConstraints = async () => {
  try {
    console.log('=== ARREGLANDO FOREIGN KEY CONSTRAINTS ===');
    
    // Verificar constraints existentes
    const existingConstraints = await Lease.sequelize.query(
      `SELECT constraint_name FROM information_schema.table_constraints 
       WHERE table_name = 'Leases' AND constraint_type = 'FOREIGN KEY'`,
      { type: Lease.sequelize.QueryTypes.SELECT }
    );
    console.log('Constraints existentes:', existingConstraints);
    
    // Eliminar constraints incorrectos si existen
    await Lease.sequelize.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_landlordId_fkey"');
    await Lease.sequelize.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_renterId_fkey"');
    await Lease.sequelize.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_propertyId_fkey"');
    console.log('Constraints antiguos eliminados');
    
    // Crear constraints correctos apuntando a las tablas correctas
    await Lease.sequelize.query('ALTER TABLE "Leases" ADD CONSTRAINT "Leases_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Clients"("idClient")');
    await Lease.sequelize.query('ALTER TABLE "Leases" ADD CONSTRAINT "Leases_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "Clients"("idClient")');
    await Lease.sequelize.query('ALTER TABLE "Leases" ADD CONSTRAINT "Leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId")');
    console.log('Constraints correctos creados');
    
    console.log('=== FOREIGN KEY CONSTRAINTS ARREGLADOS ===');
    return true;
  } catch (error) {
    console.error('Error arreglando constraints:', error);
    throw error;
  }
};

exports.savePdf = async (req, res) => {
  try {
    console.log('savePdf - Received data:', req.body);

    const { pdfData, fileName, leaseId } = req.body;

    if (!pdfData || !fileName || !leaseId) {
      return res.status(400).json({
        error: 'Datos incompletos',
        details: 'Los campos pdfData, fileName y leaseId son obligatorios'
      });
    }

    // Decode base64 string
    const buffer = decodeBase64(pdfData);

    // Define the path where the PDF will be saved
    const pdfDirectory = path.join(__dirname, '../../pdfs'); // Directory relative to the controller
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true }); // Create directory if it doesn't exist
    }
    const filePath = path.join(pdfDirectory, fileName);

    // Save the PDF to a file
    fs.writeFile(filePath, buffer, async (err) => {
      if (err) {
        console.error('savePdf - Error al guardar el PDF:', err);
        return res.status(500).json({
          error: 'Error al guardar el PDF',
          details: err.message
        });
      }

      console.log('savePdf - PDF guardado exitosamente en:', filePath);

      // Update the Lease model with the pdfPath
      try {
        const lease = await Lease.findByPk(leaseId);
        if (!lease) {
          console.error('savePdf - Contrato no encontrado');
          return res.status(404).json({
            error: 'Contrato no encontrado',
            details: 'No se encontró el contrato con el ID proporcionado'
          });
        }

        await lease.update({ pdfPath: filePath });
        console.log('savePdf - pdfPath actualizado en el contrato');

        return res.status(200).json({
          message: 'PDF guardado exitosamente y contrato actualizado',
          filePath: filePath
        });
      } catch (updateError) {
        console.error('savePdf - Error al actualizar el contrato:', updateError);
        return res.status(500).json({
          error: 'Error al actualizar el contrato',
          details: updateError.message
        });
      }
    });
  } catch (error) {
    console.error('savePdf - Error:', error);
    res.status(500).json({
      error: 'Error al guardar el PDF',
      details: error.message
    });
  }
};

exports.createLease = async (req, res) => {
  try {
    console.log('CreateLease - Received data:', req.body);

    const {
      propertyId,
      landlordId, 
      renterId,
      startDate,
      rentAmount,
      updateFrequency,
      commission,
      totalMonths,
      inventory
    } = req.body;

    // Validación básica de campos obligatorios
    if (!propertyId || !landlordId || !renterId || !startDate || !rentAmount || !totalMonths || !inventory) {
      return res.status(400).json({
        error: 'Datos incompletos',
        details: 'Los campos propertyId, landlordId, renterId, startDate, rentAmount, totalMonths e inventory son obligatorios'
      });
    }

    // Parsear y validar
    const parsedData = {
      propertyId: parseInt(propertyId),
      landlordId: parseInt(landlordId),
      renterId: parseInt(renterId),
      startDate: new Date(startDate),
      rentAmount: parseFloat(rentAmount),
      updateFrequency,
      commission: commission ? parseFloat(commission) : null,
      totalMonths: parseInt(totalMonths),
      inventory
    };

    console.log('CreateLease - Parsed data:', parsedData);

    // ===== DEBUGGING DETALLADO =====
    console.log('=== VERIFICACIÓN DE IDS ===');
    console.log('landlordId recibido:', landlordId, 'tipo:', typeof landlordId);
    console.log('renterId recibido:', renterId, 'tipo:', typeof renterId);
    console.log('propertyId recibido:', propertyId, 'tipo:', typeof propertyId);
    console.log('landlordId parseado:', parsedData.landlordId, 'tipo:', typeof parsedData.landlordId);
    console.log('renterId parseado:', parsedData.renterId, 'tipo:', typeof parsedData.renterId);

    // Verificar existencia y disponibilidad de la propiedad
    const property = await Property.findByPk(parsedData.propertyId);
    console.log('Property found:', property ? `ID: ${property.propertyId || property.id}, Available: ${property.isAvailable}` : 'NO ENCONTRADA');
    
    if (!property) {
      return res.status(404).json({ 
        error: 'Propiedad no encontrada',
        details: `No existe una propiedad con ID ${parsedData.propertyId}`
      });
    }
    if (!property.isAvailable) {
      return res.status(400).json({ 
        error: 'La propiedad ya no está disponible',
        details: `La propiedad ${parsedData.propertyId} está marcada como no disponible`
      });
    }

    // Verificar que el landlord existe
    console.log('Buscando landlord con ID:', parsedData.landlordId);
    const landlord = await Client.findByPk(parsedData.landlordId);
    console.log('Landlord found:', landlord ? `ID: ${landlord.idClient}, Name: ${landlord.name}` : 'NO ENCONTRADO');
    
    if (!landlord) {
      // Listar todos los clientes para debugging
      const allClients = await Client.findAll({ attributes: ['idClient', 'name'] });
      console.log('Todos los clientes en la BD:', allClients.map(c => `ID: ${c.idClient}, Name: ${c.name}`));
      
      return res.status(404).json({ 
        error: 'Propietario no encontrado',
        details: `No existe un cliente con ID ${parsedData.landlordId}. Clientes disponibles: ${allClients.map(c => `${c.name} (ID: ${c.idClient})`).join(', ')}`
      });
    }

    // Verificar rol de propietario
    console.log('Verificando rol de propietario para clientId:', parsedData.landlordId, 'propertyId:', parsedData.propertyId);
    const ownerRole = await ClientProperty.findOne({ 
      where: { clientId: parsedData.landlordId, propertyId: parsedData.propertyId, role: 'propietario' }
    });
    console.log('Owner role found:', ownerRole ? 'SÍ' : 'NO');
    
    if (!ownerRole) {
      // Listar todas las relaciones para debugging
      const allRelations = await ClientProperty.findAll({ 
        where: { propertyId: parsedData.propertyId },
        include: [{ model: Client, attributes: ['idClient', 'name'] }]
      });
      console.log('Relaciones para la propiedad:', allRelations.map(r => `Client: ${r.Client.name} (ID: ${r.Client.idClient}), Role: ${r.role}`));
      
      return res.status(400).json({ 
        error: 'El cliente no tiene rol de propietario para esta propiedad',
        details: `El cliente ${landlord.name} (ID: ${parsedData.landlordId}) no tiene rol de propietario para la propiedad ${parsedData.propertyId}. Relaciones existentes: ${allRelations.map(r => `${r.Client.name} (${r.role})`).join(', ')}`
      });
    }

    // Verificar que el renter (inquilino) exista
    console.log('Buscando renter con ID:', parsedData.renterId);
    const renter = await Client.findByPk(parsedData.renterId);
    console.log('Renter found:', renter ? `ID: ${renter.idClient}, Name: ${renter.name}` : 'NO ENCONTRADO');
    
    if (!renter) {
      return res.status(404).json({ 
        error: 'Inquilino no encontrado',
        details: `No existe un cliente con ID ${parsedData.renterId}`
      });
    }

    // Verificar que no sea el mismo cliente
    if (parsedData.landlordId === parsedData.renterId) {
      return res.status(400).json({ 
        error: 'Conflicto de roles',
        details: 'El propietario y el inquilino no pueden ser la misma persona'
      });
    }

    console.log('=== TODOS LOS DATOS VERIFICADOS - PREPARANDO CREACIÓN ===');
    console.log('Datos finales para crear:', parsedData);

    // ===== DEBUGGING DE ESQUEMA DE BASE DE DATOS =====
    console.log('=== DEBUGGING ESQUEMA DE BASE DE DATOS ===');
    console.log('Client model tableName:', Client.tableName);
    console.log('Lease model tableName:', Lease.tableName);
    console.log('Property model tableName:', Property.tableName);

    // Verificar qué tablas existen realmente
    const tablesQuery = await Client.sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
      { type: Client.sequelize.QueryTypes.SELECT }
    );
    console.log('Todas las tablas en PostgreSQL:', tablesQuery.map(t => t.tablename));

    // Verificar tablas relacionadas con "client"
    const clientTablesQuery = await Client.sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name ILIKE '%client%')",
      { type: Client.sequelize.QueryTypes.SELECT }
    );
    console.log('Tablas que contienen "client":', clientTablesQuery.map(t => t.table_name));

    // Verificar constraints específicos de Leases
    const constraintsQuery = await Client.sequelize.query(
      `SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
       FROM information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'Leases'`,
      { type: Client.sequelize.QueryTypes.SELECT }
    );
    console.log('Foreign key constraints de Leases:', constraintsQuery);

    // Verificar que el cliente realmente existe con query directo
    const rawClientCheck = await Client.sequelize.query(
      'SELECT "idClient", "name" FROM "Clients" WHERE "idClient" = :landlordId',
      { 
        replacements: { landlordId: parsedData.landlordId },
        type: Client.sequelize.QueryTypes.SELECT 
      }
    );
    console.log('Landlord en BD (raw query):', rawClientCheck);

    const rawRenterCheck = await Client.sequelize.query(
      'SELECT "idClient", "name" FROM "Clients" WHERE "idClient" = :renterId',
      { 
        replacements: { renterId: parsedData.renterId },
        type: Client.sequelize.QueryTypes.SELECT 
      }
    );
    console.log('Renter en BD (raw query):', rawRenterCheck);

    // Verificar si hay conflicto de constraints
    const constraintProblems = constraintsQuery.filter(c => {
      // Verificar si apunta a tablas incorrectas o hay duplicados
      if (c.column_name === 'landlordId' || c.column_name === 'renterId') {
        return c.foreign_table_name !== 'Clients' || c.foreign_column_name !== 'idClient';
      }
      if (c.column_name === 'propertyId') {
        // Aceptar tanto 'Property' como 'Properties' pero verificar que la tabla tenga datos
        return !['Property', 'Properties'].includes(c.foreign_table_name) || c.foreign_column_name !== 'propertyId';
      }
      return false;
    });

    // También verificar si hay constraints duplicados
    const constraintNames = constraintsQuery.map(c => c.constraint_name);
    const duplicatedConstraints = constraintNames.filter((name, index) => 
      constraintNames.indexOf(name) !== index
    );

    if (constraintProblems.length > 0 || duplicatedConstraints.length > 0) {
      console.log('=== PROBLEMA DE CONSTRAINTS DETECTADO ===');
      console.log('Constraints problemáticos:', constraintProblems);
      console.log('Constraints duplicados:', duplicatedConstraints);
      
      // Intentar arreglar los constraints automáticamente
      try {
        await fixForeignKeyConstraints();
        console.log('Constraints arreglados, intentando crear contrato...');
      } catch (constraintError) {
        console.error('Error arreglando constraints:', constraintError);
        return res.status(500).json({
          error: 'Error de configuración de base de datos',
          details: 'Las foreign key constraints están mal configuradas. Contacta al administrador.',
          serverError: constraintError.message
        });
      }
    }

    console.log('=== VERIFICACIÓN FINAL ANTES DE CREATE ===');
    console.log('Landlord verificado:', { id: landlord.idClient, name: landlord.name });
    console.log('Renter verificado:', { id: renter.idClient, name: renter.name });
    console.log('Property verificado:', { 
      id: property.propertyId || property.id, 
      available: property.isAvailable 
    });
    console.log('Datos finales:', parsedData);
    console.log('================================================');

    // CREAR EL CONTRATO
    const newLease = await Lease.create(parsedData);
    console.log('New Lease created successfully:', {
      id: newLease.id,
      propertyId: newLease.propertyId,
      landlordId: newLease.landlordId,
      renterId: newLease.renterId
    });

    // Actualizar la propiedad (marcarla como no disponible)
    await property.update({ isAvailable: false });
    console.log('Property marked as unavailable');

    // Recuperar el contrato con todas las asociaciones necesarias
    const fullLease = await Lease.findByPk(newLease.id, {
      include: [
        { model: Property },
        { model: PaymentReceipt, required: false },
        { model: Garantor, required: false },
        { model: Client, as: 'Renter', attributes: ['name', 'cuil', 'direccion','ciudad','provincia','email','mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion','ciudad','provincia','email','mobilePhone'] }
      ]
    });

    console.log('=== CONTRATO CREADO EXITOSAMENTE ===');

    // Intentar asignar rol de inquilino automáticamente (opcional)
    try {
      console.log('Verificando rol de inquilino automático...');
      
      const existingTenantRole = await ClientProperty.findOne({
        where: { 
          clientId: parsedData.renterId, 
          propertyId: parsedData.propertyId, 
          role: 'inquilino' 
        }
      });

      if (!existingTenantRole) {
        console.log('Creando rol de inquilino automáticamente...');
        await ClientProperty.create({
          clientId: parsedData.renterId,
          propertyId: parsedData.propertyId,
          role: 'inquilino'
        });
        console.log('✅ Rol de inquilino asignado exitosamente');
      } else {
        console.log('ℹ️ El inquilino ya tiene rol asignado para esta propiedad');
      }
    } catch (roleError) {
      console.warn('⚠️ Warning: No se pudo asignar rol de inquilino automáticamente:', roleError.message);
      // No hacemos throw del error - es solo una advertencia
      // El contrato ya se creó exitosamente, esto es opcional
    }

    // Verificar todos los roles actuales para debugging
    try {
      const allRoles = await ClientProperty.findAll({
        where: { propertyId: parsedData.propertyId },
        include: [{ model: Client, attributes: ['name', 'idClient'] }]
      });
      console.log('Todos los roles para la propiedad después del contrato:', allRoles.map(r => ({
        clientId: r.Client.idClient,
        clientName: r.Client.name,
        role: r.role
      })));
    } catch (debugError) {
      console.warn('Error obteniendo roles para debugging:', debugError.message);
    }

    // Agregar leaseId a la respuesta (el modelo usa 'id' pero el frontend espera 'leaseId')
    const response = fullLease.toJSON();
    response.leaseId = fullLease.id;
    
    res.status(201).json(response);

  } catch (error) {
    console.error('CreateLease Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // Si es un error de constraint de foreign key, dar más detalles específicos
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('Foreign Key Error Details:', {
        table: error.table,
        constraint: error.constraint,
        fields: error.fields,
        value: error.value,
        parent: error.parent
      });

      // Identificar qué campo específico está causando el problema
      let fieldName = 'desconocido';
      let suggestion = '';
      
      if (error.constraint && error.constraint.includes('landlord')) {
        fieldName = 'propietario';
        suggestion = 'Verifica que el ID del propietario sea correcto y que el cliente exista en la base de datos.';
      } else if (error.constraint && error.constraint.includes('tenant')) {
        fieldName = 'inquilino';
        suggestion = 'Verifica que el ID del inquilino sea correcto y que el cliente exista en la base de datos.';
      } else if (error.constraint && error.constraint.includes('property')) {
        fieldName = 'propiedad';
        suggestion = 'Verifica que el ID de la propiedad sea correcto y que la propiedad exista en la base de datos.';
      } else if (error.parent?.detail && error.parent.detail.includes('propertyId')) {
        fieldName = 'propiedad';
        suggestion = 'La propiedad especificada no existe en la tabla correcta. Se detectaron tablas duplicadas de Properties.';
      } else if (error.parent?.detail && error.parent.detail.includes('landlordId')) {
        fieldName = 'propietario';
        suggestion = 'El propietario especificado no existe en la tabla correcta.';
      } else if (error.parent?.detail && error.parent.detail.includes('renterId')) {
        fieldName = 'inquilino';
        suggestion = 'El inquilino especificado no existe en la tabla correcta.';
      }
      
      return res.status(400).json({ 
        error: `Error de referencia de datos - ${fieldName}`,
        details: `El ${fieldName} especificado no existe en la base de datos. ${suggestion}`,
        serverError: error.parent?.detail || error.message,
        constraint: error.constraint,
        value: error.value
      });
    }

    // Error de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        error: 'Error de validación de datos',
        details: 'Uno o más campos contienen datos inválidos',
        validationErrors
      });
    }

    // Error genérico
    res.status(500).json({ 
      error: 'Error al crear el contrato de alquiler', 
      details: error.message,
      serverError: error.parent?.detail || 'Error interno del servidor'
    });
  }
};

exports.getLeaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lease = await Lease.findByPk(id, {
      include: [
        { model: Property },
        { model: PaymentReceipt, required: false },
        { model: Garantor, required: false },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion','ciudad','provincia','email','mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion','ciudad','provincia','email','mobilePhone'] }
      ]
    });

    if (!lease) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }
    
    res.json(lease);
  } catch (error) {
    console.error('Error en getLeaseById:', error);
    res.status(500).json({ 
      message: "Error al obtener el contrato",
      details: error.message 
    });
  }
};

exports.terminateLease = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el contrato de alquiler
        const lease = await Lease.findByPk(id);
        if (!lease) {
            return res.status(404).json({ error: 'Contrato de alquiler no encontrado' });
        }

        // Buscar la propiedad asociada al contrato
        const property = await Property.findByPk(lease.propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Propiedad no encontrada' });
        }

        // Actualizar la propiedad para marcarla como disponible
        await property.update({ isAvailable: true });

        // Marcar el contrato como terminado
        await lease.update({ status: 'terminated' });

        res.status(200).json({ message: 'Contrato terminado y propiedad marcada como disponible' });
    } catch (error) {
        res.status(500).json({ error: 'Error al terminar el contrato de alquiler', details: error.message });
    }
};



exports.getAllLeases = async (req, res) => {
  try {
    const leases = await Lease.findAll({
      include: [
        { model: Property },
        { model: PaymentReceipt, required: false },
        { model: Garantor, required: false },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: RentUpdate, required: false, order: [['updateDate', 'DESC']] }
      ],
    });

    const leasesWithUpdateInfo = leases.map(lease => {
      const start = new Date(lease.startDate);
      const now = new Date();
      
      // Calcular meses desde el inicio
      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + 
                              (now.getMonth() - start.getMonth());
      
      // Determinar frecuencia en meses
      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;
      
      // Verificar si necesita actualización
      const shouldUpdate = monthsSinceStart >= freqMonths;
      
      // Calcular próxima fecha de actualización
      const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);
      const nextUpdate = new Date(start);
      nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);
      
      // Verificar si ya tiene actualizaciones registradas
      const lastUpdate = lease.RentUpdates && lease.RentUpdates.length > 0 
        ? lease.RentUpdates[0] 
        : null;
      
      return {
        ...lease.toJSON(),
        updateInfo: {
          monthsSinceStart,
          shouldUpdate,
          lastUpdateDate: lastUpdate ? lastUpdate.updateDate : null,
          nextUpdateDate: nextUpdate,
          periodsElapsed,
          hasUpdates: lease.RentUpdates && lease.RentUpdates.length > 0
        }
      };
    });

    res.status(200).json(leasesWithUpdateInfo);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    res.status(500).json({ error: "Error al obtener contratos", details: error.message });
  }
};

exports.checkPendingPayments = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Mes actual (1-12)
    const currentYear = today.getFullYear();

    // Buscar contratos activos
    const activeLeases = await Lease.findAll({
      where: { status: { [Op.ne]: 'terminated' } }, // Contratos que no están terminados
      include: [
        {
          model: PaymentReceipt,
          required: false,
          where: {
            [Op.and]: [
              { periodMonth: currentMonth },
              { periodYear: currentYear },
            ],
          },
        },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
      ],
    });

    // Filtrar contratos que no tienen pagos registrados para el mes actual
    const pendingPayments = activeLeases.filter(
      (lease) => lease.PaymentReceipts.length === 0
    );

    if (pendingPayments.length === 0) {
      return res.status(200).json({ message: 'No hay pagos pendientes.' });
    }

    res.status(200).json({
      message: 'Pagos pendientes encontrados.',
      pendingPayments: pendingPayments.map((lease) => ({
        leaseId: lease.id,
        tenantName: lease.Tenant.name,
        landlordName: lease.Landlord.name,
        propertyId: lease.propertyId,
        rentAmount: lease.rentAmount,
      })),
    });
  } catch (error) {
    console.error('Error al verificar pagos pendientes:', error);
    res.status(500).json({
      error: 'Error al verificar pagos pendientes.',
      details: error.message,
    });
  }
};

function calculateUpdatePeriod(startDate, updateFrequency, updateDate) {
  const start = new Date(startDate);
  const update = new Date(updateDate);
  
  // CORREGIDO: Cálculo más preciso de meses
  let monthsDiff = (update.getFullYear() - start.getFullYear()) * 12;
  monthsDiff += update.getMonth() - start.getMonth();
  
  // Ajustar si el día de actualización es antes del día de inicio
  if (update.getDate() < start.getDate()) {
    monthsDiff--;
  }

  let period = '';
  switch (updateFrequency) {
      case 'semestral':
          const semester = Math.floor(monthsDiff / 6) + 1;
          period = `Semestre ${semester}`;
          break;
      case 'cuatrimestral':
          const cuatrimestre = Math.floor(monthsDiff / 4) + 1;
          period = `Cuatrimestre ${cuatrimestre}`;
          break;
      case 'anual':
          const year = Math.floor(monthsDiff / 12) + 1;
          period = `Año ${year}`;
          break;
      default:
          period = 'Desconocido';
  }
  
  console.log(`Período calculado: ${period} (${monthsDiff} meses desde inicio)`);
  return period;
}

function getNextUpdateDate(startDate, updateFrequency, updatedAt) {
  let freqMonths = 0;
  if (updateFrequency === 'semestral') freqMonths = 6;
  else if (updateFrequency === 'cuatrimestral') freqMonths = 4;
  else if (updateFrequency === 'anual') freqMonths = 12;

  const start = new Date(startDate);
  const now = new Date();
  
  // Calcular cuántos períodos han pasado desde el inicio
  const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + 
                          (now.getMonth() - start.getMonth());
  
  // Calcular cuántos períodos de actualización deberían haber ocurrido
  const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);
  
  // La próxima actualización es: start + (períodos + 1) * freqMonths
  const nextUpdate = new Date(start);
  nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);
  
  console.log(`Contrato iniciado: ${start.toLocaleDateString()}`);
  console.log(`Meses desde inicio: ${monthsSinceStart}`);
  console.log(`Períodos transcurridos: ${periodsElapsed}`);
  console.log(`Próxima actualización: ${nextUpdate.toLocaleDateString()}`);
  
  return nextUpdate;
}

function needsUpdate(startDate, updateFrequency) {
  let freqMonths = 0;
  if (updateFrequency === 'semestral') freqMonths = 6;
  else if (updateFrequency === 'cuatrimestral') freqMonths = 4;
  else if (updateFrequency === 'anual') freqMonths = 12;

  const start = new Date(startDate);
  const now = new Date();
  
  // Calcular meses transcurridos desde el inicio
  const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + 
                          (now.getMonth() - start.getMonth());
  
  // Verificar si han pasado suficientes meses para una actualización
  const shouldUpdate = monthsSinceStart >= freqMonths && (monthsSinceStart % freqMonths === 0 || monthsSinceStart > freqMonths);
  
  console.log(`Contrato ${startDate}: ${monthsSinceStart} meses, frecuencia: ${freqMonths}, necesita actualización: ${shouldUpdate}`);
  
  return shouldUpdate;
}

exports.updateRentAmount = async (req, res) => {
  try {
      const { id } = req.params;
      const { newRentAmount, updateDate, pdfData, fileName } = req.body;

      if (!newRentAmount || !updateDate || !pdfData || !fileName) {
          return res.status(400).json({ error: 'El nuevo monto de alquiler, la fecha de actualización, el PDF y el nombre del archivo son obligatorios.' });
      }

      const lease = await Lease.findByPk(id);

      if (!lease) {
          return res.status(404).json({ error: 'Contrato no encontrado.' });
      }

      const oldRentAmount = lease.rentAmount;

      // Calcula el período de actualización
      const period = calculateUpdatePeriod(lease.startDate, lease.updateFrequency, updateDate);

      // Define the path where the PDF will be saved
      const pdfDirectory = path.join(__dirname, '../../pdfs');
      if (!fs.existsSync(pdfDirectory)) {
          fs.mkdirSync(pdfDirectory, { recursive: true });
      }
      const filePath = path.join(pdfDirectory, fileName);

      // Decode base64 string
      const buffer = decodeBase64(pdfData);

      // Guardar el PDF en el sistema de archivos
      fs.writeFileSync(filePath, buffer);

      // Crear el registro en el modelo RentUpdate
      await RentUpdate.create({
          leaseId: id,
          updateDate: updateDate,
          oldRentAmount: oldRentAmount,
          newRentAmount: newRentAmount,
          period: period,
          pdfPath: filePath,
      });

      // Actualizar el monto del alquiler en el modelo Lease
      lease.rentAmount = newRentAmount;
      await lease.save();

      res.status(200).json({ message: 'Monto de alquiler actualizado con éxito.', lease });

  } catch (error) {
      console.error('Error al actualizar el monto del alquiler:', error);
      res.status(500).json({ error: 'Error al actualizar el monto del alquiler.', details: error.message });
  }
};

// Función para crear actualizaciones de testing con fechas anteriores
const createTestRentUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { testDate, newRentAmount } = req.body;

    console.log(`[TEST] Creando actualización de prueba para lease ${id}`);
    
    const lease = await Lease.findByPk(id);
    if (!lease) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // Crear una actualización con fecha de prueba en el pasado
    const testUpdate = await RentUpdate.create({
      leaseId: id,
      previousAmount: lease.rentAmount,
      newAmount: newRentAmount || lease.rentAmount * 1.1, // 10% más si no se especifica
      updateDate: new Date(testDate),
      updateReason: 'Test con fecha anterior',
      createdAt: new Date(testDate),
      updatedAt: new Date(testDate)
    });

    // Actualizar el contrato con la nueva fecha
    await lease.update({
      rentAmount: testUpdate.newAmount,
      updatedAt: new Date(testDate)
    });

    console.log(`[TEST] Actualización creada exitosamente:`, testUpdate.toJSON());

    res.json({
      message: 'Actualización de prueba creada exitosamente',
      testUpdate,
      nextUpdateDate: getNextUpdateDate(lease.startDate, lease.updateFrequency, testDate)
    });

  } catch (error) {
    console.error('Error en createTestRentUpdate:', error);
    res.status(500).json({ message: 'Error al crear actualización de prueba', error: error.message });
  }
};

// Función para debuggear las alertas de contratos
const debugLeaseAlerts = async (req, res) => {
  try {
    console.log('[DEBUG] Iniciando debug de alertas de contratos');
    
    // Duplicar EXACTAMENTE el código de getAllLeases
    const leases = await Lease.findAll({
      include: [
        { model: Property },
        { model: PaymentReceipt, required: false },
        { model: Garantor, required: false },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] }
      ],
    });

    const leasesWithNextUpdate = leases.map(lease => ({
      ...lease.toJSON(),
      nextUpdateDate: getNextUpdateDate(lease.startDate, lease.updateFrequency, lease.updatedAt)
    }));

    // Calcular información de debug adicional
    const now = new Date();
    const debugInfo = leasesWithNextUpdate.map(lease => {
      const nextUpdate = new Date(lease.nextUpdateDate);
      const daysUntilUpdate = Math.ceil((nextUpdate - now) / (1000 * 60 * 60 * 24));
      const shouldAlert = daysUntilUpdate <= 30 && daysUntilUpdate >= 0;

      return {
        leaseId: lease.id,
        tenant: lease.Tenant?.name,
        landlord: lease.Landlord?.name,
        property: lease.Property?.address,
        startDate: lease.startDate,
        updateFrequency: lease.updateFrequency,
        currentRent: lease.rentAmount,
        lastUpdateDate: lease.updatedAt || 'Nunca actualizado',
        nextUpdateDate: lease.nextUpdateDate,
        daysUntilUpdate,
        shouldAlert
      };
    });

    console.log('[DEBUG] Información completa de alertas:', debugInfo);

    res.json({
      message: 'Debug de alertas completado',
      currentDate: now.toLocaleDateString(),
      totalLeases: leases.length,
      alertCount: debugInfo.filter(info => info.shouldAlert).length,
      debugInfo
    });

  } catch (error) {
    console.error('Error en debugLeaseAlerts:', error);
    res.status(500).json({ message: 'Error al debuggear alertas', error: error.message });
  }
};



exports.getLeasesPendingUpdate = async (req, res) => {
  try {
    console.log('🔍 Buscando contratos que necesitan actualización...');
    
    // 🔧 Definir 'now' al inicio de la función
    const now = new Date();
    
    const leases = await Lease.findAll({
      where: { status: 'active' },
      include: [
        { model: Property },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: RentUpdate, required: false, order: [['updateDate', 'DESC']] }
      ],
    });

    console.log(`📋 Encontrados ${leases.length} contratos activos`);

    const pendingUpdates = leases.filter(lease => {
      const start = new Date(lease.startDate);
      // Removed 'const now = new Date();' from here since it's already defined above
      
      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + 
                              (now.getMonth() - start.getMonth());
      
      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;
      
      const shouldUpdate = monthsSinceStart >= freqMonths;
      
      const lastUpdate = lease.RentUpdates && lease.RentUpdates.length > 0 
        ? lease.RentUpdates[0] 
        : null;
      
      console.log(`Contrato ${lease.id}: ${monthsSinceStart} meses, frecuencia: ${freqMonths}, necesita actualización: ${shouldUpdate}`);
        
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate.updateDate);
        const monthsSinceLastUpdate = (now.getFullYear() - lastUpdateDate.getFullYear()) * 12 + 
                                     (now.getMonth() - lastUpdateDate.getMonth());
        
        console.log(`  - Última actualización hace ${monthsSinceLastUpdate} meses`);
        return shouldUpdate && monthsSinceLastUpdate >= freqMonths;
      }
      
      return shouldUpdate;
    });

    const detailedPendingUpdates = pendingUpdates.map(lease => {
      const start = new Date(lease.startDate);
      // Removed 'const now = new Date();' from here since it's already defined above
      
      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + 
                              (now.getMonth() - start.getMonth());
      
      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;
      
      const periodsOverdue = Math.floor(monthsSinceStart / freqMonths);
      const monthsOverdue = monthsSinceStart - (periodsOverdue * freqMonths);
      
      return {
        id: lease.id,
        property: lease.Property.address,
        tenant: lease.Tenant.name,
        landlord: lease.Landlord.name,
        currentRent: lease.rentAmount,
        updateFrequency: lease.updateFrequency,
        startDate: lease.startDate,
        monthsSinceStart,
        periodsOverdue,
        monthsOverdue,
        urgency: monthsOverdue > 6 ? 'high' : monthsOverdue > 3 ? 'medium' : 'low',
        lastUpdate: lease.RentUpdates && lease.RentUpdates.length > 0 
          ? lease.RentUpdates[0].updateDate 
          : null
      };
    });

    // Ordenar por urgencia (más meses de retraso primero)
    detailedPendingUpdates.sort((a, b) => b.monthsSinceStart - a.monthsSinceStart);

    console.log(`🎯 ${pendingUpdates.length} contratos necesitan actualización`);

    // 🔧 Ahora 'now' está disponible aquí
    res.status(200).json({
      message: 'Contratos pendientes de actualización obtenidos exitosamente',
      count: pendingUpdates.length,
      currentDate: now.toLocaleDateString('es-AR'),
      pendingUpdates: detailedPendingUpdates
    });
  } catch (error) {
    console.error("Error al obtener contratos pendientes:", error);
    res.status(500).json({ error: "Error al obtener contratos pendientes", details: error.message });
  }
};

exports.getLeaseUpdateHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Obteniendo historial de actualizaciones para contrato ${id}`);
    
    // Verificar que el contrato existe
    const lease = await Lease.findByPk(id, {
      include: [
        { model: Property, attributes: ['address'] },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] }
      ]
    });
    
    if (!lease) {
      return res.status(404).json({ 
        error: 'Contrato no encontrado',
        details: `No existe un contrato con ID ${id}`
      });
    }
    
    // Obtener todas las actualizaciones del contrato
    const updates = await RentUpdate.findAll({
      where: { leaseId: id },
      order: [['updateDate', 'DESC']] // Más recientes primero
    });
    
    // Calcular estadísticas del historial
    const totalUpdates = updates.length;
    const firstUpdate = updates.length > 0 ? updates[updates.length - 1] : null;
    const lastUpdate = updates.length > 0 ? updates[0] : null;
    
    let totalIncrease = 0;
    let averageIncrease = 0;
    
    if (updates.length > 0) {
      const initialAmount = firstUpdate.oldRentAmount || lease.rentAmount;
      const currentAmount = lease.rentAmount;
      totalIncrease = ((currentAmount - initialAmount) / initialAmount) * 100;
      
      // Calcular incremento promedio por actualización
      const increments = updates.map(update => {
        const oldAmount = update.oldRentAmount || 0;
        const newAmount = update.newRentAmount || 0;
        return oldAmount > 0 ? ((newAmount - oldAmount) / oldAmount) * 100 : 0;
      });
      averageIncrease = increments.reduce((sum, inc) => sum + inc, 0) / increments.length;
    }
    
    console.log(`✅ Historial obtenido: ${totalUpdates} actualizaciones`);
    
    res.status(200).json({
      message: 'Historial de actualizaciones obtenido exitosamente',
      lease: {
        id: lease.id,
        property: lease.Property.address,
        tenant: lease.Tenant.name,
        landlord: lease.Landlord.name,
        currentRent: lease.rentAmount,
        startDate: lease.startDate,
        updateFrequency: lease.updateFrequency
      },
      statistics: {
        totalUpdates,
        totalIncreasePercentage: totalIncrease.toFixed(2),
        averageIncreasePercentage: averageIncrease.toFixed(2),
        firstUpdateDate: firstUpdate ? firstUpdate.updateDate : null,
        lastUpdateDate: lastUpdate ? lastUpdate.updateDate : null
      },
      updates: updates.map(update => ({
        id: update.id,
        updateDate: update.updateDate,
        oldAmount: update.oldRentAmount,
        newAmount: update.newRentAmount,
        increaseAmount: update.newRentAmount - update.oldRentAmount,
        increasePercentage: update.oldRentAmount > 0 
          ? (((update.newRentAmount - update.oldRentAmount) / update.oldRentAmount) * 100).toFixed(2)
          : 0,
        period: update.period,
        pdfPath: update.pdfPath,
        createdAt: update.createdAt
      }))
    });
    
  } catch (error) {
    console.error("Error al obtener historial de actualizaciones:", error);
    res.status(500).json({ 
      error: "Error al obtener historial de actualizaciones", 
      details: error.message 
    });
  }
};

// 🆕 2. Actualización rápida con porcentaje predeterminado
exports.quickUpdateLeaseRent = async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage, reason, updateDate } = req.body;
    
    console.log(`⚡ Actualizando rápidamente contrato ${id} con ${percentage}% de aumento`);
    
    if (!percentage || !reason) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        details: 'El porcentaje y la razón son obligatorios'
      });
    }
    
    const lease = await Lease.findByPk(id, {
      include: [
        { model: Property, attributes: ['address'] },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] }
      ]
    });
    
    if (!lease) {
      return res.status(404).json({ 
        error: 'Contrato no encontrado',
        details: `No existe un contrato con ID ${id}`
      });
    }
    
    // Calcular nuevo monto
    const oldAmount = parseFloat(lease.rentAmount);
    const increaseAmount = (oldAmount * parseFloat(percentage)) / 100;
    const newAmount = oldAmount + increaseAmount;
    
    // Calcular período
    const period = calculateUpdatePeriod(
      lease.startDate, 
      lease.updateFrequency, 
      updateDate || new Date()
    );
    
    // Crear registro de actualización
    const rentUpdate = await RentUpdate.create({
      leaseId: id,
      updateDate: updateDate || new Date(),
      oldRentAmount: oldAmount,
      newRentAmount: newAmount,
      period: period,
      pdfPath: null // Se puede agregar después si es necesario
    });
    
    // Actualizar el contrato
    await lease.update({ rentAmount: newAmount });
    
    console.log(`✅ Actualización rápida completada: $${oldAmount} → $${newAmount}`);
    
    res.status(200).json({
      message: 'Actualización rápida completada exitosamente',
      update: {
        id: rentUpdate.id,
        lease: {
          id: lease.id,
          property: lease.Property.address,
          tenant: lease.Tenant.name,
          landlord: lease.Landlord.name
        },
        oldAmount,
        newAmount,
        increaseAmount,
        increasePercentage: percentage,
        reason,
        period,
        updateDate: rentUpdate.updateDate
      }
    });
    
  } catch (error) {
    console.error("Error en actualización rápida:", error);
    res.status(500).json({ 
      error: "Error en actualización rápida", 
      details: error.message 
    });
  }
};

// 🆕 3. Actualización masiva de múltiples contratos
exports.bulkUpdateLeases = async (req, res) => {
  try {
    const { contracts } = req.body;
    
    console.log(`📦 Iniciando actualización masiva de ${contracts.length} contratos`);
    
    if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ 
        error: 'Datos inválidos',
        details: 'Se requiere un array de contratos para actualizar'
      });
    }
    
    const results = {
      successful: [],
      failed: [],
      summary: {
        totalProcessed: contracts.length,
        successful: 0,
        failed: 0
      }
    };
    
    for (const contractData of contracts) {
      try {
        const { leaseId, percentage, reason, updateDate } = contractData;
        
        console.log(`🔄 Procesando contrato ${leaseId}...`);
        
        const lease = await Lease.findByPk(leaseId);
        if (!lease) {
          throw new Error(`Contrato ${leaseId} no encontrado`);
        }
        
        // Calcular nuevo monto
        const oldAmount = parseFloat(lease.rentAmount);
        const increaseAmount = (oldAmount * parseFloat(percentage)) / 100;
        const newAmount = oldAmount + increaseAmount;
        
        // Calcular período
        const period = calculateUpdatePeriod(
          lease.startDate, 
          lease.updateFrequency, 
          updateDate || new Date()
        );
        
        // Crear registro de actualización
        const rentUpdate = await RentUpdate.create({
          leaseId,
          updateDate: updateDate || new Date(),
          oldRentAmount: oldAmount,
          newRentAmount: newAmount,
          period: period,
          pdfPath: null
        });
        
        // Actualizar el contrato
        await lease.update({ rentAmount: newAmount });
        
        results.successful.push({
          leaseId,
          oldAmount,
          newAmount,
          increasePercentage: percentage,
          updateId: rentUpdate.id,
          reason
        });
        
        console.log(`✅ Contrato ${leaseId} actualizado exitosamente`);
        
      } catch (error) {
        console.error(`❌ Error procesando contrato ${contractData.leaseId}:`, error.message);
        
        results.failed.push({
          leaseId: contractData.leaseId,
          error: error.message,
          reason: contractData.reason
        });
      }
    }
    
    results.summary.successful = results.successful.length;
    results.summary.failed = results.failed.length;
    
    console.log(`📊 Actualización masiva completada: ${results.summary.successful} exitosos, ${results.summary.failed} fallidos`);
    
    const statusCode = results.summary.failed === 0 ? 200 : 207; // 207 = Multi-Status
    
    res.status(statusCode).json({
      message: 'Actualización masiva completada',
      results
    });
    
  } catch (error) {
    console.error("Error en actualización masiva:", error);
    res.status(500).json({ 
      error: "Error en actualización masiva", 
      details: error.message 
    });
  }
};

// 🆕 4. Obtener estadísticas de actualizaciones
exports.getUpdateStatistics = async (req, res) => {
  try {
    console.log('📈 Generando estadísticas de actualizaciones...');
    
    // Obtener todos los contratos activos
    const totalActiveLeases = await Lease.count({ where: { status: 'active' } });
    
    // Obtener contratos que necesitan actualización
    const pendingResponse = await exports.getLeasesPendingUpdate({ query: {} }, {
      status: () => ({ json: (data) => data })
    });
    const pendingCount = pendingResponse.count || 0;
    
    // Estadísticas de actualizaciones realizadas este año
    const currentYear = new Date().getFullYear();
    const updatesThisYear = await RentUpdate.findAll({
      where: {
        updateDate: {
          [Op.gte]: new Date(`${currentYear}-01-01`),
          [Op.lte]: new Date(`${currentYear}-12-31`)
        }
      },
      include: [{
        model: Lease,
        include: [
          { model: Property, attributes: ['address'] },
          { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] }
        ]
      }]
    });
    
    // Calcular estadísticas de incrementos
    const increments = updatesThisYear.map(update => {
      const oldAmount = update.oldRentAmount || 0;
      const newAmount = update.newRentAmount || 0;
      return oldAmount > 0 ? ((newAmount - oldAmount) / oldAmount) * 100 : 0;
    });
    
    const averageIncrease = increments.length > 0 
      ? increments.reduce((sum, inc) => sum + inc, 0) / increments.length 
      : 0;
    
    const maxIncrease = increments.length > 0 ? Math.max(...increments) : 0;
    const minIncrease = increments.length > 0 ? Math.min(...increments) : 0;
    
    // Estadísticas por frecuencia de actualización
    const byFrequency = await Lease.findAll({
      attributes: [
        'updateFrequency',
        [Lease.sequelize.fn('COUNT', Lease.sequelize.col('id')), 'count']
      ],
      where: { status: 'active' },
      group: ['updateFrequency'],
      raw: true
    });
    
    // Últimas actualizaciones
    const recentUpdates = await RentUpdate.findAll({
      limit: 10,
      order: [['updateDate', 'DESC']],
      include: [{
        model: Lease,
        include: [
          { model: Property, attributes: ['address'] },
          { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
          { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] }
        ]
      }]
    });
    
    console.log('✅ Estadísticas generadas exitosamente');
    
    res.status(200).json({
      message: 'Estadísticas de actualizaciones obtenidas exitosamente',
      statistics: {
        general: {
          totalActiveLeases,
          pendingUpdates: pendingCount,
          updatesThisYear: updatesThisYear.length,
          complianceRate: totalActiveLeases > 0 
            ? (((totalActiveLeases - pendingCount) / totalActiveLeases) * 100).toFixed(2)
            : 0
        },
        increments: {
          averageIncrease: averageIncrease.toFixed(2),
          maxIncrease: maxIncrease.toFixed(2),
          minIncrease: minIncrease.toFixed(2),
          totalIncrementsProcessed: increments.length
        },
        byFrequency: byFrequency.reduce((acc, item) => {
          acc[item.updateFrequency] = parseInt(item.count);
          return acc;
        }, {}),
        recentActivity: recentUpdates.map(update => ({
          id: update.id,
          date: update.updateDate,
          property: update.Lease.Property.address,
          tenant: update.Lease.Tenant.name,
          landlord: update.Lease.Landlord.name,
          oldAmount: update.oldRentAmount,
          newAmount: update.newRentAmount,
          increasePercentage: update.oldRentAmount > 0 
            ? (((update.newRentAmount - update.oldRentAmount) / update.oldRentAmount) * 100).toFixed(2)
            : 0
        }))
      }
    });
    
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ 
      error: "Error al obtener estadísticas", 
      details: error.message 
    });
  }
};

// 🆕 5. Endpoint para obtener contratos próximos a vencer
exports.getExpiringLeases = async (req, res) => {
  try {
    const { months = 3 } = req.query; // Por defecto, mostrar los que vencen en 3 meses
    
    console.log(`⏰ Buscando contratos que vencen en los próximos ${months} meses...`);
    
    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + parseInt(months));
    
    const leases = await Lease.findAll({
      where: { status: 'active' },
      include: [
        { model: Property, attributes: ['address'] },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] }
      ]
    });
    
    const expiringLeases = leases.filter(lease => {
      const startDate = new Date(lease.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + lease.totalMonths);
      
      return endDate >= now && endDate <= futureDate;
    }).map(lease => {
      const startDate = new Date(lease.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + lease.totalMonths);
      
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        id: lease.id,
        property: lease.Property.address,
        tenant: lease.Tenant.name,
        landlord: lease.Landlord.name,
        startDate: lease.startDate,
        endDate: endDate,
        daysUntilExpiry,
        totalMonths: lease.totalMonths,
        currentRent: lease.rentAmount,
        urgency: daysUntilExpiry <= 30 ? 'high' : daysUntilExpiry <= 60 ? 'medium' : 'low'
      };
    });
    
    // Ordenar por fecha de vencimiento (más próximos primero)
    expiringLeases.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    
    console.log(`✅ Encontrados ${expiringLeases.length} contratos próximos a vencer`);
    
    res.status(200).json({
      message: 'Contratos próximos a vencer obtenidos exitosamente',
      timeframe: `${months} meses`,
      count: expiringLeases.length,
      expiringLeases
    });
    
  } catch (error) {
    console.error("Error al obtener contratos próximos a vencer:", error);
    res.status(500).json({ 
      error: "Error al obtener contratos próximos a vencer", 
      details: error.message 
    });
  }
};

exports.updateLease = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`Actualizando lease ${id} con:`, updateData);

    const lease = await Lease.findByPk(id);
    
    if (!lease) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Actualizar el lease con los datos proporcionados
    await lease.update(updateData);

    // Obtener el lease actualizado con todas las relaciones
    const updatedLease = await Lease.findByPk(id, {
      include: [
        { model: Property },
        { model: Garantor, required: false },
        { model: Client, as: 'Tenant', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
        { model: Client, as: 'Landlord', attributes: ['name', 'cuil', 'direccion', 'ciudad', 'provincia', 'email', 'mobilePhone'] },
      ],
    });

    console.log('Lease actualizado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Contrato actualizado exitosamente',
      data: updatedLease
    });
  } catch (error) {
    console.error('Error al actualizar lease:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el contrato', 
      details: error.message 
    });
  }
};

module.exports = {
  createLease: exports.createLease,
  getAllLeases: exports.getAllLeases,
  getLeasesPendingUpdate: exports.getLeasesPendingUpdate,
  getLeaseUpdateHistory: exports.getLeaseUpdateHistory, // 🆕
  quickUpdateLeaseRent: exports.quickUpdateLeaseRent, // 🆕
  bulkUpdateLeases: exports.bulkUpdateLeases, // 🆕
  getUpdateStatistics: exports.getUpdateStatistics, // 🆕
  getExpiringLeases: exports.getExpiringLeases, // 🆕
  updateLease: exports.updateLease, // 🆕
  getLeaseById: exports.getLeaseById,
  terminateLease: exports.terminateLease,
  checkPendingPayments: exports.checkPendingPayments,
  
  updateRentAmount: exports.updateRentAmount,
  savePdf: exports.savePdf,
  fixForeignKeyConstraints,
  createTestRentUpdate,
  debugLeaseAlerts,
  needsUpdate,
};