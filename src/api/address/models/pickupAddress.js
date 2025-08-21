const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PickupAddress = sequelize.define("PickupAddress", {
    store_name: {
      type: DataTypes.STRING
    },
    PickupAddressLine1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "+91",
    },
    phone: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: false,
    },
  });

  return PickupAddress;
};
