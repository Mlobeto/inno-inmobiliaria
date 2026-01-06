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
    company_city: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Ciudad de la inmobiliaria',
    },
    company_province: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Provincia de la inmobiliaria',
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
    company_ingresos_brutos: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Número de Ingresos Brutos',
    },
    company_condicion_iva: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'RESPONSABLE MONOTRIBUTO',
      comment: 'Condición ante IVA (ej: RESPONSABLE MONOTRIBUTO, RESPONSABLE INSCRIPTO)',
    },
    company_inicio_actividad: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Fecha de inicio de actividades (formato: DD-MM-YYYY)',
    },
    professional_title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Título profesional (ej: ARQUITECTA, MARTILLERO PÚBLICO)',
    },
    company_logo_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL del logo en Cloudinary',
    },
    receipt_prefix: {
      type: DataTypes.STRING(1),
      allowNull: true,
      defaultValue: 'X',
      comment: 'Prefijo del recibo: A, B, C o X',
    },
    receipt_footer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Texto adicional para pie de recibos',
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
