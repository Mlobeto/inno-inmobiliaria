const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientDocument = sequelize.define(
    'ClientDocument',
    {
      documentId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'document_id',
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'client_id',
        references: {
          model: 'Clients',
          key: 'idClient',
        },
        onDelete: 'CASCADE',
        comment: 'ID del cliente al que pertenece este documento',
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'tenant_id',
        references: {
          model: 'tenants',
          key: 'tenantId',
        },
        onDelete: 'CASCADE',
        comment: 'ID del tenant (inmobiliaria) para aislamiento multitenancy',
      },
      
      // Tipo y clasificación del documento
      documentType: {
        type: DataTypes.ENUM(
          'IDENTITY',   // Documento de identidad (DNI, RG, Cédula, INE)
          'TAX',        // Documento fiscal (CUIL, CPF, RUT, RFC, NIT)
          'PROPERTY',   // Documentos de propiedad
          'INCOME',     // Comprobantes de ingresos
          'GUARANTEE',  // Documentos de garantía
          'OTHER'       // Otros documentos
        ),
        allowNull: false,
        field: 'document_type',
        comment: 'Tipo de documento según clasificación',
      },
      country: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: 'AR',
        field: 'country',
        validate: {
          isIn: [['AR', 'BR', 'CL', 'CO', 'EC', 'MX', 'PE', 'UY']],
        },
        comment: 'Código ISO 3166-1 alpha-2 del país emisor',
      },
      documentCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'document_code',
        comment: 'Código específico del documento: CUIL, DNI, CPF, RUT, RFC, etc.',
      },
      number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'number',
        comment: 'Número del documento con formato del país',
      },
      
      // Información adicional
      issuedBy: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'issued_by',
        comment: 'Organismo emisor del documento',
      },
      issuedAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'issued_at',
        comment: 'Fecha de emisión del documento',
      },
      expiresAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'expires_at',
        comment: 'Fecha de vencimiento del documento (si aplica)',
      },
      
      // Control y flags
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_primary',
        comment: 'TRUE si es el documento principal del cliente para este tipo',
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
        comment: 'TRUE si el documento fue verificado por la inmobiliaria',
      },
      
      // Metadata flexible (JSONB)
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'metadata',
        comment: 'Datos adicionales específicos por país en formato JSON',
      },
      
      // Auditoría
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
        comment: 'Soft delete - fecha de eliminación lógica',
      },
    },
    {
      tableName: 'client_documents',
      timestamps: true,
      paranoid: true, // Habilita soft delete
      underscored: true,
      indexes: [
        {
          name: 'idx_client_documents_client',
          fields: ['client_id'],
        },
        {
          name: 'idx_client_documents_tenant',
          fields: ['tenant_id'],
        },
        {
          name: 'idx_client_documents_primary',
          fields: ['client_id', 'is_primary'],
          where: {
            is_primary: true,
          },
        },
        {
          name: 'idx_client_documents_type',
          fields: ['document_type'],
        },
        {
          name: 'idx_client_documents_country',
          fields: ['country'],
        },
      ],
      scopes: {
        // Scope para filtrar por tenant (multitenancy)
        byTenant(tenantId) {
          return {
            where: { tenantId },
          };
        },
        // Scope para documentos primarios
        primary() {
          return {
            where: { isPrimary: true },
          };
        },
        // Scope para documentos verificados
        verified() {
          return {
            where: { isVerified: true },
          };
        },
        // Scope por tipo de documento
        byType(documentType) {
          return {
            where: { documentType },
          };
        },
        // Scope por país
        byCountry(country) {
          return {
            where: { country },
          };
        },
      },
    }
  );

  // Métodos de instancia
  ClientDocument.prototype.verify = function() {
    this.isVerified = true;
    return this.save();
  };

  ClientDocument.prototype.unverify = function() {
    this.isVerified = false;
    return this.save();
  };

  ClientDocument.prototype.setPrimary = async function() {
    // Desmarcar otros documentos del mismo tipo como primarios
    await ClientDocument.update(
      { isPrimary: false },
      {
        where: {
          clientId: this.clientId,
          documentType: this.documentType,
          documentId: { [sequelize.Sequelize.Op.ne]: this.documentId },
        },
      }
    );
    
    this.isPrimary = true;
    return this.save();
  };

  // Métodos de clase (estáticos)
  ClientDocument.getPrimaryDocument = function(clientId, documentType) {
    return this.findOne({
      where: {
        clientId,
        documentType,
        isPrimary: true,
      },
    });
  };

  ClientDocument.getByCode = function(clientId, documentCode) {
    return this.findAll({
      where: {
        clientId,
        documentCode,
      },
      order: [['isPrimary', 'DESC'], ['createdAt', 'DESC']],
    });
  };

  ClientDocument.getAllForClient = function(clientId, tenantId) {
    return this.findAll({
      where: {
        clientId,
        tenantId,
      },
      order: [
        ['documentType', 'ASC'],
        ['isPrimary', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  };

  // Hook antes de crear para validar formato según país
  ClientDocument.beforeCreate(async (document, options) => {
    // Importar configuraciones de país
    const { validateDocument } = require('../../../../shared/src/constants/countryConfigs');
    
    // Validar formato del documento
    const isValid = validateDocument(
      document.number,
      document.documentCode,
      document.country
    );
    
    if (!isValid) {
      throw new Error(
        `Formato inválido para ${document.documentCode} de ${document.country}: ${document.number}`
      );
    }
    
    // Si es el primer documento de este tipo, marcarlo como primario
    const existingDocs = await ClientDocument.count({
      where: {
        clientId: document.clientId,
        documentType: document.documentType,
      },
    });
    
    if (existingDocs === 0) {
      document.isPrimary = true;
    }
  });

  return ClientDocument;
};
