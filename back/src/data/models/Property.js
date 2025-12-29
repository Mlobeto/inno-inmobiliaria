const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "Property",
    {
      propertyId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,  
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      neighborhood: {
        type: DataTypes.STRING,
      },
      socio:{
      type: DataTypes.STRING,
      allowNull: true,
    },
      
      city: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.ENUM("venta", "alquiler"),
        allowNull: false,
      },
      typeProperty: {
        type: DataTypes.ENUM(
          "casa",
          "departamento",
          "duplex",
          "finca",
          "local",
          "oficina",
          "lote",
          "terreno"
        ),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          min: 0, // Precio no puede ser negativo
        },
      },
      precioReferencia: {
        type: DataTypes.DECIMAL,
        allowNull: true, // No es requerido
        validate: {
          min: 0, // Precio de referencia no puede ser negativo
        },
      },
      rooms: {
        type: DataTypes.INTEGER,
        validate: {
          min: 0, // Número mínimo de habitaciones
        },
      },

      comision: {
        type: DataTypes.DECIMAL,
        allowNull: false,
        validate: {
          min: 0, // No puede ser menor al 0%
          max: 100, // No puede ser mayor al 100%
        },
      },

      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Por defecto, la propiedad está disponible
      },

      description: {
        type: DataTypes.TEXT,
      },
      escritura: {
        type: DataTypes.ENUM(
          "prescripcion en tramite",
          "escritura",
          "prescripcion adjudicada",
          "posesion",
          "sesión de derechos posesorios"
        ),
        allowNull: false,
      },

      matriculaOPadron: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          notEmpty: true,
        },
      },

      // Campos específicos para lotes
      frente: {
        type: DataTypes.STRING,
        allowNull: true, // Solo aplicable para lotes
      },
      
      profundidad: {
        type: DataTypes.STRING,
        allowNull: true, // Solo aplicable para lotes
      },

      // Link de Instagram para todas las propiedades
      linkInstagram: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Debe ser una URL válida"
          }
        },
      },

      // Link de Google Maps para todas las propiedades
      linkMaps: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: {
            msg: "Debe ser una URL válida de Google Maps"
          }
        },
      },

      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: true,
      },
      plantType: {
        type: DataTypes.STRING,
        allowNull: true, // Solo aplicable para fincas
      },
      plantQuantity: {
        type: DataTypes.INTEGER,
        allowNull: true, // Solo aplicable para fincas
        validate: {
          min: 0, // No puede ser negativo
        },
      },
      bathrooms: {
        type: DataTypes.INTEGER,
      },
      highlights: {
        type: DataTypes.TEXT,
      },
      inventory:{
        type: DataTypes.TEXT,
        allowNull: true,
      },
      superficieCubierta:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      
      superficieTotal:{
        type: DataTypes.STRING,
        allowNull: true,
      },
      
      whatsappTemplate: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: `Gracias por ponerte en contacto con Quintero Lobeto Propiedades! Estamos encantados de poder ayudar. 

{descripcion}

Te comento que estamos en lanzamiento de ofertas y este es el primero!

Precio: AR$ {precio}
Ubicación: {direccion}

Estamos a tu entera disposición por dudas, precio o consultas.`,
      },
      
      
    },
    {
      freezeTableName: true,
      paranoid: true,
    }
  );
};
