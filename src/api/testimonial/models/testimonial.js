
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Testimonial = sequelize.define("Testimonial", {
    name: {
      type: DataTypes.STRING
    },
    content: {
      type: DataTypes.TEXT,
    },
    rating: {
      type: DataTypes.DECIMAL,
    },
  });

  return Testimonial;
};
