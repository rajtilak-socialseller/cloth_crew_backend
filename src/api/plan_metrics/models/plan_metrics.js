const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Plan_metrics = sequelize.define("Plan_metrics", {
    subscribers_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    revenue_generated: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });

  return Plan_metrics;
};
