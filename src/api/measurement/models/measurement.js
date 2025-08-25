const { Sequelize, DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Measurement = sequelize.define(
    "Measurement",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      gender: {
        type: DataTypes.ENUM("Male", "Female"),
        allowNull: false,
      },
      armpit: { type: DataTypes.INTEGER }, // Armhole/armpit
      chest: { type: DataTypes.INTEGER },
      sleeveLength: { type: DataTypes.INTEGER },
      hips: { type: DataTypes.INTEGER },
      thigh: { type: DataTypes.INTEGER },
      ankle: { type: DataTypes.INTEGER },
      shoulder: { type: DataTypes.INTEGER },
      biceps: { type: DataTypes.INTEGER },
      waist: { type: DataTypes.INTEGER },
      outsideLeg: { type: DataTypes.INTEGER },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique:true
      },
    },
    {
      tableName: "Measurement",
      timestamps: true,
    }
  );

  return Measurement;
};
