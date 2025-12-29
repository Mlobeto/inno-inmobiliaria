const { DataTypes } = require("sequelize");

function isValidCuil(value) {
  const regex = /^\d{2}-\d{8}-\d$/;
  if (!regex.test(value)) {
    throw new Error('El CUIL debe tener el formato xx-xxxxxxxx-x');
  }

  const [prefix, dni, verifier] = value.split('-');
  const cuilBase = `${prefix}${dni}`;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = cuilBase.split('').map(Number);

  const checksum = digits.reduce((acc, digit, index) => acc + digit * weights[index], 0);
  const mod11 = 11 - (checksum % 11);

  const expectedVerifier = mod11 === 11 ? 0 : mod11 === 10 ? 9 : mod11;
  if (Number(verifier) !== expectedVerifier) {
    throw new Error('El CUIL tiene un dígito verificador inválido');
  }
}

module.exports = (sequelize) => {
  sequelize.define("Garantor", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cuil: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidCuil,
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobilePhone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^\d{10}$/,
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
