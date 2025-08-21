// models/mainDbModels/User.js
const { Sequelize, DataTypes } = require("sequelize");
const store_types = require("../../../constants/store_types");

module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      require: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      require: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    database: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    host: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    db_username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subdomain: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    razorpay_account_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    store_type: {
      type: DataTypes.ENUM(...store_types),
    },
    phone: {
      type: DataTypes.STRING,
    },
    country_code: {
      type: DataTypes.STRING,
      defaultValue: "+91"
    },
    customDomain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  return User;
};
