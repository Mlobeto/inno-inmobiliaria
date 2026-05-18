const prisma = require('../utils/prismaClient');
const fs = require('fs');
const path = require('path');

function decodeBase64(dataString) {
  try {
    const base64Data = dataString.startsWith('data:application/pdf;base64,')
      ? dataString.slice('data:application/pdf;base64,'.length)
      : dataString;

    return Buffer.from(base64Data, 'base64');
  } catch (error) {
    console.error('decodeBase64 - Error al decodificar Base64:', error);
    throw new Error('Error al decodificar la cadena Base64');
  }
}

const fixForeignKeyConstraints = async () => {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_landlordId_fkey"');
    await prisma.$executeRawUnsafe('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_renterId_fkey"');
    await prisma.$executeRawUnsafe('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_propertyId_fkey"');

    await prisma.$executeRawUnsafe('ALTER TABLE "Leases" ADD CONSTRAINT "Leases_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Clients"("idClient")');
    await prisma.$executeRawUnsafe('ALTER TABLE "Leases" ADD CONSTRAINT "Leases_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "Clients"("idClient")');
    await prisma.$executeRawUnsafe('ALTER TABLE "Leases" ADD CONSTRAINT "Leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId")');
    return true;
  } catch (error) {
    console.error('Error arreglando constraints:', error);
    throw error;
  }
};

function calculateUpdatePeriod(startDate, updateFrequency, updateDate) {
  const start = new Date(startDate);
  const update = new Date(updateDate);

  let monthsDiff = (update.getFullYear() - start.getFullYear()) * 12;
  monthsDiff += update.getMonth() - start.getMonth();
  if (update.getDate() < start.getDate()) {
    monthsDiff--;
  }

  switch (updateFrequency) {
    case 'semestral':
      return `Semestre ${Math.floor(monthsDiff / 6) + 1}`;
    case 'cuatrimestral':
      return `Cuatrimestre ${Math.floor(monthsDiff / 4) + 1}`;
    case 'anual':
      return `Año ${Math.floor(monthsDiff / 12) + 1}`;
    default:
      return 'Desconocido';
  }
}

function getNextUpdateDate(startDate, updateFrequency) {
  let freqMonths = 0;
  if (updateFrequency === 'semestral') freqMonths = 6;
  else if (updateFrequency === 'cuatrimestral') freqMonths = 4;
  else if (updateFrequency === 'anual') freqMonths = 12;

  const start = new Date(startDate);
  const now = new Date();
  const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);

  const nextUpdate = new Date(start);
  nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);
  return nextUpdate;
}

function needsUpdate(startDate, updateFrequency) {
  let freqMonths = 0;
  if (updateFrequency === 'semestral') freqMonths = 6;
  else if (updateFrequency === 'cuatrimestral') freqMonths = 4;
  else if (updateFrequency === 'anual') freqMonths = 12;

  const start = new Date(startDate);
  const now = new Date();
  const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return monthsSinceStart >= freqMonths && (monthsSinceStart % freqMonths === 0 || monthsSinceStart > freqMonths);
}

