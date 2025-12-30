const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('Tenant', {
    tenantId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      }
    },
    cuit: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true,
      validate: {
        is: /^\d{2}-\d{8}-\d$/,
      }
    },
    subdomain: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isLowercase: true,
        is: /^[a-z0-9-]+$/,
        notEmpty: true,
      }
    },
    email: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: true,
      }
    },
    phone: {
      type: DataTypes.STRING(50),
    },
    address: {
      type: DataTypes.TEXT,
    },
    logo: {
      type: DataTypes.STRING(500),
    },
    signatureUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL de la firma digital del tenant almacenada en Cloudinary',
    },
    plan: {
      type: DataTypes.STRING(50),
      defaultValue: 'FREE',
      validate: {
        isIn: [['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']],
      }
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'TRIAL',
      validate: {
        isIn: [['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']],
      }
    },
    maxAgents: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1,
      }
    },
    maxProperties: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      validate: {
        min: 1,
      }
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        whatsapp: false,
        ml: false,
        reports: true,
        contracts: true,
      }
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
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
    tableName: 'tenants',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['subdomain'] },
      { fields: ['status'] },
      { fields: ['cuit'] },
    ]
  });
};
