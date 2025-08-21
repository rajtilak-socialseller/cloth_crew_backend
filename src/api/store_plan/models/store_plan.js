const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Store_plan = sequelize.define("Store_plan", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    validity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    premium_pricing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cod_allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    prepaid_allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  return Store_plan;
};
