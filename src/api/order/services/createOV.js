const crypto = require("crypto");
const jwt = require("../../../services/jwt");
const {
  tokenError,
  errorResponse,
} = require("../../../services/errorResponse");
const dbCache = require("../../../utils/dbCache");
const dbConnection = require("../../../utils/dbConnection");

exports.createOrderVaraint = async ({
  razorpayOrder,
  StoreUserId,
  body,
  sequelize,
  transaction,
  variantsPrice,
  totalAmount,
}) => {
  try {
    const order = await sequelize.models.Order.create(
      {
        slug: generateOrderId(),
        consumer_name: body.consumer.name,
        consumer_email: body.consumer.email,
        consumer_phone: body.consumer.phone,
        payment_order_id: razorpayOrder.id,
        price: totalAmount,
        StoreUserId: StoreUserId,
        payment_mode: body.payment_mode,
        status: "new",
        AddressId: body.AddressId,
        is_paid: false,
        gstPrice: body.gstPrice,
        gstPercentage: body.gstPercentage,
        is_reseller_order: body.consumer.isResellerOrder,
      },
      { transaction } // Use the provided transaction if available
    );

    let order_variants_body = [];

    for (const [i, it] of body.variants.entries()) {
      let obj = {};
      obj["quantity"] = it.quantity;
      obj["VariantId"] = it.VariantId;
      obj["price"] = variantsPrice[it.VariantId];
      obj["status"] = "NEW";
      obj["OrderId"] = order.id;
      obj["booking"] = it?.bookingId;
      obj["is_self_pickup"] = it?.is_self_pickup;
      obj["self_pickup_address"] = it?.self_pickup_address;
      if (body.consumer.isResellerOrder) {
        obj["selling_price"] = it.sellingPrice;
      }
      order_variants_body.push(obj);
    }

    // if variant is booking then decrement the productBooking quantity
    for (const [i, it] of body.variants.entries()) {
      if (it?.bookingId) {
        const booking = await sequelize.models.Booking.findOne({
          where: { id: it.bookingId },
        });
        if (!booking) {
          return res.status(400).send(
            errorResponse({
              message: "Bad Request!",
              details: "Booking is not present in the database",
            })
          );
        }
        await sequelize.models.Booking.decrement("CurrentQuantity", {
          by: it.quantity,
          where: { id: it.bookingId },
          transaction,
        });
      }
    }

    const orderVariant = await sequelize.models.Order_variant.bulkCreate(
      order_variants_body,
      { transaction }
    );

    return order.id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.getAccountId = async ({ client }) => {
  try {
    // //console.log(client);
    const sequelize = await dbConnection(null);

    const user = await sequelize.models.User.findOne({
      where: { subdomain: client },
    });

    if (!user) {
      return res.status(400).send(
        errorResponse({
          message: "Bad Request!",
          details: "clint is not present in the database",
        })
      );
    }

    const account_id = user.razorpay_account_id;

    return account_id;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
// to be refactor
exports.getSelectedGateway = async () => {
  try {
    const sequelize = await dbConnection(null);

    const global = await sequelize.models.Global.findOne();

    if (!global) {
      return res.status(400).send(
        errorResponse({
          message: "Bad Request!",
          details: "global is not present in the database",
        })
      );
    }

    const selected_payment_gateway = global.selected_payment_gateway;

    return selected_payment_gateway;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const generateOrderId = () => {
  const order_id_prefix = "ORD";
  const order_id_length = 10;
  const generatedOrderId =
    order_id_prefix +
    crypto
      .randomBytes(order_id_length / 2)
      .toString("hex")
      .toUpperCase();
  return generatedOrderId;
};