async function enrichLeases(leases) {
  if (!leases.length) return [];

  const tenantIds = [...new Set(leases.map((l) => l.tenantId).filter((id) => id != null))];
  if (tenantIds.length !== 1) {
    console.error('[enrichLeases] expected a single tenant in batch', { tenantIds, leaseCount: leases.length });
    throw new Error('Inconsistencia de tenant al enriquecer contratos');
  }
  const tenantId = tenantIds[0];

  const leaseIds = leases.map((l) => l.id);
  const propertyIds = [...new Set(leases.map((l) => l.propertyId))];
  const renterIds = [...new Set(leases.map((l) => l.renterId))];
  const landlordIds = [...new Set(leases.map((l) => l.landlordId))];

  const [properties, renters, landlords, receipts, garantors, updates] = await Promise.all([
    prisma.Property.findMany({ where: { propertyId: { in: propertyIds }, tenantId } }),
    prisma.Clients.findMany({
      where: { idClient: { in: renterIds }, tenantId },
      select: { name: true, cuil: true, direccion: true, ciudad: true, provincia: true, email: true, mobilePhone: true, idClient: true },
    }),
    prisma.Clients.findMany({
      where: { idClient: { in: landlordIds }, tenantId },
      select: { name: true, cuil: true, direccion: true, ciudad: true, provincia: true, email: true, mobilePhone: true, idClient: true },
    }),
    prisma.PaymentReceipts.findMany({ where: { leaseId: { in: leaseIds } } }),
    prisma.Garantors.findMany({ where: { leaseId: { in: leaseIds } } }),
    prisma.RentUpdates.findMany({ where: { leaseId: { in: leaseIds } }, orderBy: { updateDate: 'desc' } }),
  ]);

  const propertyMap = new Map(properties.map((p) => [p.propertyId, p]));
  const renterMap = new Map(renters.map((c) => [c.idClient, c]));
  const landlordMap = new Map(landlords.map((c) => [c.idClient, c]));

  const receiptsByLease = new Map();
  const garantorsByLease = new Map();
  const updatesByLease = new Map();

  for (const item of receipts) {
    const arr = receiptsByLease.get(item.leaseId) || [];
    arr.push(item);
    receiptsByLease.set(item.leaseId, arr);
  }
  for (const item of garantors) {
    const arr = garantorsByLease.get(item.leaseId) || [];
    arr.push(item);
    garantorsByLease.set(item.leaseId, arr);
  }
  for (const item of updates) {
    const arr = updatesByLease.get(item.leaseId) || [];
    arr.push(item);
    updatesByLease.set(item.leaseId, arr);
  }

  return leases.map((lease) => ({
    ...lease,
    leaseId: lease.id,
    Property: propertyMap.get(lease.propertyId) || null,
    Tenant: renterMap.get(lease.renterId) || null,
    Renter: renterMap.get(lease.renterId) || null,
    Landlord: landlordMap.get(lease.landlordId) || null,
    PaymentReceipts: receiptsByLease.get(lease.id) || [],
    Garantors: garantorsByLease.get(lease.id) || [],
    RentUpdates: updatesByLease.get(lease.id) || [],
  }));
}

exports.savePdf = async (req, res) => {
  try {
    const { pdfData, fileName, leaseId } = req.body;

    if (!pdfData || !fileName || !leaseId) {
      return res.status(400).json({
        error: 'Datos incompletos',
        details: 'Los campos pdfData, fileName y leaseId son obligatorios',
      });
    }

    const buffer = decodeBase64(pdfData);
    const pdfDirectory = path.join(__dirname, '../../pdfs');
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true });
    }

    const filePath = path.join(pdfDirectory, fileName);
    fs.writeFile(filePath, buffer, async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al guardar el PDF', details: err.message });
      }

      const lease = await prisma.Leases.findUnique({ where: { id: parseInt(leaseId, 10) } });
      if (!lease) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      await prisma.Leases.update({
        where: { id: parseInt(leaseId, 10) },
        data: { pdfPath: filePath },
      });

      return res.status(200).json({
        message: 'PDF guardado exitosamente y contrato actualizado',
        filePath,
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el PDF', details: error.message });
  }
};

