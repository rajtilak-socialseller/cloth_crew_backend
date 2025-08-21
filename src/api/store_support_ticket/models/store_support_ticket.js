
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Store_support_ticket = sequelize.define("Store_support_ticket", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(["OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"]),
      allowNull: false,
    },
  });

  return Store_support_ticket;
};
