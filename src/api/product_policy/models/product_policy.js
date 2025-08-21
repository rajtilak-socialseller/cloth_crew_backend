
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product_policy = sequelize.define("Product_policy", {
    title: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
  });

  return Product_policy;
};
