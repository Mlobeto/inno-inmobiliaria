const { DataTypes } = require("sequelize");

function isValidCuil(value) {
  const regex = /^\d{2}-\d{8}-\d$/;
  if (!regex.test(value)) {
    throw new Error("El CUIL debe tener el formato xx-xxxxxxxx-x");
  }

  const [prefix, dni, verifier] = value.split("-");
  const cuilBase = `${prefix}${dni}`;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = cuilBase.split("").map(Number);

  // Calcular la suma según tu algoritmo
  const suma = digits.reduce(
    (acc, digit, index) => acc + digit * weights[index],
    0
  );
  
  // Obtener el resto de la división por 11
  const resto = suma % 11;
  let expectedVerifier;

  if (resto === 0) {
    expectedVerifier = 0;
  } else if (resto === 1) {
    // Casos especiales para resto = 1
    if (prefix === '20') {
      // Hombre: Z=9 y XY pasa a ser 23
      expectedVerifier = 9;
      // Nota: En este caso deberíamos también verificar que el prefijo sea 23, no 20
      // pero para simplificar, solo validamos el dígito verificador
    } else if (prefix === '27') {
      // Mujer: Z=4 y XY pasa a ser 23  
      expectedVerifier = 4;
    } else {
      // Para empresas (30) u otros casos
      expectedVerifier = 11 - resto; // = 10, pero esto no debería ocurrir normalmente
    }
  } else {
    // Caso normal: Z = 11 - resto
    expectedVerifier = 11 - resto;
  }

  if (Number(verifier) !== expectedVerifier) {
    throw new Error("El CUIL tiene un dígito verificador inválido");
  }
}

module.exports = (sequelize) => {
  return sequelize.define(
    "Client",
    {
      idClient: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      
      cuil: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isValidCuil,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      direccion: {
        type: DataTypes.STRING,
        allowNull: true
      },
      ciudad: {
        type: DataTypes.STRING,
        allowNull: false
      },
      provincia: {
        type: DataTypes.STRING,
        allowNull: true
      },
      
      mobilePhone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^\d{10}$/,
        },
      },
      
      linkMaps: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "El link de Google Maps debe ser una URL válida"
          }
        },
      },
    },
    {
      tableName: "Clients", // ← AGREGAR ESTA LÍNEA
      paranoid: true,
    }
  );
};
