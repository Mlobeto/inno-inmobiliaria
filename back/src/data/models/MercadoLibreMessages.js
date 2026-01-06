const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('MercadoLibreMessages', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'tenantId',
      },
    },
    propertyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Property',
        key: 'propertyId',
      },
    },
    mlListingId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de la publicación relacionada',
    },
    mlMessageId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'ID único del mensaje en ML',
    },
    mlQuestionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de la pregunta en ML',
    },
    mlUserId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID del usuario que pregunta',
    },
    userNickname: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nickname del usuario',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Texto de la pregunta/mensaje',
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Respuesta enviada',
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'UNANSWERED',
      comment: 'Estado: UNANSWERED, ANSWERED, DELETED',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si fue leído',
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de recepción',
    },
    answeredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de respuesta',
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
    tableName: 'MercadoLibreMessages',
    timestamps: true,
    indexes: [
      { fields: ['tenantId'] },
      { fields: ['propertyId'] },
      { fields: ['status'] },
      { fields: ['isRead'] },
      { fields: ['receivedAt'] },
    ],
  });
};
