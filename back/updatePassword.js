const prisma = require('./src/utils/prismaClient');

const hashedPassword = '$2b$10$sHoY7y2/1tSe5Ac0wIeF3.mmN./a.P.HOpj/0oxickhuMWgERoivi';

async function run() {
  try {
    await prisma.admins.updateMany({
      where: { username: 'admin' },
      data: { password: hashedPassword },
    });

    const user = await prisma.admins.findFirst({
      where: { username: 'admin' },
      select: { username: true, password: true },
    });

    console.log('✅ Password actualizado correctamente');
    console.log('Usuario actualizado:', user);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
