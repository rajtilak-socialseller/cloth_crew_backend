const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Booking = sequelize.define(
    "Booking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Store_users",
          key: "id",
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Products", key: "id" },
      },
      variantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Variants", key: "id" },
      },
      bookingDate: { type: DataTypes.DATE, allowNull: false },
      bookingTime: { type: DataTypes.TIME, allowNull: false },
      expireDate: { type: DataTypes.DATE, allowNull: false },
      bookingCancellation: { type: DataTypes.BOOLEAN, defaultValue: false },
      productQuantity: { type: DataTypes.INTEGER, allowNull: false },
      currentQuantity: { type: DataTypes.INTEGER, allowNull: true },
      amountPerDay: { type: DataTypes.FLOAT, allowNull: false },
      totalAmount: { type: DataTypes.FLOAT, allowNull: false },
      bookingCancellationDateTime: { type: DataTypes.DATE },
    },
    {
      timestamps: true,
    }
  );

  return Booking;
};
