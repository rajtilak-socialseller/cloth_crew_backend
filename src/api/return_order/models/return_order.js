
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Return_order = sequelize.define("Return_order", {
    note: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM("ACCEPTED", "REJECTED", "APPROVED", "PENDING"),
      defaultValue: "PENDING"
    },
  });

  return Return_order;
};
