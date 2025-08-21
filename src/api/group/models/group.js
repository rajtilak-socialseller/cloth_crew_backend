const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Group = sequelize.define("Group", {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  return Group;
};
