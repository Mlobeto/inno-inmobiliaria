const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'adminId'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expiresAt'
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'password_reset_tokens',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false // No necesitamos updatedAt para tokens
  });

  PasswordResetToken.associate = (models) => {
    PasswordResetToken.belongsTo(models.Admin, {
      foreignKey: 'adminId',
      as: 'admin'
    });
  };

  return PasswordResetToken;
};
