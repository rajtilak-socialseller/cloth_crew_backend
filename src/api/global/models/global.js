const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Global = sequelize.define(
    "Global",
    {
      subscription_price: {
        type: DataTypes.DECIMAL,
      },
      subscription_validity: {
        type: DataTypes.INTEGER,
      },
      razorpay_key: {
        type: DataTypes.STRING,
      },
      razorpay_secret: {
        type: DataTypes.STRING,
      },
      razorpayX_account_number: {
        type: DataTypes.STRING,
      },
      selected_payment_gateway: {
        type: DataTypes.ENUM("RAZORPAY", "CASHFREE", "PHONEPE", "NONE", "SPAY"),
      },
      monthly_server_price: {
        type: DataTypes.DECIMAL,
        default: 999
      },
      half_yearly_server_price: {
        type: DataTypes.DECIMAL,
        default: 3999
      },
      yearly_server_price: {
        type: DataTypes.DECIMAL,
        default: 5999
      }
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
  return Global;
};