exports.createLease = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { propertyId, landlordId, renterId, startDate, rentAmount, updateFrequency, commission, totalMonths, inventory, garantiaType, seguroCaucionCompania, seguroCaucionDatos, agencyCommissionType, agencyCommissionValue } = req.body;

    if (!propertyId || !landlordId || !renterId || !startDate || !rentAmount || !totalMonths || !inventory) {
      return res.status(400).json({
        error: 'Datos incompletos',
        details: 'Los campos propertyId, landlordId, renterId, startDate, rentAmount, totalMonths e inventory son obligatorios',
      });
    }

    const parsedData = {
      propertyId: parseInt(propertyId, 10),
      landlordId: parseInt(landlordId, 10),
      renterId: parseInt(renterId, 10),
      startDate: new Date(startDate),
      rentAmount: parseFloat(rentAmount),
      updateFrequency,
      commission: commission ? parseFloat(commission) : null,
      totalMonths: parseInt(totalMonths, 10),
      inventory,
      garantiaType: garantiaType || null,
      seguroCaucionCompania: garantiaType === 'seguro_caucion' ? (seguroCaucionCompania || null) : null,
      seguroCaucionDatos: garantiaType === 'seguro_caucion' ? (seguroCaucionDatos || null) : null,
      agencyCommissionType: agencyCommissionType || null,
      agencyCommissionValue: agencyCommissionValue ? parseFloat(agencyCommissionValue) : null,
      tenantId,
    };

    const [property, landlord, renter, ownerRole] = await Promise.all([
      prisma.Property.findFirst({ where: { propertyId: parsedData.propertyId, tenantId } }),
      prisma.Clients.findFirst({ where: { idClient: parsedData.landlordId, tenantId } }),
      prisma.Clients.findFirst({ where: { idClient: parsedData.renterId, tenantId } }),
      prisma.ClientProperties.findFirst({
        where: {
          clientId: parsedData.landlordId,
          propertyId: parsedData.propertyId,
          tenantId,
          role: 'propietario',
        },
      }),
    ]);

    if (!property) return res.status(404).json({ error: 'Propiedad no encontrada' });
    if (property.isAvailable === false) return res.status(400).json({ error: 'La propiedad ya no está disponible' });
    if (!landlord) return res.status(404).json({ error: 'Propietario no encontrado' });
    if (!renter) return res.status(404).json({ error: 'Inquilino no encontrado' });
    if (parsedData.landlordId === parsedData.renterId) return res.status(400).json({ error: 'El propietario y el inquilino no pueden ser la misma persona' });
    if (!ownerRole) return res.status(400).json({ error: 'El cliente no tiene rol de propietario para esta propiedad' });

    const newLease = await prisma.Leases.create({
      data: parsedData,
    });

    await prisma.Property.update({
      where: { propertyId: parsedData.propertyId },
      data: { isAvailable: false },
    });

    // Registrar comisión de la inmobiliaria por apertura del contrato
    if (agencyCommissionType && agencyCommissionValue) {
      const rent = parsedData.rentAmount;
      const commissionAmount = agencyCommissionType === 'months'
        ? parseFloat((rent * parseFloat(agencyCommissionValue)).toFixed(2))
        : parseFloat(agencyCommissionValue);

      const fecha = new Date(startDate);
      const mes   = fecha.toLocaleDateString('es-AR', { month: 'long' });
      const año   = fecha.getFullYear();

      await prisma.PaymentReceipts.create({
        data: {
          tenantId,
          leaseId:   newLease.id,
          idClient:  parsedData.landlordId,
          paymentDate: new Date(startDate),
          amount:    commissionAmount,
          originalCurrency: 'ARS',
          period:    `Comisión de apertura - ${mes} ${año}`,
          type:      'commission',
          status:    'pending',
        },
      });
    }

    const existingTenantRole = await prisma.ClientProperties.findFirst({
      where: {
        clientId: parsedData.renterId,
        propertyId: parsedData.propertyId,
        tenantId,
        role: 'inquilino',
      },
    });

    if (!existingTenantRole) {
      await prisma.ClientProperties.create({
        data: {
          clientId: parsedData.renterId,
          propertyId: parsedData.propertyId,
          tenantId,
          role: 'inquilino',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    const [fullLease] = await enrichLeases([
      await prisma.Leases.findUnique({ where: { id: newLease.id } }),
    ]);

    res.status(201).json(fullLease);
  } catch (error) {
    res.status(500).json({
      error: 'Error al crear el contrato de alquiler',
      details: error.message,
    });
  }
};

exports.getLeaseById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);

    const lease = await prisma.Leases.findFirst({ where: { id, tenantId } });
    if (!lease) return res.status(404).json({ message: 'Contrato no encontrado' });

    const [enriched] = await enrichLeases([lease]);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el contrato', details: error.message });
  }
};

exports.terminateLease = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);

    const lease = await prisma.Leases.findFirst({ where: { id, tenantId } });
    if (!lease) return res.status(404).json({ error: 'Contrato de alquiler no encontrado' });

    await prisma.Property.update({ where: { propertyId: lease.propertyId }, data: { isAvailable: true } });
    await prisma.Leases.update({ where: { id }, data: { status: 'terminated' } });

    res.status(200).json({ message: 'Contrato terminado y propiedad marcada como disponible' });
  } catch (error) {
    res.status(500).json({ error: 'Error al terminar el contrato de alquiler', details: error.message });
  }
};

