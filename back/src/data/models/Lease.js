const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "Lease",
    {
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
          model: "tenants",
          key: "tenantId",
        },
      },
      propertyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Property",
          key: "propertyId",
        },
      },
      landlordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Clients",
          key: "idClient",
        },
      },
      renterId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Clients",
          key: "idClient",
        },
      },
      agentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "admins",
          key: "adminId",
        },
        comment: 'Agente que cerró el contrato'
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      rentAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0,
        }
      },
      updateFrequency: {
        type: DataTypes.ENUM("semestral", "cuatrimestral", "anual"),
        allowNull: true,
        validate: {
          isIn: [["semestral", "cuatrimestral", "anual"]],
        },
      },
      commission: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      totalMonths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      inventory: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "terminated"),
        allowNull: false,
        defaultValue: "active",
      },
      pdfPath: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      customContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Contenido HTML personalizado del contrato editado manualmente'
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
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ['tenantId'] },
        { fields: ['propertyId'] },
        { fields: ['landlordId'] },
        { fields: ['renterId'] },
        { fields: ['agentId'] },
        { fields: ['status'] },
      ]
    }
  );
};
