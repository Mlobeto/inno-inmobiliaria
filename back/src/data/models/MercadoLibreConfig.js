const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('MercadoLibreConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'tenants',
        key: 'tenantId',
      },
    },
    mlUserId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID del usuario en MercadoLibre',
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Token de acceso OAuth',
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Token de refresh OAuth',
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de expiración del access token',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si la integración está activa',
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última sincronización con ML',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'MercadoLibreConfig',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['isActive'] },
    ],
  });
};
