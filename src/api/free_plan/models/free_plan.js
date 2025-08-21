// models/Free_plan.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Free_plan = sequelize.define("Free_plan", {
    name: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
    maxUsers: {
      type: DataTypes.INTEGER,
    },
    maxProducts: {
      type: DataTypes.INTEGER,
    },
    premiumPricing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    codAllowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    prepaidAllowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
  return Free_plan;
};