exports.getAllLeases = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const leases = await prisma.Leases.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    const enriched = await enrichLeases(leases);

    const leasesWithUpdateInfo = enriched.map((lease) => {
      const start = new Date(lease.startDate);
      const now = new Date();

      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;

      const shouldUpdate = monthsSinceStart >= freqMonths;
      const periodsElapsed = freqMonths > 0 ? Math.floor(monthsSinceStart / freqMonths) : 0;
      const nextUpdate = new Date(start);
      if (freqMonths > 0) nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);

      const lastUpdate = lease.RentUpdates?.[0] || null;

      return {
        ...lease,
        updateInfo: {
          monthsSinceStart,
          shouldUpdate,
          lastUpdateDate: lastUpdate ? lastUpdate.updateDate : null,
          nextUpdateDate: nextUpdate,
          periodsElapsed,
          hasUpdates: (lease.RentUpdates || []).length > 0,
        },
      };
    });

    res.status(200).json(leasesWithUpdateInfo);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contratos', details: error.message });
  }
};

exports.checkPendingPayments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const activeLeases = await prisma.Leases.findMany({
      where: {
        tenantId,
        status: { not: 'terminated' },
      },
    });

    const leaseIds = activeLeases.map((l) => l.id);
    const monthlyReceipts = await prisma.PaymentReceipts.findMany({
      where: {
        tenantId,
        leaseId: { in: leaseIds.length ? leaseIds : [-1] },
      },
      select: { leaseId: true, paymentDate: true },
    });

    const paidLeaseIds = new Set(
      monthlyReceipts
        .filter((r) => {
          const d = new Date(r.paymentDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .map((r) => r.leaseId)
    );

    const pendingLeases = activeLeases.filter((lease) => !paidLeaseIds.has(lease.id));
    if (!pendingLeases.length) {
      return res.status(200).json({ message: 'No hay pagos pendientes.' });
    }

    const enriched = await enrichLeases(pendingLeases);

    res.status(200).json({
      message: 'Pagos pendientes encontrados.',
      pendingPayments: enriched.map((lease) => ({
        leaseId: lease.id,
        tenantName: lease.Tenant?.name,
        landlordName: lease.Landlord?.name,
        propertyId: lease.propertyId,
        rentAmount: lease.rentAmount,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar pagos pendientes.', details: error.message });
  }
};

exports.updateRentAmount = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { newRentAmount, updateDate, pdfData, fileName } = req.body;

    if (!newRentAmount || !updateDate || !pdfData || !fileName) {
      return res.status(400).json({ error: 'El nuevo monto de alquiler, la fecha de actualización, el PDF y el nombre del archivo son obligatorios.' });
    }

    const lease = await prisma.Leases.findUnique({ where: { id } });
    if (!lease) return res.status(404).json({ error: 'Contrato no encontrado.' });

    const period = calculateUpdatePeriod(lease.startDate, lease.updateFrequency, updateDate);

    const pdfDirectory = path.join(__dirname, '../../pdfs');
    if (!fs.existsSync(pdfDirectory)) fs.mkdirSync(pdfDirectory, { recursive: true });
    const filePath = path.join(pdfDirectory, fileName);

    fs.writeFileSync(filePath, decodeBase64(pdfData));

    await prisma.RentUpdates.create({
      data: {
        leaseId: id,
        tenantId: lease.tenantId,
        updateDate: new Date(updateDate),
        oldRentAmount: lease.rentAmount,
        newRentAmount: parseFloat(newRentAmount),
        period,
        pdfPath: filePath,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const updatedLease = await prisma.Leases.update({
      where: { id },
      data: { rentAmount: parseFloat(newRentAmount) },
    });

    res.status(200).json({ message: 'Monto de alquiler actualizado con éxito.', lease: { ...updatedLease, leaseId: updatedLease.id } });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el monto del alquiler.', details: error.message });
  }
};

const createTestRentUpdate = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { testDate, newRentAmount } = req.body;

    const lease = await prisma.Leases.findUnique({ where: { id } });
    if (!lease) return res.status(404).json({ message: 'Contrato no encontrado' });

    const generatedNewAmount = newRentAmount || Number(lease.rentAmount) * 1.1;

    const testUpdate = await prisma.RentUpdates.create({
      data: {
        leaseId: id,
        tenantId: lease.tenantId,
        oldRentAmount: lease.rentAmount,
        newRentAmount: generatedNewAmount,
        updateDate: new Date(testDate),
        period: calculateUpdatePeriod(lease.startDate, lease.updateFrequency, testDate),
        createdAt: new Date(testDate),
        updatedAt: new Date(testDate),
      },
    });

    await prisma.Leases.update({
      where: { id },
      data: {
        rentAmount: generatedNewAmount,
        updatedAt: new Date(testDate),
      },
    });

    res.json({
      message: 'Actualización de prueba creada exitosamente',
      testUpdate,
      nextUpdateDate: getNextUpdateDate(lease.startDate, lease.updateFrequency),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear actualización de prueba', error: error.message });
  }
};

const debugLeaseAlerts = async (req, res) => {
  try {
    const leases = await prisma.Leases.findMany();
    const enriched = await enrichLeases(leases);

    const now = new Date();
    const debugInfo = enriched.map((lease) => {
      const nextUpdate = getNextUpdateDate(lease.startDate, lease.updateFrequency);
      const daysUntilUpdate = Math.ceil((new Date(nextUpdate) - now) / (1000 * 60 * 60 * 24));
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
        nextUpdateDate: nextUpdate,
        daysUntilUpdate,
        shouldAlert,
      };
    });

    res.json({
      message: 'Debug de alertas completado',
      currentDate: now.toLocaleDateString(),
      totalLeases: leases.length,
      alertCount: debugInfo.filter((info) => info.shouldAlert).length,
      debugInfo,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al debuggear alertas', error: error.message });
  }
};

exports.getLeasesPendingUpdate = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const now = new Date();

    const leases = await prisma.Leases.findMany({ where: { status: 'active', tenantId } });
    const enriched = await enrichLeases(leases);

    const pendingUpdates = enriched.filter((lease) => {
      const start = new Date(lease.startDate);
      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;

      const shouldUpdate = monthsSinceStart >= freqMonths;
      const lastUpdate = lease.RentUpdates?.[0] || null;

      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate.updateDate);
        const monthsSinceLastUpdate = (now.getFullYear() - lastUpdateDate.getFullYear()) * 12 + (now.getMonth() - lastUpdateDate.getMonth());
        return shouldUpdate && monthsSinceLastUpdate >= freqMonths;
      }

      return shouldUpdate;
    });

    const detailedPendingUpdates = pendingUpdates.map((lease) => {
      const start = new Date(lease.startDate);
      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;

      const periodsOverdue = freqMonths > 0 ? Math.floor(monthsSinceStart / freqMonths) : 0;
      const monthsOverdue = monthsSinceStart - periodsOverdue * freqMonths;

      return {
        id: lease.id,
        property: lease.Property?.address,
        tenant: lease.Tenant?.name,
        landlord: lease.Landlord?.name,
        currentRent: lease.rentAmount,
        updateFrequency: lease.updateFrequency,
        startDate: lease.startDate,
        monthsSinceStart,
        periodsOverdue,
        monthsOverdue,
        urgency: monthsOverdue > 6 ? 'high' : monthsOverdue > 3 ? 'medium' : 'low',
        lastUpdate: lease.RentUpdates?.[0]?.updateDate || null,
      };
    });

    detailedPendingUpdates.sort((a, b) => b.monthsSinceStart - a.monthsSinceStart);

    res.status(200).json({
      message: 'Contratos pendientes de actualización obtenidos exitosamente',
      count: pendingUpdates.length,
      currentDate: now.toLocaleDateString('es-AR'),
      pendingUpdates: detailedPendingUpdates,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contratos pendientes', details: error.message });
  }
};

exports.getLeaseUpdateHistory = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);

    const lease = await prisma.Leases.findFirst({ where: { id, tenantId } });
    if (!lease) return res.status(404).json({ error: 'Contrato no encontrado' });

    const [enrichedLease] = await enrichLeases([lease]);
    const updates = await prisma.RentUpdates.findMany({
      where: { leaseId: id, tenantId },
      orderBy: { updateDate: 'desc' },
    });

    const totalUpdates = updates.length;
    const firstUpdate = totalUpdates ? updates[totalUpdates - 1] : null;
    const lastUpdate = totalUpdates ? updates[0] : null;

    let totalIncrease = 0;
    let averageIncrease = 0;

    if (totalUpdates) {
      const initialAmount = Number(firstUpdate.oldRentAmount || lease.rentAmount);
      const currentAmount = Number(lease.rentAmount);
      totalIncrease = initialAmount > 0 ? ((currentAmount - initialAmount) / initialAmount) * 100 : 0;

      const increments = updates.map((update) => {
        const oldAmount = Number(update.oldRentAmount || 0);
        const newAmount = Number(update.newRentAmount || 0);
        return oldAmount > 0 ? ((newAmount - oldAmount) / oldAmount) * 100 : 0;
      });
      averageIncrease = increments.reduce((sum, inc) => sum + inc, 0) / increments.length;
    }

    res.status(200).json({
      message: 'Historial de actualizaciones obtenido exitosamente',
      lease: {
        id: enrichedLease.id,
        property: enrichedLease.Property?.address,
        tenant: enrichedLease.Tenant?.name,
        landlord: enrichedLease.Landlord?.name,
        currentRent: enrichedLease.rentAmount,
        startDate: enrichedLease.startDate,
        updateFrequency: enrichedLease.updateFrequency,
      },
      statistics: {
        totalUpdates,
        totalIncreasePercentage: totalIncrease.toFixed(2),
        averageIncreasePercentage: averageIncrease.toFixed(2),
        firstUpdateDate: firstUpdate ? firstUpdate.updateDate : null,
        lastUpdateDate: lastUpdate ? lastUpdate.updateDate : null,
      },
      updates: updates.map((update) => {
        const oldAmount = Number(update.oldRentAmount || 0);
        const newAmount = Number(update.newRentAmount || 0);
        return {
          id: update.id,
          updateDate: update.updateDate,
          oldAmount,
          newAmount,
          increaseAmount: newAmount - oldAmount,
          increasePercentage: oldAmount > 0 ? (((newAmount - oldAmount) / oldAmount) * 100).toFixed(2) : 0,
          period: update.period,
          pdfPath: update.pdfPath,
          createdAt: update.createdAt,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de actualizaciones', details: error.message });
  }
};

exports.quickUpdateLeaseRent = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { percentage, reason, updateDate } = req.body;

    if (!percentage || !reason) {
      return res.status(400).json({ error: 'Datos incompletos', details: 'El porcentaje y la razón son obligatorios' });
    }

    const lease = await prisma.Leases.findUnique({ where: { id } });
    if (!lease) return res.status(404).json({ error: 'Contrato no encontrado' });

    const oldAmount = Number(lease.rentAmount);
    const increaseAmount = (oldAmount * Number(percentage)) / 100;
    const newAmount = oldAmount + increaseAmount;

    const period = calculateUpdatePeriod(lease.startDate, lease.updateFrequency, updateDate || new Date());

    const rentUpdate = await prisma.RentUpdates.create({
      data: {
        leaseId: id,
        tenantId: lease.tenantId,
        updateDate: updateDate ? new Date(updateDate) : new Date(),
        oldRentAmount: oldAmount,
        newRentAmount: newAmount,
        period,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.Leases.update({ where: { id }, data: { rentAmount: newAmount } });

    const [enriched] = await enrichLeases([lease]);

    res.status(200).json({
      message: 'Actualización rápida completada exitosamente',
      update: {
        id: rentUpdate.id,
        lease: {
          id: lease.id,
          property: enriched.Property?.address,
          tenant: enriched.Tenant?.name,
          landlord: enriched.Landlord?.name,
        },
        oldAmount,
        newAmount,
        increaseAmount,
        increasePercentage: percentage,
        reason,
        period,
        updateDate: rentUpdate.updateDate,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en actualización rápida', details: error.message });
  }
};

exports.bulkUpdateLeases = async (req, res) => {
  try {
    const { contracts } = req.body;

    if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos', details: 'Se requiere un array de contratos para actualizar' });
    }

    const results = {
      successful: [],
      failed: [],
      summary: {
        totalProcessed: contracts.length,
        successful: 0,
        failed: 0,
      },
    };

    for (const contractData of contracts) {
      try {
        const leaseId = parseInt(contractData.leaseId, 10);
        const lease = await prisma.Leases.findUnique({ where: { id: leaseId } });
        if (!lease) throw new Error(`Contrato ${leaseId} no encontrado`);

        const oldAmount = Number(lease.rentAmount);
        const increaseAmount = (oldAmount * Number(contractData.percentage)) / 100;
        const newAmount = oldAmount + increaseAmount;

        const period = calculateUpdatePeriod(lease.startDate, lease.updateFrequency, contractData.updateDate || new Date());

        const rentUpdate = await prisma.RentUpdates.create({
          data: {
            leaseId,
            tenantId: lease.tenantId,
            updateDate: contractData.updateDate ? new Date(contractData.updateDate) : new Date(),
            oldRentAmount: oldAmount,
            newRentAmount: newAmount,
            period,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        await prisma.Leases.update({ where: { id: leaseId }, data: { rentAmount: newAmount } });

        results.successful.push({
          leaseId,
          oldAmount,
          newAmount,
          increasePercentage: contractData.percentage,
          updateId: rentUpdate.id,
          reason: contractData.reason,
        });
      } catch (error) {
        results.failed.push({
          leaseId: contractData.leaseId,
          error: error.message,
          reason: contractData.reason,
        });
      }
    }

    results.summary.successful = results.successful.length;
    results.summary.failed = results.failed.length;

    const statusCode = results.summary.failed === 0 ? 200 : 207;
    res.status(statusCode).json({ message: 'Actualización masiva completada', results });
  } catch (error) {
    res.status(500).json({ error: 'Error en actualización masiva', details: error.message });
  }
};

exports.getUpdateStatistics = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const totalActiveLeases = await prisma.Leases.count({ where: { status: 'active', tenantId } });

    const activeLeases = await prisma.Leases.findMany({ where: { status: 'active', tenantId } });
    const enrichedActiveLeases = await enrichLeases(activeLeases);

    const now = new Date();
    const pendingCount = enrichedActiveLeases.filter((lease) => {
      const start = new Date(lease.startDate);
      const monthsSinceStart = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;
      if (freqMonths === 0) return false;

      const shouldUpdate = monthsSinceStart >= freqMonths;
      const lastUpdate = lease.RentUpdates?.[0] || null;
      if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate.updateDate);
        const monthsSinceLastUpdate = (now.getFullYear() - lastUpdateDate.getFullYear()) * 12 + (now.getMonth() - lastUpdateDate.getMonth());
        return shouldUpdate && monthsSinceLastUpdate >= freqMonths;
      }
      return shouldUpdate;
    }).length;

    const currentYear = new Date().getFullYear();
    const updatesThisYear = await prisma.RentUpdates.findMany({
      where: {
        tenantId,
        updateDate: {
          gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        },
      },
      orderBy: { updateDate: 'desc' },
    });

    const increments = updatesThisYear.map((update) => {
      const oldAmount = Number(update.oldRentAmount || 0);
      const newAmount = Number(update.newRentAmount || 0);
      return oldAmount > 0 ? ((newAmount - oldAmount) / oldAmount) * 100 : 0;
    });

    const averageIncrease = increments.length ? increments.reduce((sum, inc) => sum + inc, 0) / increments.length : 0;
    const maxIncrease = increments.length ? Math.max(...increments) : 0;
    const minIncrease = increments.length ? Math.min(...increments) : 0;

    const byFrequencyRaw = await prisma.Leases.groupBy({
      by: ['updateFrequency'],
      where: { status: 'active', tenantId },
      _count: { id: true },
    });

    const recentUpdates = await prisma.RentUpdates.findMany({
      where: { tenantId },
      take: 10,
      orderBy: { updateDate: 'desc' },
    });

    const leasesForRecent = await prisma.Leases.findMany({ where: { id: { in: recentUpdates.map((u) => u.leaseId).filter(Boolean) } } });
    const enrichedRecentLeases = await enrichLeases(leasesForRecent);
    const leaseMap = new Map(enrichedRecentLeases.map((l) => [l.id, l]));

    res.status(200).json({
      message: 'Estadísticas de actualizaciones obtenidas exitosamente',
      statistics: {
        general: {
          totalActiveLeases,
          pendingUpdates: pendingCount,
          updatesThisYear: updatesThisYear.length,
          complianceRate: totalActiveLeases > 0 ? Number((((totalActiveLeases - pendingCount) / totalActiveLeases) * 100).toFixed(2)) : 0,
        },
        increments: {
          averageIncrease: Number(averageIncrease.toFixed(2)),
          maxIncrease: Number(maxIncrease.toFixed(2)),
          minIncrease: Number(minIncrease.toFixed(2)),
          totalIncrementsProcessed: increments.length,
        },
        byFrequency: byFrequencyRaw.reduce((acc, item) => {
          acc[item.updateFrequency] = item._count.id;
          return acc;
        }, {}),
        recentActivity: recentUpdates.map((update) => {
          const lease = leaseMap.get(update.leaseId);
          const oldAmount = Number(update.oldRentAmount || 0);
          const newAmount = Number(update.newRentAmount || 0);

          return {
            id: update.id,
            date: update.updateDate,
            property: lease?.Property?.address,
            tenant: lease?.Tenant?.name,
            landlord: lease?.Landlord?.name,
            oldAmount,
            newAmount,
            increasePercentage: oldAmount > 0 ? Number((((newAmount - oldAmount) / oldAmount) * 100).toFixed(2)) : 0,
          };
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
  }
};

exports.getExpiringLeases = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const months = parseInt(req.query.months || 3, 10);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);

    const leases = await prisma.Leases.findMany({ where: { status: 'active', tenantId } });
    const enriched = await enrichLeases(leases);

    const expiringLeases = enriched
      .filter((lease) => {
        const startDate = new Date(lease.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + lease.totalMonths);
        return endDate >= now && endDate <= futureDate;
      })
      .map((lease) => {
        const startDate = new Date(lease.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + lease.totalMonths);
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        return {
          id: lease.id,
          property: lease.Property?.address,
          tenant: lease.Tenant?.name,
          landlord: lease.Landlord?.name,
          startDate: lease.startDate,
          endDate,
          daysUntilExpiry,
          totalMonths: lease.totalMonths,
          currentRent: lease.rentAmount,
          urgency: daysUntilExpiry <= 30 ? 'high' : daysUntilExpiry <= 60 ? 'medium' : 'low',
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    res.status(200).json({
      message: 'Contratos próximos a vencer obtenidos exitosamente',
      timeframe: `${months} meses`,
      count: expiringLeases.length,
      expiringLeases,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener contratos próximos a vencer', details: error.message });
  }
};

exports.updateLease = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updateData = req.body;

    const lease = await prisma.Leases.findUnique({ where: { id } });
    if (!lease) return res.status(404).json({ error: 'Contrato no encontrado' });

    await prisma.Leases.update({ where: { id }, data: updateData });

    const [updatedLease] = await enrichLeases([
      await prisma.Leases.findUnique({ where: { id } }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Contrato actualizado exitosamente',
      data: updatedLease,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el contrato', details: error.message });
  }
};

module.exports = {
  createLease: exports.createLease,
  getAllLeases: exports.getAllLeases,
  getLeasesPendingUpdate: exports.getLeasesPendingUpdate,
  getLeaseUpdateHistory: exports.getLeaseUpdateHistory,
  quickUpdateLeaseRent: exports.quickUpdateLeaseRent,
  bulkUpdateLeases: exports.bulkUpdateLeases,
  getUpdateStatistics: exports.getUpdateStatistics,
  getExpiringLeases: exports.getExpiringLeases,
  updateLease: exports.updateLease,
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
