const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('ClientProperty', {
        role: {
            type: DataTypes.ENUM('propietario', 'inquilino', 'vendedor', 'comprador'),
            allowNull: false,
        },
        clientId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Clients', // Nombre de la tabla real (plural)
                key: 'idClient', // La clave primaria de la tabla relacionada
            },
            allowNull: false,
        },
        propertyId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Property', // Nombre de la tabla real (singular porque freezeTableName: true)
                key: 'propertyId', // La clave primaria de la tabla relacionada
            },
            allowNull: false,
        },
    });
};
