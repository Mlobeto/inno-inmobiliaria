const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "Admin",
    {
      adminId: {
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
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        }
      },
      role: {
        type: DataTypes.STRING(50),
        defaultValue: "AGENT",
        validate: {
          isIn: [['SUPER_ADMIN', 'AGENT']],
        }
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      paranoid: true,
      indexes: [
        { fields: ['tenantId'] },
        { fields: ['role'] },
      ]
    }
  );
};
