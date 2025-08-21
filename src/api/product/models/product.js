const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Product = sequelize.define("Product", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    cod_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    product_return: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    return_days: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
    },
    shipping_value: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    enquiry_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    show_price: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    booking_price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    shipping_value_type: {
      type: DataTypes.ENUM(
        "SHIPPING_PRICE",
        "SHIPPING_PERCENTAGE",
        "FREE_SHIPPING"
      ),
      allowNull: false,
    },
    yt_video_link: { type: DataTypes.STRING },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  });

  return Product;
};
