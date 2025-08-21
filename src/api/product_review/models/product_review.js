
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Product_review = sequelize.define("Product_review", {
    name: {
      type: DataTypes.STRING,
    },
    title: {
      type: DataTypes.STRING,
    },
    rating: {
      type: DataTypes.DECIMAL,
    },
    review: {
      type: DataTypes.TEXT,
    },
  });

  return Product_review;
};
