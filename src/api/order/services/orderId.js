const crypto = require("crypto");

const generateOrderId = (prefix) => {
  const order_id_prefix = prefix || "ORD";
  const order_id_length = 10;

  const generatedOrderId = order_id_prefix + crypto.randomBytes(order_id_length / 2).toString("hex").toUpperCase();
  return generatedOrderId;
};

const generateTransactionId = (prefix) => {
  const randomBytes = crypto.randomBytes(5);
  const transactionId = (prefix || "WLT") + randomBytes.toString("hex").toUpperCase();
  return transactionId.substring(0, 13);
};

module.exports = {
  generateOrderId,
  generateTransactionId,
};
