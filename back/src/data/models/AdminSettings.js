const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminSettings = sequelize.define('AdminSettings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    signatureUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'admin_settings',
    timestamps: true,
  });

  return AdminSettings;
};
