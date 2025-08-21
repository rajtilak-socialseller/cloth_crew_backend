
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Promotional_message = sequelize.define("Promotional_message", {
    title: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  });

  return Promotional_message;
};
