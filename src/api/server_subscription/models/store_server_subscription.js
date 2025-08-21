const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Store_server_subscription = sequelize.define("Store_server_subscription", {
    order_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL,
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purchaseType: {
      type: DataTypes.ENUM(["ONLINE", "CASH"]),
      allowNull: true,
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    valid_to: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM(["ACTIVE", "REFUNDED", "EXPIRED"]),
    },
  });

  return Store_server_subscription;
};
