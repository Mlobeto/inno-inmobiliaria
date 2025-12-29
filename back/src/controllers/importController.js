const XLSX = require('xlsx');
const { Client, Property } = require('../data/index');
const catchedAsync = require('../utils/catchedAsync');

// Función para validar CUIL
function isValidCuil(value) {
  const regex = /^\d{2}-\d{8}-\d$/;
  if (!regex.test(value)) {
    return false;
  }

  const [prefix, dni, verifier] = value.split("-");
  const cuilBase = `${prefix}${dni}`;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = cuilBase.split("").map(Number);

  const checksum = digits.reduce(
    (acc, digit, index) => acc + digit * weights[index],
    0
  );
  const mod11 = 11 - (checksum % 11);

  const expectedVerifier = mod11 === 11 ? 0 : mod11 === 10 ? 9 : mod11;
  return Number(verifier) === expectedVerifier;
}

// Función para validar email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función para validar teléfono
function isValidPhone(phone) {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
}

// Importar clientes desde Excel
const importClients = catchedAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se ha subido ningún archivo'
    });
  }

  try {
    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo está vacío'
      });
    }

    // Validar estructura del archivo
    const requiredColumns = ['cuil', 'name', 'email', 'direccion', 'mobile'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan las siguientes columnas: ${missingColumns.join(', ')}`
      });
    }

    const results = {
      success: [],
      errors: [],
      summary: {
        total: data.length,
        processed: 0,
        failed: 0
      }
    };

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y hay header

      try {
        // Validaciones
        const errors = [];

        if (!row.cuil || !isValidCuil(row.cuil)) {
          errors.push('CUIL inválido o vacío');
        }

        if (!row.name || row.name.trim() === '') {
          errors.push('Nombre es requerido');
        }

        if (!row.email || !isValidEmail(row.email)) {
          errors.push('Email inválido o vacío');
        }

        if (!row.direccion || row.direccion.trim() === '') {
          errors.push('Dirección es requerida');
        }

        if (!row.mobile || !isValidPhone(row.mobile)) {
          errors.push('Teléfono debe tener exactamente 10 dígitos');
        }

        if (errors.length > 0) {
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: errors
          });
          results.summary.failed++;
          continue;
        }

        // Verificar si ya existe el CUIL o email
        const existingClient = await Client.findOne({
          where: {
            $or: [
              { cuil: row.cuil },
              { email: row.email }
            ]
          }
        });

        if (existingClient) {
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: ['CUIL o email ya existe en el sistema']
          });
          results.summary.failed++;
          continue;
        }

        // Crear el cliente
        const clientData = {
          cuil: row.cuil,
          name: row.name.trim(),
          email: row.email.trim(),
          direccion: row.direccion.trim(),
          ciudad: row.ciudad || null,
          provincia: row.provincia || null,
          mobilePhone: row.mobile,
          linkMaps: row.linkMaps || null
        };

        const newClient = await Client.create(clientData);
        
        results.success.push({
          row: rowNumber,
          client: {
            id: newClient.idClient,
            name: newClient.name,
            email: newClient.email,
            cuil: newClient.cuil
          }
        });
        results.summary.processed++;

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          data: row,
          errors: [error.message]
        });
        results.summary.failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Importación completada. ${results.summary.processed} clientes procesados, ${results.summary.failed} errores`,
      results
    });

  } catch (error) {
    console.error('Error al procesar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo',
      error: error.message
    });
  }
});

// Importar propiedades desde Excel
const importProperties = catchedAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se ha subido ningún archivo'
    });
  }

  try {
    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El archivo está vacío'
      });
    }

    // Validar estructura del archivo
    const requiredColumns = ['address', 'type', 'typeProperty', 'price', 'comision', 'escritura'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Faltan las siguientes columnas: ${missingColumns.join(', ')}`
      });
    }

    const results = {
      success: [],
      errors: [],
      summary: {
        total: data.length,
        processed: 0,
        failed: 0
      }
    };

    // Valores permitidos
    const validTypes = ['venta', 'alquiler'];
    const validTypeProperties = ['casa', 'departamento', 'duplex', 'finca', 'local', 'oficina', 'lote', 'terreno'];
    const validEscrituras = ['prescripcion en tramite', 'escritura', 'prescripcion adjudicada', 'posesion'];

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y hay header

      try {
        // Validaciones
        const errors = [];

        if (!row.address || row.address.trim() === '') {
          errors.push('Dirección es requerida');
        }

        if (!row.type || !validTypes.includes(row.type)) {
          errors.push(`Tipo debe ser: ${validTypes.join(' o ')}`);
        }

        if (!row.typeProperty || !validTypeProperties.includes(row.typeProperty)) {
          errors.push(`Tipo de propiedad debe ser: ${validTypeProperties.join(', ')}`);
        }

        if (!row.price || isNaN(row.price) || Number(row.price) < 0) {
          errors.push('Precio debe ser un número mayor a 0');
        }

        if (!row.comision || isNaN(row.comision) || Number(row.comision) < 0 || Number(row.comision) > 100) {
          errors.push('Comisión debe ser un número entre 0 y 100');
        }

        if (!row.escritura || !validEscrituras.includes(row.escritura)) {
          errors.push(`Escritura debe ser: ${validEscrituras.join(', ')}`);
        }

        if (row.rooms && (isNaN(row.rooms) || Number(row.rooms) < 0)) {
          errors.push('Habitaciones debe ser un número mayor o igual a 0');
        }

        if (row.bathrooms && (isNaN(row.bathrooms) || Number(row.bathrooms) < 0)) {
          errors.push('Baños debe ser un número mayor o igual a 0');
        }

        if (row.plantQuantity && (isNaN(row.plantQuantity) || Number(row.plantQuantity) < 0)) {
          errors.push('Cantidad de plantas debe ser un número mayor o igual a 0');
        }

        if (errors.length > 0) {
          results.errors.push({
            row: rowNumber,
            data: row,
            errors: errors
          });
          results.summary.failed++;
          continue;
        }

        // Crear la propiedad
        const propertyData = {
          address: row.address.trim(),
          neighborhood: row.neighborhood || null,
          socio: row.socio || null,
          city: row.city || null,
          type: row.type,
          typeProperty: row.typeProperty,
          price: Number(row.price),
          rooms: row.rooms ? Number(row.rooms) : null,
          comision: Number(row.comision),
          isAvailable: row.isAvailable !== undefined ? Boolean(row.isAvailable) : true,
          description: row.description || null,
          escritura: row.escritura,
          plantType: row.plantType || null,
          plantQuantity: row.plantQuantity ? Number(row.plantQuantity) : null,
          bathrooms: row.bathrooms ? Number(row.bathrooms) : null,
          highlights: row.highlights || null,
          inventory: row.inventory || null,
          superficieCubierta: row.superficieCubierta || null,
          superficieTotal: row.superficieTotal || null
        };

        const newProperty = await Property.create(propertyData);
        
        results.success.push({
          row: rowNumber,
          property: {
            id: newProperty.propertyId,
            address: newProperty.address,
            type: newProperty.type,
            typeProperty: newProperty.typeProperty,
            price: newProperty.price
          }
        });
        results.summary.processed++;

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          data: row,
          errors: [error.message]
        });
        results.summary.failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Importación completada. ${results.summary.processed} propiedades procesadas, ${results.summary.failed} errores`,
      results
    });

  } catch (error) {
    console.error('Error al procesar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el archivo',
      error: error.message
    });
  }
});

module.exports = {
  importClients,
  importProperties
};