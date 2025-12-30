const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PdfTemplate = sequelize.define(
    "PdfTemplate",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "tenants",
          key: "tenantId",
        },
        comment: "Inmobiliaria a la que pertenece el template",
      },
      templateType: {
        type: DataTypes.ENUM(
          "CONTRATO_ALQUILER",
          "AUTORIZACION_VENTA",
          "RECIBO_PAGO",
          "FICHA_PROPIEDAD",
          "ACTUALIZACION_RENTA"
        ),
        allowNull: false,
        comment: "Tipo de documento PDF",
      },
      templateName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Nombre descriptivo del template (ej: 'Contrato Estándar', 'Recibo Oficial')",
      },
      htmlTemplate: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "Template HTML con variables Handlebars {{variable}}",
      },
      styles: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "CSS personalizado para el template",
      },
      headerHtml: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "HTML para el encabezado (logo, datos de inmobiliaria)",
      },
      footerHtml: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "HTML para el pie de página",
      },
      variables: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Descripción de variables disponibles y valores por defecto",
      },
      pageSize: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "A4",
        comment: "Tamaño de página: A4, Letter, Legal",
      },
      orientation: {
        type: DataTypes.ENUM("portrait", "landscape"),
        allowNull: false,
        defaultValue: "portrait",
        comment: "Orientación del PDF",
      },
      margins: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
        comment: "Márgenes del PDF",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Si está activo para uso",
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Si es el template por defecto para este tipo",
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "admins",
          key: "adminId",
        },
        comment: "Admin que creó el template",
      },
    },
    {
      tableName: "pdf_templates",
      timestamps: true,
      paranoid: true, // Soft delete
      indexes: [
        {
          fields: ["tenantId", "templateType"],
          name: "idx_pdf_templates_tenant_type",
        },
        {
          fields: ["tenantId", "isDefault"],
          name: "idx_pdf_templates_tenant_default",
        },
        {
          fields: ["isActive"],
          name: "idx_pdf_templates_active",
        },
      ],
    }
  );

  PdfTemplate.associate = (models) => {
    // Pertenece a un tenant
    PdfTemplate.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "Tenant",
    });

    // Creado por un admin
    PdfTemplate.belongsTo(models.Admin, {
      foreignKey: "createdBy",
      as: "Creator",
    });
  };

  return PdfTemplate;
};
