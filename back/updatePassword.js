const { Sequelize } = require('sequelize');

const db = new Sequelize('InnoInmobiliaria_Dev', 'postgres', '7754', {
  host: 'localhost',
  dialect: 'postgres'
});

const hashedPassword = '$2b$10$sHoY7y2/1tSe5Ac0wIeF3.mmN./a.P.HOpj/0oxickhuMWgERoivi';

db.query('UPDATE admins SET password = ? WHERE username = ?', {
  replacements: [hashedPassword, 'admin'],
  type: Sequelize.QueryTypes.UPDATE
})
  .then(() => {
    console.log('✅ Password actualizado correctamente');
    return db.query('SELECT username, password FROM admins WHERE username = ?', {
      replacements: ['admin'],
      type: Sequelize.QueryTypes.SELECT
    });
  })
  .then((results) => {
    console.log('Usuario actualizado:', results[0]);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
