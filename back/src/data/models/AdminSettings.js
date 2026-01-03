const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminSettings = sequelize.define('AdminSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    
    // 🆕 Datos de la inmobiliaria (antes hardcoded)
    company_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nombre de la inmobiliaria',
    },
    company_address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Dirección de la inmobiliaria',
    },
    company_phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Teléfono de contacto',
    },
    company_email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email de contacto',
    },
    company_registration: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Matrícula o número de registro',
    },
    company_cuit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'CUIT de la inmobiliaria',
    },
    company_logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL del logo en Cloudinary',
    },
    
    // Configuración de contratos
    contract_footer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Texto adicional para pie de contratos',
    },
    
    // 🆕 Multi-tenancy
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tenants',
        key: 'tenantId',
      },
      comment: 'ID del tenant (null = configuración global)',
    },
    
    // Configuración adicional (JSON flexible)
    additional_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Configuraciones adicionales en JSON',
    },
    
    // Timestamps (camelCase en la BD, no snake_case)
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'createdAt', // Explícitamente usar camelCase
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updatedAt', // Explícitamente usar camelCase
    },
    
  }, {
    scopes: {
      byTenant: (tenantId) => ({
        where: { tenantId }
      }),
    },
    indexes: [
      { fields: ['tenantId'] },
    ],
    tableName: 'admin_settings',
    underscored: true, // Usar snake_case para columnas
    timestamps: true, // La tabla tiene createdAt y updatedAt
  });

  return AdminSettings;
};
