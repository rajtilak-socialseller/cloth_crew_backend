
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Wallet = sequelize.define("Wallet", {
    amount: {
      type: DataTypes.DECIMAL,
    },
    transaction_type: {
      type: DataTypes.ENUM("DEBIT", "CREDIT"),
    },
    reason: {
      type: DataTypes.ENUM("PURCHASE", "WITHDRAWAL", "ADDITION", "PAYOUT_SENT"),
    },
    remark: {
      type: DataTypes.TEXT,
    },
     StoreUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  // Define associations or additional methods as needed


  return Wallet;
};
