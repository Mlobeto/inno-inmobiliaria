const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('PropertyMLListings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Property',
        key: 'propertyId',
      },
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenantId',
      },
    },
    mlListingId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'ID de la publicación en MercadoLibre',
    },
    mlStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Estado: active, paused, closed, under_review',
    },
    mlPermalink: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL de la publicación en ML',
    },
    mlTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Título de la publicación en ML',
    },
    mlPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Precio publicado en ML',
    },
    viewsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Cantidad de visitas en ML',
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última sincronización',
    },
    syncErrors: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Errores de sincronización',
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
    tableName: 'PropertyMLListings',
    timestamps: true,
    indexes: [
      { fields: ['propertyId'] },
      { fields: ['tenantId'] },
      { fields: ['mlStatus'] },
      { fields: ['mlListingId'] },
      {
        unique: true,
        fields: ['propertyId', 'tenantId'],
      },
    ],
  });
};
