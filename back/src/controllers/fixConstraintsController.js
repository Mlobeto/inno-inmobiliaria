const { conn } = require('../data');

exports.checkConstraints = async (req, res) => {
  try {
    console.log('=== VERIFICANDO CONSTRAINTS ===');
    
    // Verificar constraints de Leases
    const leasesConstraints = await conn.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name='Leases'
    `, { type: conn.QueryTypes.SELECT });
    
    // Verificar constraints de ClientProperties
    const clientPropertiesConstraints = await conn.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name='ClientProperties'
    `, { type: conn.QueryTypes.SELECT });
    
    // Verificar si existe tabla Properties (plural)
    const tablesCheck = await conn.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Property' OR table_name = 'Properties' OR table_name = 'Client' OR table_name = 'Clients')
      ORDER BY table_name
    `, { type: conn.QueryTypes.SELECT });
    
    res.status(200).json({
      success: true,
      leasesConstraints,
      clientPropertiesConstraints,
      tablesFound: tablesCheck,
      message: 'Diagnóstico completado'
    });
    
  } catch (error) {
    console.error('Error al verificar constraints:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar constraints',
      details: error.message
    });
  }
};

exports.fixClientPropertyConstraints = async (req, res) => {
  try {
    console.log('=== INICIANDO CORRECCIÓN DE CONSTRAINTS ===');
    
    // 1. Eliminar constraints antiguos de ClientProperties
    console.log('Eliminando constraints antiguos de ClientProperties...');
    await conn.query('ALTER TABLE "ClientProperties" DROP CONSTRAINT IF EXISTS "ClientProperties_clientId_fkey"');
    await conn.query('ALTER TABLE "ClientProperties" DROP CONSTRAINT IF EXISTS "ClientProperties_propertyId_fkey"');
    console.log('✓ Constraints antiguos de ClientProperties eliminados');
    
    // 2. Crear constraints nuevos de ClientProperties con referencias correctas
    console.log('Creando constraints nuevos para ClientProperties...');
    await conn.query(`
      ALTER TABLE "ClientProperties" 
      ADD CONSTRAINT "ClientProperties_clientId_fkey" 
      FOREIGN KEY ("clientId") REFERENCES "Clients"("idClient") ON DELETE CASCADE
    `);
    
    await conn.query(`
      ALTER TABLE "ClientProperties" 
      ADD CONSTRAINT "ClientProperties_propertyId_fkey" 
      FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE CASCADE
    `);
    console.log('✓ Constraints de ClientProperties creados');
    
    // 3. Eliminar constraints antiguos de Leases
    console.log('Eliminando constraints antiguos de Leases...');
    await conn.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_landlordId_fkey"');
    await conn.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_tenantId_fkey"');
    await conn.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_propertyId_fkey"');
    await conn.query('ALTER TABLE "Leases" DROP CONSTRAINT IF EXISTS "Leases_propertyId_fkey1"');
    console.log('✓ Constraints antiguos de Leases eliminados');
    
    // 4. Crear constraints nuevos de Leases con referencias correctas
    console.log('Creando constraints nuevos para Leases...');
    await conn.query(`
      ALTER TABLE "Leases" 
      ADD CONSTRAINT "Leases_landlordId_fkey" 
      FOREIGN KEY ("landlordId") REFERENCES "Clients"("idClient") ON DELETE RESTRICT
    `);
    
    await conn.query(`
      ALTER TABLE "Leases" 
      ADD CONSTRAINT "Leases_tenantId_fkey" 
      FOREIGN KEY ("tenantId") REFERENCES "Clients"("idClient") ON DELETE RESTRICT
    `);
    
    await conn.query(`
      ALTER TABLE "Leases" 
      ADD CONSTRAINT "Leases_propertyId_fkey" 
      FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE RESTRICT
    `);
    console.log('✓ Constraints de Leases creados');
    
    console.log('=== CORRECCIÓN COMPLETADA EXITOSAMENTE ===');
    
    // 5. Eliminar tablas duplicadas si existen
    console.log('Verificando tablas duplicadas...');
    const tablesCheck = await conn.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'Properties' OR table_name = 'Client')
    `, { type: conn.QueryTypes.SELECT });
    
    let tablesDeleted = [];
    
    if (tablesCheck.length > 0) {
      for (const table of tablesCheck) {
        console.log(`Eliminando tabla ${table.table_name} duplicada...`);
        await conn.query(`DROP TABLE IF EXISTS "${table.table_name}" CASCADE`);
        tablesDeleted.push(table.table_name);
        console.log(`✓ Tabla ${table.table_name} eliminada`);
      }
    } else {
      console.log('No se encontraron tablas duplicadas');
    }
    
    res.status(200).json({
      success: true,
      message: 'Constraints corregidos exitosamente',
      details: 'Las referencias ahora apuntan a "Clients" y "Property" (singular)',
      tablesDeleted: tablesDeleted
    });
    
  } catch (error) {
    console.error('Error al corregir constraints:', error);
    res.status(500).json({
      success: false,
      error: 'Error al corregir constraints',
      details: error.message,
      stack: error.stack
    });
  }
};
