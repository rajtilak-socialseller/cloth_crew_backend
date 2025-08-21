const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Ship_rocket_orderitem = sequelize.define("Ship_rocket_orderitem", {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sku: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    units: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    selling_price: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    discount: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tax: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hsn: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  return Ship_rocket_orderitem;
};
