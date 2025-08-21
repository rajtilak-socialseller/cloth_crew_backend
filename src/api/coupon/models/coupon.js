const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Coupon = sequelize.define("Coupon", {
    coupon_code: {
      type: DataTypes.STRING,
    },
    message: {
      type: DataTypes.STRING,
    },
    discount_value: {
      type: DataTypes.DECIMAL,
    },
    valid_from: {
      type: DataTypes.DATE,
    },
    valid_to: {
      type: DataTypes.DATE,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    coupon_type: {
      type: DataTypes.ENUM("PRODUCT", "COLLECTION")
    },
    discount_type: {
      type: DataTypes.ENUM("FLAT", "PERCENTAGE"),
      default: "FLAT",
    },
  });

  // Define associations or additional methods as needed

  return Coupon;
};
