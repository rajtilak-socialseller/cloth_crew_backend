const { Sequelize, DataTypes } = require("sequelize"); // your sequelize connection
// assuming user model exists
module.exports = (sequelize) => {
  const Store = sequelize.define(
    "Store",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      storeName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        validate: { isEmail: true },
      },

      street: {
        type: DataTypes.STRING,
      },

      area: {
        type: DataTypes.STRING,
      },

      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      country: {
        type: DataTypes.STRING,
        defaultValue: "India",
      },

      pincode: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      openTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      closeTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },

      imageUrl: {
        type: DataTypes.STRING, // Store logo / banner
      },
      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      ownStoreId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tablename: "Store",
    }
  );
  return Store;
};
