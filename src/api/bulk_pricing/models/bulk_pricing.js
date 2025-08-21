const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Bulk_pricing = sequelize.define("Bulk_pricing", {
    from: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    to: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
    premiumPrice: {
      type: DataTypes.DECIMAL,
    },
  });

  return Bulk_pricing;
};
