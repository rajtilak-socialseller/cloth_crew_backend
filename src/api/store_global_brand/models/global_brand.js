const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Global_brand = sequelize.define(
    "Global_brand",
    {
      name: {
        type: DataTypes.STRING,
      },
      tagline: {
        type: DataTypes.STRING,
      },
      whatsapp_number: {
        type: DataTypes.STRING,
      },
      calling_number: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      about_us: {
        type: DataTypes.TEXT,
      },
      address: {
        type: DataTypes.STRING,
      },
      instagram: {
        type: DataTypes.STRING,
        allowNull: true
      },
      facebook: {
        type: DataTypes.STRING,
        allowNull: true
      },
      telegram: {
        type: DataTypes.STRING,
        allowNull: true
      },
      youtube: {
        type: DataTypes.STRING,
        allowNull: true
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["id"],
        },
      ],
    }
  );
  return Global_brand;
};
