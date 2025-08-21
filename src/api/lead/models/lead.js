const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Lead = sequelize.define("Lead", {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "OPEN",
        "UNDER_CONNECTION",
        "FOLLOWUP",
        "ON_HOLD",
        "CANCELLED",
        "COMPLETED",
        "COMFIRMED",
      ),
    },
    source: {
      type: DataTypes.ENUM(
        "WHATSAPP",
        "INSTAGRAM",
        "SOCIAL_SELLER_WEBSITE",
        "YOUTUBE_CHANNEL",
        "APP",
        "WEBSITE"
      ),
    },
    type: {
      type: DataTypes.ENUM(
        "HOT_LEAD",
        "WARM_LEAD",
        "COLD_LEAD",
        "NOT_CONNECTED",
      ),
    },
    consumer_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    staff_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return Lead;
};
