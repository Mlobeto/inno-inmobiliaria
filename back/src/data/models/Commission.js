const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('Commission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenantId',
      }
    },
    agentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'admins',
        key: 'adminId',
      }
    },
    transactionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['LEASE', 'SALE']],
      }
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID del Lease o SaleContract'
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Property',
        key: 'propertyId',
      }
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'idClient',
      }
    },
    transactionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      }
    },
    inmobiliariaCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      }
    },
    inmobiliariaCommissionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      }
    },
    agentCommissionPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      }
    },
    agentCommissionAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      }
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'APPROVED', 'PAID']],
      }
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'adminId',
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['agentId'] },
      { fields: ['status'] },
      { fields: ['transactionType'] },
      { fields: ['transactionType', 'transactionId'] },
    ]
  });
};
