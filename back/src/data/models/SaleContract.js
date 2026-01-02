const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('SaleContract', {

    id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenantId',
      },
    },
    agentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'adminId',
      },
      comment: 'Agente que cerró la venta'
    },
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    salePrice: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    commission: {
      type: DataTypes.DECIMAL,
    },
    propertyId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Property',
        key: 'propertyId',
      },
      allowNull: false,
    },
    sellerId: {
      // Vendedor de la propiedad
      type: DataTypes.INTEGER,
      references: {
        model: 'Clients',
        key:'idClient',
      },
      allowNull: false,
    },
    buyerId: {
      // Comprador
      type: DataTypes.INTEGER,
      references: {
        model: 'Clients',
        key:'idClient',
      },
      allowNull: false,
    },
  }, {
    scopes: {
      byTenant: (tenantId) => ({
        where: { tenantId }
      }),
    },
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['agentId'] },
    ]
  });
};
