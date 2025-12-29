const { Garantor, Lease } = require("../data");

exports.createGarantorsForLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    console.log("[createGarantorsForLease] leaseId recibido:", leaseId);
    console.log("[createGarantorsForLease] Body recibido:", req.body);

    const guarantors = req.body.guarantors; // Array de garantes

    // Validar que el contrato existe
    const lease = await Lease.findByPk(leaseId);
    console.log("[createGarantorsForLease] Lease encontrado:", lease);
    if (!lease) {
      console.error("[createGarantorsForLease] No se encontró el contrato de alquiler con ID:", leaseId);
      return res.status(404).json({ error: "Contrato de alquiler no encontrado" });
    }

    // Validar que hay garantes y que es un array
    if (!Array.isArray(guarantors) || guarantors.length === 0) {
      console.log("[createGarantorsForLease] No hay garantes para crear");
      return res.status(200).json({
        message: "No se proporcionaron garantes",
        guarantors: []
      });
    }

    // Validar que no haya más de 4 garantes
    if (guarantors.length > 4) {
      console.error("[createGarantorsForLease] Número de garantes excede el máximo:", guarantors.length);
      return res.status(400).json({
        error: "No se pueden agregar más de 4 garantes.",
      });
    }

    // Crear y asociar los garantes
    console.log("[createGarantorsForLease] Creando garantes...");
    const createdGuarantors = await Promise.all(
      guarantors.map((guarantorData, index) => {
        console.log(`[createGarantorsForLease] Creando garante ${index + 1}:`, guarantorData);
        return Garantor.create({ ...guarantorData, leaseId });
      })
    );
    console.log("[createGarantorsForLease] Garantes creados:", createdGuarantors);

    res.status(201).json({ message: "Garantes creados exitosamente", guarantors: createdGuarantors });
  } catch (error) {
    console.error("[createGarantorsForLease] Error al crear garantes:", error);
    res.status(500).json({
      error: "Error al crear garantes para el contrato de alquiler",
      details: error.message,
    });
  }
};


exports.updateGarantor = async (req, res) => {
    try {
      const { guarantorId } = req.params;
      const updatedData = req.body;
  
      // Verificar que el garante existe
      const guarantor = await Garantor.findByPk(guarantorId);
      if (!guarantor) {
        return res.status(404).json({ error: "Garante no encontrado" });
      }
  
      // Actualizar garante
      await guarantor.update(updatedData);
  
      res.status(200).json({ message: "Garante actualizado exitosamente", guarantor });
    } catch (error) {
      res.status(500).json({
        error: "Error al actualizar el garante",
        details: error.message,
      });
    }
  };
  
  exports.getGarantorsByLeaseId = async (req, res) => {
    try {
      const { leaseId } = req.params;
  
      // Verificar que el contrato existe
      const lease = await Lease.findByPk(leaseId, {
        include: { model: Garantor },
      });
      if (!lease) {
        return res.status(404).json({ error: "Contrato de alquiler no encontrado" });
      }
  
      res.status(200).json({ guarantors: lease.Garantors });
    } catch (error) {
      res.status(500).json({
        error: "Error al obtener los garantes del contrato de alquiler",
        details: error.message,
      });
    }
  };
  