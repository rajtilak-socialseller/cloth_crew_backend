
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Marquee = sequelize.define("Marquee", {
    name: {
      type: DataTypes.STRING,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  });

  return Marquee;
};
