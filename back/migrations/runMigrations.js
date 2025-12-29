// Script para ejecutar migraciones automáticamente
// Ejecutar con: node back/migrations/runMigrations.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Conectando a Neon PostgreSQL...');
    
    const client = await pool.connect();
    console.log('✅ Conectado exitosamente');

    // Lista de migraciones a ejecutar
    const migrations = [
      'add-custom-content-to-leases.sql',
      'add-initial-payment-type.sql'
    ];

    for (const migration of migrations) {
      const sqlPath = path.join(__dirname, migration);
      
      if (!fs.existsSync(sqlPath)) {
        console.log(`⚠️  Migración ${migration} no encontrada, saltando...`);
        continue;
      }

      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`📝 Ejecutando migración: ${migration}`);
      
      try {
        await client.query(sql);
        console.log(`✅ Migración ${migration} ejecutada exitosamente`);
      } catch (error) {
        console.error(`❌ Error en migración ${migration}:`, error.message);
      }
    }

    // Verificaciones
    console.log('\n🔍 Verificando cambios en la base de datos...\n');

    // Verificar columna customContent
    const leaseResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Leases' AND column_name = 'customContent'
    `);

    if (leaseResult.rows.length > 0) {
      console.log('✅ Columna customContent:', leaseResult.rows[0]);
    } else {
      console.log('⚠️  Columna customContent NO encontrada');
    }

    // Verificar tipos ENUM de PaymentReceipts
    const enumResult = await client.query(`
      SELECT e.enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'enum_PaymentReceipts_type'
      ORDER BY e.enumsortorder
    `);

    if (enumResult.rows.length > 0) {
      console.log('✅ Tipos de pago disponibles:', enumResult.rows.map(r => r.enumlabel).join(', '));
    }

    // Verificar nullable de installmentNumber
    const nullableResult = await client.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'PaymentReceipts' 
        AND column_name IN ('installmentNumber', 'totalInstallments')
    `);

    if (nullableResult.rows.length > 0) {
      console.log('✅ Campos opcionales en PaymentReceipts:');
      nullableResult.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.is_nullable === 'YES' ? 'nullable ✓' : 'not null'}`);
      });
    }

    client.release();
    await pool.end();
    
    console.log('✅ Proceso completado');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
