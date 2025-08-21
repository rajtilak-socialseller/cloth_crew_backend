const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Collection_static = sequelize.define("Collection_static", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Collection_static;
};
