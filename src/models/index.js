// src/models/index.js
const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../../config/db.config"); // your db config file

const sequelize = new Sequelize(dbConfig);

// Register models
const Booking = require("../api/product_booking/models/productBooking")(
  sequelize,
  DataTypes
);
const Store_user = require("../api/store_user/models/store_user")(
  sequelize,
  DataTypes
);
const Variant = require("../api/variant/models/variant")(sequelize, DataTypes);

const Wallet = require("../api/wallet/models/wallet")(sequelize, DataTypes);

const Transaction = require("../api/transaction/models/transaction")(
  sequelize,
  DataTypes
);
// If any associations
Booking.associate && Booking.associate(sequelize.models);
Store_user.associate && Store_user.associate(sequelize.models);
Variant.associate && Variant.associate(sequelize.models);

Wallet.associate && Wallet.associate(sequelize.models);

Transaction.associate && Transaction.associate(sequelize.models);

// Export all
module.exports = {
  sequelize,
  Sequelize,
  Booking,
  Store_user,
  Variant,
};
