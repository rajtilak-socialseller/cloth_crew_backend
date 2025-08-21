const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Ship_rocket_return = sequelize.define("Ship_rocket_return", {
    length: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    breadth: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    height: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    weight: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  });

  return Ship_rocket_return;
};
