const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Tutorial = sequelize.define("Tutorial", {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return Tutorial;
};
