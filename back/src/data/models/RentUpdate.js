const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "RentUpdate",
    {
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      oldRentAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      newRentAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      period: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pdfPath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      paranoid: true,
    }
  );
};