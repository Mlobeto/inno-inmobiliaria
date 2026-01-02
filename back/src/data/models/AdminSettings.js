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
    signatureUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL de la firma del responsable',
    },
    contract_footer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Texto adicional para pie de contratos',
    },
    
    // 🆕 Multi-tenancy
    tenantId: {
      type: DataTypes.INTEGER,
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
    timestamps: true,
  });

  return AdminSettings;
};
