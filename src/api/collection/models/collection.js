const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Collection = sequelize.define("Collection", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  return Collection;
};
