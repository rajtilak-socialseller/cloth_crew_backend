const {  DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CartVariant = sequelize.define("CartVariant", {
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return CartVariant;
};
