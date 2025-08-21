const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Store_plan_metric = sequelize.define("Store_plan_metric", {
    subscribers_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    revenue_generated: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });

  return Store_plan_metric;
};
