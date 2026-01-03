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
        allowNull: true, // NULL para PLATFORM_ADMIN, required para otros roles
        references: {
          model: 'tenants',
          key: 'tenantId',
        },
        validate: {
          // Validar que solo PLATFORM_ADMIN puede tener tenantId null
          validateTenantId(value) {
            if (value === null && this.role !== 'PLATFORM_ADMIN') {
              throw new Error('Solo PLATFORM_ADMIN puede tener tenantId null');
            }
            if (value !== null && this.role === 'PLATFORM_ADMIN') {
              throw new Error('PLATFORM_ADMIN debe tener tenantId null');
            }
          },
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
          isIn: [['PLATFORM_ADMIN', 'SUPER_ADMIN', 'AGENT']],
        },
        comment: 'PLATFORM_ADMIN: dueño de InnoInmo, SUPER_ADMIN: dueño de inmobiliaria, AGENT: empleado',
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
      tableName: 'admins',
      paranoid: true,
      scopes: {
        byTenant: (tenantId) => ({
          where: { tenantId }
        }),
      },
      indexes: [
        { fields: ['tenantId'] },
        { fields: ['role'] },
      ]
    }
  );
};
