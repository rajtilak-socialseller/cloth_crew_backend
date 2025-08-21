
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Privacy_policy = sequelize.define("Privacy_policy", {
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    year: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descrpition: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  });

  return Privacy_policy;
};
