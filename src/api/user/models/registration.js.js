// models/mainDbModels/User.js
const { Sequelize, DataTypes } = require("sequelize");
const store_types = require("../../../constants/store_types");

module.exports = (sequelize) => {
    const Registration = sequelize.define("Registration", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
        },
        subdomain: {
            type: DataTypes.STRING,
        },
        is_complete: {
            type: DataTypes.BOOLEAN
        },
        phone: {
            type: DataTypes.STRING,
        }
    });

    return Registration;
};
