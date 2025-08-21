
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const notification = sequelize.define("Notification", {
    title: {
      type: DataTypes.STRING,
    },
    desctiption: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.ENUM("PRODUCT", "COLLECTION", "ORDER", "SUBSCRIPTION", "PROMOTION", "INFORMATION", "TRANSACTION"),
    },
    isRead: {
      type: DataTypes.BOOLEAN,
    },
    data: {
      type: DataTypes.STRING,
    },
  });

  return notification;
};
