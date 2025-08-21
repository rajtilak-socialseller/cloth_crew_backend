// cart.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Cart = sequelize.define("Cart", {
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return Cart;
};
