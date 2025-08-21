
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Tag = sequelize.define("Tag", {
    name: {
      type: DataTypes.STRING,
    },
  });

  return Tag;
};
