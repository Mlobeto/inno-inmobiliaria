const bcrypt = require('bcrypt');
const { conn } = require('./src/data');
const { Admin } = require('./src/data').conn.models;

async function updatePlatformAdminPassword() {
  try {
    await conn.authenticate();
    console.log('✅ Conexión establecida');

    const username = 'platform_admin';
    const newPassword = 'ChangeMe123!';

    // Buscar el admin ANTES de actualizar
    let admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      console.error('❌ Usuario no encontrado:', username);
      process.exit(1);
    }

    console.log('👤 Usuario encontrado:');
    console.log('   ID:', admin.adminId);
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Password actual (primeros 30 chars):', admin.password.substring(0, 30));

    // Probar la contraseña ACTUAL
    console.log('\n🔍 Probando contraseña actual...');
    const currentValid = await bcrypt.compare(newPassword, admin.password);
    console.log('   Resultado:', currentValid ? '✅ YA ES CORRECTA' : '❌ NECESITA ACTUALIZACIÓN');

    if (!currentValid) {
      // Generar el hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log('\n🔐 Generando nuevo hash...');
      console.log('   Hash:', hashedPassword);

      // Actualizar usando query directa
      await conn.query(
        'UPDATE "Admins" SET password = :password WHERE username = :username',
        {
          replacements: { password: hashedPassword, username },
          type: conn.QueryTypes.UPDATE
        }
      );

      console.log('✅ Contraseña actualizada con query directa');

      // Verificar de nuevo
      admin = await Admin.findOne({ where: { username } });
      const newValid = await bcrypt.compare(newPassword, admin.password);
      console.log('🔍 Verificación final:', newValid ? '✅ CORRECTO' : '❌ ERROR');
    }

    console.log('\n📋 Credenciales finales:');
    console.log('   Username:', username);
    console.log('   Password:', newPassword);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updatePlatformAdminPassword();
