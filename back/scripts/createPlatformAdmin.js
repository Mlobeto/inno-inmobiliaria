/**
 * Script Node.js para crear un usuario PLATFORM_ADMIN
 * Ejecutar con: node back/scripts/createPlatformAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

// Usar DATABASE_URL de Neon (producción) o local
const DATABASE_URL = process.env.DATABASE_URL 
  || 'postgresql://neondb_owner:npg_vxah23FfkesH@ep-dark-voice-adc9yj70-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está configurada');
  process.exit(1);
}

console.log(`\n🔗 Conectando a: ${DATABASE_URL.includes('neon.tech') ? 'Neon (Producción)' : 'Local'}`);

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: DATABASE_URL.includes('neon.tech') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: false,
});

async function createPlatformAdmin() {
  try {
    // Datos del Platform Admin
    const username = process.env.PLATFORM_ADMIN_USERNAME || 'platform_admin';
    const password = process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeMe123!';
    const email = process.env.PLATFORM_ADMIN_EMAIL || 'admin@innoinmo.com';
    const fullName = process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator';

    console.log('\n🔐 Creando usuario PLATFORM_ADMIN...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);

    // Verificar si ya existe
    const [existing] = await sequelize.query(
      'SELECT "adminId", "username", "email" FROM "Admins" WHERE "username" = :username OR "email" = :email',
      {
        replacements: { username, email },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existing) {
      console.log('\n⚠️  Ya existe un usuario con ese username o email:');
      console.log(existing);
      console.log('\n¿Deseas actualizar el rol a PLATFORM_ADMIN? (Ctrl+C para cancelar)');
      
      // Actualizar rol
      await sequelize.query(
        'UPDATE "Admins" SET "role" = :role, "tenantId" = NULL WHERE "adminId" = :adminId',
        {
          replacements: { role: 'PLATFORM_ADMIN', adminId: existing.adminId },
        }
      );
      
      console.log('✅ Usuario actualizado a PLATFORM_ADMIN');
      return existing;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await sequelize.query(
      `INSERT INTO "Admins" ("tenantId", "username", "password", "fullName", "email", "role", "createdAt", "updatedAt")
       VALUES (NULL, :username, :password, :fullName, :email, :role, NOW(), NOW())
       RETURNING "adminId", "username", "email", "role", "tenantId"`,
      {
        replacements: {
          username,
          password: hashedPassword,
          fullName,
          email,
          role: 'PLATFORM_ADMIN',
        },
        type: Sequelize.QueryTypes.INSERT
      }
    );

    console.log('\n✅ Usuario PLATFORM_ADMIN creado exitosamente:');
    console.log(result);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('1. Cambia la contraseña después del primer login');
    console.log(`2. Agrega este email al .env: PLATFORM_ADMIN_EMAILS=${email}`);
    console.log('3. No compartas estas credenciales');
    console.log(`\n🔑 Credenciales temporales:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('\n❌ Error creando Platform Admin:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
createPlatformAdmin()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
