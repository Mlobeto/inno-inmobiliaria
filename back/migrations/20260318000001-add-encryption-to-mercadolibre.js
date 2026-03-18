'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('📦 Agregando campos de encriptación a MercadoLibreConfig...');
      
      // Agregar campos para encriptar accessToken
      await queryInterface.addColumn(
        'MercadoLibreConfig',
        'accessTokenIv',
        {
          type: Sequelize.STRING(32),
          allowNull: true,
          comment: 'IV para encriptación del accessToken',
        },
        { transaction }
      );
      
      await queryInterface.addColumn(
        'MercadoLibreConfig',
        'accessTokenAuthTag',
        {
          type: Sequelize.STRING(32),
          allowNull: true,
          comment: 'AuthTag para encriptación del accessToken',
        },
        { transaction }
      );
      
      await queryInterface.addColumn(
        'MercadoLibreConfig',
        'accessTokenSalt',
        {
          type: Sequelize.STRING(128),
          allowNull: true,
          comment: 'Salt para encriptación del accessToken',
        },
        { transaction }
      );
      
      // Agregar campos para encriptar refreshToken
      await queryInterface.addColumn(
        'MercadoLibreConfig',
        'refreshTokenIv',
        {
          type: Sequelize.STRING(32),
          allowNull: true,
          comment: 'IV para encriptación del refreshToken',
        },
        { transaction }
      );
      
      await queryInterface.addColumn(
        'MercadoLibreConfig',
        'refreshTokenAuthTag',
        {
          type: Sequelize.STRING(32),
          allowNull: true,
          comment: 'AuthTag para encriptación del refreshToken',
        },
        { transaction }
      );
      
      await queryInterface.addColumn(
        'MercadoLibreConfig',
        'refreshTokenSalt',
        {
          type: Sequelize.STRING(128),
          allowNull: true,
          comment: 'Salt para encriptación del refreshToken',
        },
        { transaction }
      );
      
      console.log('✅ Campos de encriptación agregados exitosamente');
      console.log('⚠️  IMPORTANTE: Los tokens existentes seguirán en texto plano hasta que se renueven');
      console.log('🔐 Asegúrate de tener ENCRYPTION_KEY definida en .env');
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('📦 Revirtiendo campos de encriptación...');
      
      await queryInterface.removeColumn('MercadoLibreConfig', 'accessTokenIv', { transaction });
      await queryInterface.removeColumn('MercadoLibreConfig', 'accessTokenAuthTag', { transaction });
      await queryInterface.removeColumn('MercadoLibreConfig', 'accessTokenSalt', { transaction });
      await queryInterface.removeColumn('MercadoLibreConfig', 'refreshTokenIv', { transaction });
      await queryInterface.removeColumn('MercadoLibreConfig', 'refreshTokenAuthTag', { transaction });
      await queryInterface.removeColumn('MercadoLibreConfig', 'refreshTokenSalt', { transaction });
      
      console.log('✅ Campos de encriptación revertidos');
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error revirtiendo migración:', error);
      throw error;
    }
  }
};
