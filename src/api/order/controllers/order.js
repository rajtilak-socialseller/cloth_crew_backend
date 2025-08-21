const { activity_event } = require("../../../constants/activity_log");
const axios = require("axios");
const { createActivityLog } = require("../../../services/createActivityLog");
const {
  createTransaction,
  adminTransaction,
} = require("../../../services/createTrnx.js");
const crypto = require("crypto");
const { getPagination, getMeta } = require("../../../services/pagination");
const getWebhookBody = require("../services/getWebhookBody");
const { generateOrderId } = require("../services/orderId.js");
const generateTransactionId = require("../services/orderId.js");
const jwt = require("../../../services/jwt");
const { order_status } = require("../../../constants/order_status.js");
const orderTracker = require("../../../services/orderTracker.js");
const {
  createOrderVaraint,
  getAccountId,
  getSelectedGateway,
} = require("../services/createOV.js");
const { Op, where } = require("sequelize");
const Razorpay = require("razorpay");
const {
  errorResponse,
  tokenError,
} = require("../../../services/errorResponse");
const { verify } = require("../../../services/jwt");
const uuid = require("uuid");
const transaction = require("../../../constants/transaction.js");
const { mailSender } = require("../../../services/emailSender.js");
const fs = require("fs");
const ejs = require("ejs");
const tenantMetric = require("../../../services/tenantMetric.js");
const { tenant_metric_fields } = require("../../../constants/tenant_metric.js");
const productMetrics = require("../../../services/productMetrics.js");
const { product_metric_field } = require("../../../constants/productMetric.js");
const bulkPricingChecker = require("../services/bulkPricingChecker");
const order = require("../../../constants/order.js");
const dbConnection = require("../../../utils/dbConnection");
const { defaultRazorpay } = require("../../../utils/gateway.js");
const codChecker = require("../services/codChecker.js");
const shippingPriceChecker = require("../services/shippingPriceChecker.js");
const orderBy = require("../../../services/orderBy.js");
const excelExport = require("../../../services/excelExport.js");
const calculateCouponPrice = require("../services/couponPrice");
const { createInvoice } = require("../../../services/invoiceGenerator.js");
const { IntraktNotify } = require("../../../services/notification.js");
const phonepePG = require("../services/phonepePG.js");
const { default: Stripe } = require("stripe");
const stripe = Stripe(
  "sk_test_51PRqPYJvgOMJkcVLjTktCZzCxSBoEtSb3JMcvT4ppR2VepB3jrqu07uaZjwiG92PVmwiMX8R4ezKotaNtsTfs7bY00mojAFYe1"
);
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const Order = sequelize.models.Order;
    const newOrder = await Order.create(req.body);
    return res.status(201).send({
      message: "Order created successfully!",
      data: newOrder,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create an order" });
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const Order = sequelize.models.Order;
    const orderId = req.params.id;

    const [updatedRowsCount, [updatedOrder]] = await Order.update(req.body, {
      where: { id: orderId },
      returning: true,
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: "Order not found" });
    }

    return res.status(200).send({
      message: "Order updated successfully!",
      data: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order" });
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const whereClause_OV = {};
    const whereClause_O = {};
    if (query.hasOwnProperty("status")) {
      if (query.status.toLowerCase() === "all") {
      } else if (!Object.values(order.order_status).includes(query.status)) {
        return res.status(400).send(
          errorResponse({
            message: `Invalid status type select from ${Object.values(
              order.order_status
            )}`,
          })
        );
      } else {
        whereClause_OV.status = query.status;
      }
    }
    if (query.hasOwnProperty("payment_mode")) {
      if (!Object.values(order.payment_modes).includes(query.payment_mode)) {
        return res.status(400).send(
          errorResponse({
            message: `Invalid Payment Mode Type select from ${Object.values(
              order.payment_modes
            )}`,
          })
        );
      }
      whereClause_O.payment_mode = query.payment_mode;
    }
    if (query.hasOwnProperty("reseller_order")) {
      query.reseller_order === "true"
        ? (whereClause_O.is_reseller_order = true)
        : query.reseller_order === "false"
        ? (whereClause_O.is_reseller_order = false)
        : "";
    }
    const orders = await sequelize.models.Order.findAndCountAll({
      where: whereClause_O,
      include: [
        {
          model: sequelize.models.Order_variant,
          as: "orderVariants",
          where: whereClause_OV,
          include: [
            {
              model: sequelize.models.Variant,
              as: "variant",
              include: ["thumbnail"],
            },
          ],
        },
      ],
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, orders.count);

    return res.status(200).send({
      data: orders.rows,
      meta,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    if (token.error) return res.status(401).send(tokenError(token));
    const id = req.params.id;
    const order = await sequelize.models.Order.findOne({
      where: { id: id },
      include: [
        {
          model: sequelize.models.Order_variant,
          as: "orderVariants",
          include: [
            {
              model: sequelize.models.Variant,
              as: "variant",
              include: [
                "thumbnail",
                {
                  model: sequelize.models.Product,
                  attributes: ["id", "name", "description", "return_days"],
                  as: "product",
                  include: ["thumbnail"],
                },
              ],
            },
          ],
        },
        "address",
      ],
    });

    if (!order || order.StoreUserId !== token.id) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: `Order not found for user ${token.id} and order ${id}`,
        })
      );
    }

    return res.status(200).send({ data: order });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch the order" });
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const Order = sequelize.models.Order;
    const orderId = req.params.id;
    const deletedRowCount = await Order.destroy({ where: { id: orderId } });

    if (deletedRowCount === 0) {
      return res.status(404).send({ error: "Order not found" });
    }

    return res.status(200).send({ message: "Order deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to delete the order" });
  }
};

exports.checkOut = async (req, res) => {
  const sequelize = req.db;
  const client = req.hostname.split(".")[0];
  const user = req.user;
  const StoreUserId = user.id;
  const variants_details = req.variants_arr;
  const plan = req.user_sub;
  
  try {
    await sequelize.transaction(async (t) => {
      //console.log("Entered in razorpay checkout");
      const global = req.global;
      const body = req.body;
        
      const variants = body.variants;
      const user_recent_sub = req.user_sub;
      let { totalAmount, variantsPrice } = await bulkPricingChecker({
        user,
        variants,
        variants_details,
        user_recent_sub,
      });

      const couponPrice = await calculateCouponPrice(
        sequelize,
        variantsPrice,
        variants
      );

      variantsPrice = couponPrice.variantsPrice;
      totalAmount = couponPrice.totalAmount;
      // prepaid discount checking
      if ((global.prepaid_discount, global.prepaid_discount > 0)) {
        console.log("prepaid discount");
        if (global.prepaid_discount_type === "PRICE") {
          console.log("PRICE");
          totalAmount = totalAmount - global.prepaid_discount;
        } else {
          console.log("PERCENTAGE");
          console.log((global.prepaid_discount / 100) * totalAmount);
          totalAmount =
            totalAmount - (global.prepaid_discount / 100) * totalAmount;
        }
      }
      // prepaid discount checking end

      let payableAmount = 0;
      if (req.body.payment_mode === "COD") {
        const COD = await codChecker(global, totalAmount);
        // totalAmount = +COD.codAmount;
        payableAmount = +COD.codAmount;
      }

      const shippingPrice = await shippingPriceChecker({
        global,
        variantsArray: variants_details,
        variantsPrice,
      });

      totalAmount += shippingPrice;
      let razorpay, options, rzOrder, PG_used;

      if (global.selected_payment_gateway === "NONE") {
        return res.status(500).send(
          errorResponse({
            message: "Can't initiate order,Invalid Payment Gateway Selected",
          })
        );
      }

      PG_used = global.selected_payment_gateway;

      // if (
      //   global.selected_payment_gateway !== "NONE" &&
      //   global.razorpay_secret &&
      //   global.razorpay_key
      // ) {
      //   PG_used = "STORE";
      // } else {
      //   const selected_payment_gateway = await getSelectedGateway();
      //   PG_used = selected_payment_gateway === "SPAY" ? "SPAY" : "GLOBAL";
      // }

      // switch (PG_used) {
      //   case "STORE":
      //     //console.log("PG STORE");
      //     razorpay = new Razorpay({
      //       key_id: global.razorpay_key,
      //       key_secret: global.razorpay_secret,
      //     });
      //     options = {
      //       amount: totalAmount * 100,
      //       currency: "INR",
      //       receipt: "RCT" + require("uid").uid(10).toUpperCase(),
      //     };
      //     rzOrder = await razorpay.orders.create(options);
      //     break;
      //   case "GLOBAL":
      //     //console.log("PG GLOBAL");
      //     razorpay = (await defaultRazorpay()).instance;
      //     const account_id = await getAccountId({ client });
      //     if (!account_id) {
      //       return res.status(400).send(
      //         errorResponse({
      //           message: "Bad Request!",
      //           details: "razorpay routes cred missing",
      //         })
      //       );
      //     }

      //     options = {
      //       amount: totalAmount * 100,
      //       currency: "INR",
      //       receipt: "RCT" + require("uid").uid(10).toUpperCase(),
      //       transfers: [
      //         {
      //           account: account_id,
      //           amount: totalAmount * 100,
      //           currency: "INR",
      //           notes: {
      //             branch: "Acme Corp Bangalore North",
      //             name: client,
      //           },
      //           linked_account_notes: ["branch"],
      //         },
      //       ],
      //     };

      //     rzOrder = await razorpay.orders.create(options);
      //     break;
      //   case "SPAY":
      //     //console.log("PG SPAY");
      //     const order_body = {
      //       totalAmount: totalAmount,
      //       payment_mode: body.payment_mode,
      //       razorpay_env: process.env.ENVIRONMENT,
      //     };

      //     try {
      //       const personalId = await global.personal_id;
      //       const razorpayOrder = await axios.post(
      //         "https://5137-115-245-32-170.ngrok-free.app/api/orders/razorpay",
      //         order_body,
      //         {
      //           headers: {
      //             "X-VERIFY": personalId,
      //             "Content-Type": "application/json",
      //           },
      //         }
      //       );
      //       rzOrder = razorpayOrder.data;
      //     } catch (error) {
      //       console.error("Error sending Razorpay request:", error);
      //       return res
      //         .status(500)
      //         .send(errorResponse({ message: error.message, status: 500 }));
      //     }
      //     break;

      //   default:
      //     break;
      // }
      // PG_used = "PHONEPE"
      if (req.body.payment_mode === "COD" && payableAmount === 0) {
        PG_used = "FREE_COD";
      }

      console.log(PG_used);

      switch (PG_used) {
        case "RAZORPAY":
          console.log(totalAmount);
          razorpay = new Razorpay({
            key_id: global.razorpay_key,
            key_secret: global.razorpay_secret,
          });
          options = {
            amount:
              req.body.payment_mode === "COD"
                ? payableAmount * 100
                : totalAmount * 100,
            currency: "INR",
            receipt: "RCT" + require("uid").uid(10).toUpperCase(),
          };
          rzOrder = await razorpay.orders.create(options);
          break;
        case "PHONEPE":
          //console.log("phonepe")
          rzOrder = await phonepePG({
            body: body,
            token: req.headers.authorization.split(" ")[1],
            merchantId: global.phonepe_merchant_id,
            secretKey: global.phonepe_merchant_key,
            amount:
              req.body.payment_mode === "COD" ? payableAmount : totalAmount,
            client: client,
          });
          rzOrder.id = rzOrder.data.merchantTransactionId;
          rzOrder.amount = totalAmount * 100;
          break;
        case "STRIPE":
          //console.log("STRIPE")
          rzOrder = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: "usd",
            automatic_payment_methods: {
              enabled: true,
            },
          });
          break;
        case "FREE_COD":
          rzOrder = {};
          rzOrder.id = generateOrderId("ORD");
          break;
        default:
          break;
      }

      // //console.log(rzOrder)

      const order_id = await createOrderVaraint({
        body,
        razorpayOrder: rzOrder,
        sequelize,
        transaction: t,
        StoreUserId,
        variants_details,
        variantsPrice,
        totalAmount,
      });

      return res.status(200).send({ data: { ...rzOrder, order_id } });
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.verify = async (req, res) => {
  const sequelize = req.db;
  const t = await req.db.transaction();
  try {
    const global = await sequelize.models.Store_global.findOne({ raw: true });
    const token = verify(req);
    let razorpayInstance, razorpay_secret, amount;
    const user = await sequelize.models.Store_user.findByPk(token.id);
    let PG_used = global.selected_payment_gateway;
    let order_id, razorpay_order_id, razorpay_signature, razorpay_payment_id;
    switch (PG_used) {
      case "RAZORPAY":
        order_id = req.body?.order_id;
        razorpay_order_id = req.body?.razorpay_order_id;
        razorpay_payment_id = req.body?.razorpay_payment_id;
        razorpay_signature = req.body?.razorpay_signature;
        razorpayInstance = new Razorpay({
          key_id: global.razorpay_key,
          key_secret: global.razorpay_secret,
        });
        razorpay_secret = global.razorpay_secret;
        break;
      case "PHONEPE":
      // //console.log(req.body)
      //console.log("phonepe")
      default:
        break;
    }

    if (
      global.selected_payment_gateway === "RAZORPAY" &&
      razorpay_secret !== null
    ) {
      const generateSignature = crypto
        .createHmac("sha256", razorpay_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (generateSignature !== razorpay_signature) {
        return res.status(400).send(
          errorResponse({
            message: "Bad Request!",
            details:
              "razorpay_signature and generated_signature did not match!",
          })
        );
      }
      const rzOrder = await razorpayInstance.orders.fetch(razorpay_order_id);
      amount = rzOrder.amount / 100;

      let payment_log_data = {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        status: "CAPTURED",
        amount: amount,
      };

      const log = await sequelize.models.Store_payment_log.findOne({
        where: { order_id: razorpay_order_id },
      });
      if (log && !log.method) {
        const update_log = await log.update(payment_log_data, {
          transaction: t,
        });
      } else {
        const create_log = await sequelize.models.Store_payment_log.create(
          payment_log_data,
          { transaction: t }
        );
      }
    }

    // ################################ Signature Check End  #################################

    await createTransaction({
      sequelize,
      purpose: transaction.purpose.PURCHASE,
      amount: amount,
      mode: transaction.mode.MONEY,
      StoreUserId: user.id,
      transaction: t,
      txn_type: transaction.txn_type.CREDIT,
    });

    await adminTransaction({
      subdomain: req.subdomain,
      purpose: transaction.purpose.PURCHASE,
      amount: amount,
      mode: transaction.mode.MONEY,
      txn_type: transaction.txn_type.CREDIT,
    });

    const getOrder = await sequelize.models.Order.findOne({
      where: { payment_order_id: razorpay_order_id },
    });

    const [rows, [order]] = await sequelize.models.Order.update(
      {
        is_paid: true,
        payment_id: razorpay_payment_id,
        is_cod_paid:
          getOrder.payment_mode === "COD" && getOrder.is_paid === true
            ? true
            : false,
      },
      {
        where: { payment_order_id: razorpay_order_id },
        returning: true,
        transaction: t,
      }
    );

    const [rowsCunt, orderVariant] =
      await sequelize.models.Order_variant.update(
        { status: order_status.NEW },
        {
          where: { OrderId: order.id },
          transaction: t,
          returning: true,
          // raw: true,
        }
      );

    for (const ov of orderVariant) {
      await sequelize.models.Variant.decrement(
        { quantity: ov.quantity },
        {
          where: { id: ov.VariantId },
          transaction: t,
        }
      );
    }

    // const htmlContent = fs.readFileSync("./views/orderTemplate.ejs", "utf8");
    // const datatosend = {
    //   name: user.name,
    //   orderId: getOrder.order_id,
    //   orders: JSON.parse(JSON.stringify(orderVariant)),
    //   itemSubtotal: orderVariant.reduce((acc, cur) => acc.price + cur.price),
    //   shipping: 0,
    //   discount: 0,
    //   total: orderVariant.reduce((acc, cur) => acc.price + cur.price)
    // }
    // const renderedContent = ejs.render(htmlContent,);

    // if (user.email) {
    //   await mailSender({
    //     to: "narayan.socialseller@gmail.com",
    //     subject: "Order Placed",
    //     html: renderedContent,
    //   });
    // }

    // // ################### Code to Create Order Tracker entry ############# //

    const orderVariantIds = orderVariant.map((variant) => {
      return variant.id;
    });

    const orderVariants = await sequelize.models.Order_variant.findAll({
      where: { id: { [Op.in]: orderVariantIds } },
      include: [
        {
          model: sequelize.models.Variant,
          as: "variant",
          include: [
            {
              model: sequelize.models.Product,
              as: "product",
              include: ["thumbnail"],
            },
          ],
        },
      ],
    });

    const ProductIds = orderVariants.map((item) => {
      return item.variant.ProductId;
    });

    await createActivityLog({
      sequelize: sequelize,
      StoreUserId: user.id,
      event: activity_event.ORDER_PLACED,
      transaction: t,
    });
    await orderTracker({
      sequelize,
      order_variant_ids: orderVariantIds,
      status: order_status.NEW,
      transaction: t,
    });

    await tenantMetric({
      subdomain: req.subdomain,
      field_name: tenant_metric_fields.total_orders,
    });
    await tenantMetric({
      subdomain: req.subdomain,
      field_name: tenant_metric_fields.total_transaction,
    });
    await productMetrics({
      sequelize,
      transaction: t,
      field_name: product_metric_field.revenue_generated,
      order_variant: orderVariants,
    });

    await productMetrics({
      sequelize,
      field_name: product_metric_field.ordered_count,
      product_id: ProductIds,
      transaction: t,
    });
    const users = await sequelize.models.Store_user.findAll({
      attributes: ["phone"],
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Consumer" },
          attributes: [],
        },
      ],
    });
    await t.commit();
    const data = {
      containsImage: true,
      body: [order.consumer_name, "1299"],
      hasButton: false,
      phoneNumber: order.consumer_phone,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
    };
    IntraktNotify(data, sequelize, "ORDER");
    return res.status(200).send({ success: true, data: orderVariants });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.webhook = async (req, res) => {
  try {
    //console.log("entered in razorpay webhook");
    const sequelize = req.db;

    const storeGlobals = await sequelize.models.Store_global.findOne();

    // // ################### if the razorpay credentials are present in store #################
    if (storeGlobals.razorpay_key && storeGlobals.razorpay_secret) {
      //console.log("store razorpay key is present");
      const hookSignature = crypto.createHmac(
        "sha256",
        storeGlobals.razorpay_secret
      );

      hookSignature.update(JSON.stringify(req.body));
      const digest = hookSignature.digest("hex");

      if (digest !== req.headers["x-razorpay-signature"]) {
        return res.status(400).send({ error: "Invalid Request!" });
      }

      const global = await sequelize.models.Store_global.findOne();
      const gateway = global.selected_payment_gateway;

      const webHookBody = await getWebhookBody(req, gateway);
      // //console.log(JSON.stringify(webHookBody));

      const payment_log = sequelize.models.Payment_log.findOne({
        where: { order_id: req.body.payload.payment.entity.order_id },
      });

      if (payment_log) {
        return res.status(200).send({ data: payment_log });
      } else {
        const new_payment_log =
          sequelize.models.Payment_log.create(webHookBody);
        return res.status(200).send({ data: new_payment_log });
      }

      // // ################### if the razorpay credentials are present in not store #################
    } else {
      //console.log("store razorpay key is not present");
      const sequelize = await dbConnection(null);
      const global = await sequelize.models.Global.findOne();

      const hookSignature = crypto.createHmac("sha256", global.razorpay_secret);

      hookSignature.update(JSON.stringify(req.body));
      const digest = hookSignature.digest("hex");

      if (digest !== req.headers["x-razorpay-signature"]) {
        return res.status(400).send({ error: "Invalid Request!" });
      }

      const gateway = global.selected_payment_gateway;

      const webHookBody = await getWebhookBody(req, gateway);
      //console.log(JSON.stringify(webHookBody));

      const payment_log = sequelize.models.Payment_log.findOne({
        where: { order_id: req.body.payload.payment.entity.order_id },
      });

      if (payment_log) {
        return res.status(200).send({ data: payment_log });
      } else {
        const new_payment_log =
          sequelize.models.Payment_log.create(webHookBody);
        return res.status(200).send({ data: new_payment_log });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.checkOutWallet = async (req, res) => {
  const sequelize = req.db;
  const variants_details = req.variants_arr;
  const client = req.hostname.split(".")[0];
  const token = jwt.verify(req);
  const { AddressId, variants } = req.body;
  const body = req.body;
  
 
  try {
    await sequelize.transaction(async (t) => {
      //console.log("Entered in wallet checkout");
      const payment_id = generateTransactionId.generateTransactionId();
      const user = await sequelize.models.Store_user.findByPk(token.id);
      if (!user) {
        return res.status(400).send(
          errorResponse({
            message: "User Not Found",
          })
        );
      }

      const user_recent_sub = req.user_sub;
      let { totalAmount, variantsPrice } = await bulkPricingChecker({
        user,
        variants,
        variants_details,
        // body,
        user_recent_sub,
      });

      if (user.wallet_balance < totalAmount) {
        return res.status(400).send(
          errorResponse({
            message: "Insufficient wallet ballance",
          })
        );
      }

      const order = await sequelize.models.Order.create(
        {
          slug: generateOrderId.generateTransactionId(),
          payment_order_id: generateTransactionId.generateOrderId(),
          payment_id,
          price: totalAmount,
          StoreUserId: token.id,
          payment_mode: "WALLET",
          status: "NEW",
          AddressId: AddressId,
          is_paid: true,
          is_reseller_order: req.body.consumer.isResellerOrder,
          consumer_name: req.body.consumer.name,
          consumer_email: req.body.consumer.email,
          consumer_phone: req.body.consumer.phone,
          gstPercentage: req.body.gstPercentage,
          gstPrice: req.body.gstPrice,
          is_self_pickup: req.body?.is_self_pickup,
          self_pickup_address: req.body?.self_pickup_address,
        },
        { transaction: t } // Use the provided transaction if available
      );

      // //console.log(order);
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
        { transaction: t }
      );

      // ################  Subtracting QTYs ####################
      let Vids = [];
      for (const variant of req.body.variants) {
        const [rowCount, [variantId]] = await sequelize.models.Variant.update(
          { quantity: sequelize.literal(`quantity - ${variant.quantity}`) },
          {
            where: { id: variant.VariantId },
            returning: true,
            transaction: t,
          },
          { transaction: t }
        );
        Vids.push(variantId.ProductId);
      }

      const deductWalletBal = await sequelize.models.Store_user.increment(
        { wallet_balance: -totalAmount },
        {
          where: { id: user.id },
          transaction: t,
        }
      );

      const htmlContent = fs.readFileSync("./views/orderTemplate.ejs", "utf8");
      const renderedContent = ejs.render(htmlContent, {
        price: totalAmount,
        slug: "nuil",
        name: "narayan patel",
        discount: 99,
      });

      await createActivityLog({
        sequelize,
        StoreUserId: token.id,
        event: activity_event.ORDER_PLACED,
        transaction: t,
      });
      await createTransaction({
        sequelize,
        purpose: transaction.purpose.PURCHASE,
        amount: totalAmount,
        mode: transaction.mode.WALLET,
        StoreUserId: token.id,
        transaction: t,
        txn_type: transaction.txn_type.CREDIT,
      });
      await adminTransaction({
        subdomain: req.subdomain,
        purpose: transaction.purpose.PURCHASE,
        amount: totalAmount,
        mode: transaction.mode.WALLET,
        transaction: t,
        txn_type: transaction.txn_type.CREDIT,
      });

      await tenantMetric({
        subdomain: req.subdomain,
        field_name: tenant_metric_fields.total_orders,
      });

      let orderVariantIds = await orderVariant.map((variant) => {
        return variant.id;
      });

      await orderTracker({
        sequelize,
        order_variant_ids: orderVariantIds,
        status: order_status.ACCEPTED,
        transaction: t,
      });

      const orderVariants = await sequelize.models.Order_variant.findAll({
        where: { id: { [Op.in]: orderVariantIds } },
        transaction: t,
        include: [{ model: sequelize.models.Variant, as: "variant" }],
      });

      await productMetrics({
        sequelize,
        field_name: product_metric_field.revenue_generated,
        order_variant: orderVariants,
        transaction: t,
      });

      let product_ids = orderVariants.map((item) => {
        return item.variant.ProductId;
      });

      await productMetrics({
        sequelize,
        field_name: product_metric_field.ordered_count,
        product_id: product_ids,
        transaction: t,
      });

      const data = {
        // containsImage: true, body: [order.consumer_name, "1299"], hasButton: false, phoneNumber: order.consumer_phone,
        containsImage: true,
        body: ["order confirmed", "1299"],
        hasButton: false,
        phoneNumber: user.phone,
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
      };
      IntraktNotify(data, sequelize, "ORDER");

      await mailSender({
        to: "patelnarayan83499@gmail.com",
        subject: "Order Place VIA wallet",
        html: renderedContent,
      });
      return res.status(200).send({ data: order });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create order" });
  }
};

exports.getOrdersByStatus = async (req, res) => {
  try {
    const sequelize = req.db;
    const Order = sequelize.models.Order;
    const status = req.params.status;
    const query = req.query;
    const pagination = await getPagination(query.pagination);

    // Find orders with the specified status
    const orders = await Order.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      distinct: true,
      include: {
        model: sequelize.models.Order_variant,
        as: "orderVariants",
        where: { status: status.toUpperCase() },
        required: false,
        attributes: [],
      },
    });
    const meta = await getMeta(pagination, orders.count);
    return res.status(200).send({
      data: orders.rows,
      meta,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ error: "Failed to retrieve orders by status" });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    //console.log("entering search");
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs.trim();
    const pagination = await getPagination(query.pagination);
    const whereClause_OV = {};
    const whereClause_O = {};

    if (query.hasOwnProperty("status")) {
      if (!Object.values(order.order_status).includes(query.status)) {
        return res.status(400).send(
          errorResponse({
            message: `Invalid status type select from ${Object.values(
              order.order_status
            )}`,
          })
        );
      }
      whereClause_OV.status = query.status;
    }
    if (query.hasOwnProperty("payment_mode")) {
      if (!Object.values(order.payment_modes).includes(query.payment_mode)) {
        return res.status(400).send(
          errorResponse({
            message: `Invalid Payment Mode Type select from ${Object.values(
              order.payment_modes
            )}`,
          })
        );
      }
      whereClause_O.payment_mode = query.payment_mode;
    }
    if (query.hasOwnProperty("reseller_order")) {
      query.reseller_order === "true"
        ? (whereClause_O.is_reseller_order = true)
        : query.reseller_order === "false"
        ? (whereClause_O.is_reseller_order = false)
        : "";
    }

    const orders = await sequelize.models.Order.findAndCountAll({
      where: whereClause_O,
      include: [
        {
          model: sequelize.models.Order_variant,
          as: "orderVariants",
          where: whereClause_OV,
          include: [
            {
              model: sequelize.models.Variant,
              as: "variant",
              // where: { name: { [Op.iLike]: `%${qs}%` } },
            },
          ],
        },
      ],
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, orders.count);
    return res.status(200).send({ data: orders.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch orders" });
  }
};

exports.createCashfreeOrder = async (req, res) => {
  try {
    //console.log("entered in cashfree order");
    const order_id = uuid.v4();
    const sequelize = req.db;
    const { payment, UserStoreId, VariantId, quantity } = req.body;

    const variant = await sequelize.models.Variant.findByPk(VariantId);

    const amount = Number(variant.price * quantity);

    const options = {
      amount: Number(amount * 100),
      currency: "INR",
      receipt: "RCT" + require("uid").uid(10).toUpperCase(),
    };

    const createOrder = async () => {
      try {
        //console.log("entered in create order");

        const order = await sequelize.models.Order.create({
          order_id: order_id,
          price: amount,
          UserStoreId: UserStoreId,
          payment: payment,
          status: "new",
          address: "user address",
          isPaid: false,
        });

        // //console.log(order);
      } catch (error) {
        console.log(error);
        return error;
      }
    };

    const user = await sequelize.models.Store_user.findByPk(2);

    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        customer_details: {
          customer_id: "7112AAA812234",
          customer_phone: "9908734801",
          customer_email: user.email,
        },
        order_meta: {
          // return_url: `http://narayan.localhost:4500/api/order/cashfreeVerify?order_id=d1cdddbc-fcdb-4e84-a289-e5fe13b699d7`,
          return_url: `http://narayan.localhost:4500/api/order/cashfreeVerify?order_id=${order_id}`,
          // notify_url: "http://localhost:4500/api",
        },
        order_id: order_id,
        order_amount: amount,
        order_currency: "INR",
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        },
      }
    );

    const data = response.data;
    // //console.log(data);

    // Create a subscription
    await createOrder();

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to create Cashfree order" });
  }
};

exports.verifyCashfree = async (req, res) => {
  try {
    const sequelize = req.db;
    //console.log("entered in verify cashfree");
    const order_id = req.query.order_id;
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
        },
      }
    );

    const result = response.data;
    if (result.order_status === "PAID") {
      try {
        const order = await sequelize.models.Order.findOne({
          where: { payment_order_id: order_id },
        });

        if (order) {
          await order.update({
            payment_id: result.cf_order_id,
            status: "ACTIVE",
          });

          //console.log("Subscription updated successfully");
        } else {
          //console.log("Subscription not found");
        }
      } catch (error) {
        //console.log("Error creating payment log:", error);
        return res.status(500).send("Internal Server Error");
      }

      return res
        .status(200)
        .send({ message: "Transaction Successful!", data: result });
    } else {
      return res.status(400).send(
        errorResponse({
          message: "Bad Request!",
          details:
            "cashfree_signature and generated signature did not matched!",
        })
      );
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to verify Cashfree payment" });
  }
};

exports.webhookCashfree = async (req, res, buf) => {
  try {
    //console.log("entered in webhook cashfree");

    //console.log(req.rawBody + "this is body");

    const sequelize = req.db;
    const ts = req.headers["x-webhook-timestamp"];
    const signature = req.headers["x-webhook-signature"];
    const currTs = Math.floor(new Date().getTime() / 1000);

    if (currTs - ts > 30000) {
      return res.status(400).send("Failed");
    }

    const genSignature = await verify(ts, req.rawBody);

    if (signature === genSignature) {
      //console.log("signature is verified");
      const webHookBody = await getWebhookBody(req);
      //console.log(webHookBody + "this is webhookBody");
      const payment_log = await sequelize.models.Payment_log.create(
        webHookBody
      );
      //console.log("Payment log created successfully with body" + webHookBody);

      return res.status(200).send("OK");
    } else {
      //console.log("signature is not verified");
      return res.status(400).send("Failed");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.resellerPayout = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const { id } = req.params;

    const orderVariant = await sequelize.models.Order_variant.findByPk(id, {
      include: ["order"],
    });
    if (
      !orderVariant
      // || orderVariant.status !== order_status.INTRANSIT
    ) {
      return res.status(400).send(
        errorResponse({
          message: "Order not eligible for delivery",
          details: "Order is not in INTRANSIT status",
        })
      );
    }

    await orderVariant.update(
      { status: order_status.DELIVERED },
      {
        where: { id: id },
        transaction: t,
        returning: true,
        include: ["order"],
      }
    );

    if (
      orderVariant.order.is_reseller_order &&
      orderVariant.order.payment_mode === "COD"
    ) {
      let payout_amount = orderVariant.selling_price - orderVariant.price;
      await sequelize.models.Store_user.update(
        {
          wallet_balance: sequelize.literal(
            `wallet_balance + ${payout_amount}`
          ),
        },
        { where: { id: orderVariant.order.StoreUserId }, transaction: t }
      );
      await createTransaction({
        sequelize,
        purpose: transaction.purpose.ADDED_TO_WALLET,
        amount: payout_amount,
        mode: transaction.mode.WALLET,
        StoreUserId: orderVariant.order.StoreUserId,
        transaction: t,
        txn_type: transaction.txn_type.DEBIT,
      });
      await sequelize.models.Wallet.create(
        {
          StoreUserId: orderVariant.order.StoreUserId,
          amount: payout_amount,
          transaction_type: "DEPOSIT",
          remark: `Payout done for reseller order`,
        },
        { transaction: t }
      );
    }

    const user = await sequelize.models.Store_user.findByPk(
      orderVariant.order.StoreUserId
    );

    const data = {
      containsImage: true,
      body: ["order.consumer_name", "1299"],
      hasButton: false,
      phoneNumber: user.phone,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
    };
    IntraktNotify(data, sequelize, "ORDER");
    await createActivityLog({
      event: activity_event.ORDER_DELIVERED,
      sequelize,
      StoreUserId: token.id,
      transaction: t,
    });
    await orderTracker({
      sequelize,
      order_variant_ids: [id],
      status: order_status.DELIVERED,
      transaction: t,
    });
    await t.commit();

    return res.status(200).send({
      message: "Order Variant has been delivered!",
      data: orderVariant,
    });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const body = req.body;
    const whereClause = {};
    if (body.items.length && Array.isArray(body.items)) {
      whereClause.id = { [Op.in]: body.items };
    }
    const order = orderBy(query);
    const products = await sequelize.models.Order.findAll({
      where: whereClause,
      order: order,
      include: [
        { model: sequelize.models.Order_variant, as: "orderVariants" },
        "store_user",
      ],
      raw: true,
    });

    const excelFile = await excelExport(products);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="output.xlsx"');
    return res.status(200).send(excelFile);
  } catch (error) {
    return res
      .status(500)
      .send(
        errorResponse({ status: 500, message: error.message, details: error })
      );
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const sequelize = req.db;
    const order = await sequelize.models.Order.findByPk(id, {
      include: [
        "store_user",
        {
          model: sequelize.models.Address,
          as: "address",
          where: { [Op.and]: [{ addressLine1: { [Op.ne]: null } }] },
        },
        {
          model: sequelize.models.Order_variant,
          as: "orderVariants",
          include: [
            {
              model: sequelize.models.Variant,
              as: "variant",
              include: "product",
            },
          ],
        },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .send(errorResponse({ status: 404, message: "order not found" }));
    }

    const invoiceData = {
      name: order?.user?.name ?? order.customer_name,
      slug: order?.slug,
      phone: order?.user?.phone,
      address: `${order?.address?.addressLine1},${order?.address?.city},${order?.address?.state},${order?.address?.pincode}`,
      invoice_number: order?.payment_order_id,
      invoice_date: JSON.parse(JSON.stringify(order.createdAt)).split("T")[0],
      products: order?.orderVariants?.map((item) => {
        return {
          name: item?.variant?.product?.name,
          quantity: item?.quantity,
          price:
            order?.is_reseller_order === true
              ? item?.selling_price
              : item?.price,
          total_price: order?.is_reseller_order
            ? item?.selling_price * item?.quantity
            : item?.price * item?.quantity,
        };
      }),
    };

    invoiceData.sub_total = invoiceData.products
      ?.map((item) => item.total_price)
      ?.reduce((sum, acc) => sum + acc);
    invoiceData.tax = 0.0;
    invoiceData.total = invoiceData.sub_total + invoiceData.tax;
    const invoice = await createInvoice(invoiceData, "order");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": invoice.length,
      "Content-Disposition": 'attachment; filename="example.pdf"',
    });

    return res.status(200).send(invoice);
  } catch (error) {
    //console.log(error)
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import ("express").Response} res
 * @returns
 */
exports.phonePayVerify = async (req, res) => {
  const sequelize = req.db;
  const t = await req.db.transaction();
  try {
    //console.log("honejalskdjfj fjlskkdfj")
    const global = await sequelize.models.Store_global.findOne({ raw: true });
    // //console.log(req.body)
    let razorpayInstance, razorpay_secret, amount;
    let order_id = req.query.id;

    const getOrder = await sequelize.models.Order.findOne({
      where: { payment_order_id: order_id },
    });
    if (!getOrder) {
      return res.redirect(
        `https://${req.subdomain}.socialseller.in/paymentFailure`
      );
    }
    const user = await sequelize.models.Store_user.findByPk(
      getOrder.StoreUserId
    );
    amount = getOrder?.price;
    let payment_log_data = {
      payment_id: order_id,
      order_id: order_id,
      status: "CAPTURED",
      amount: amount,
    };

    const log = await sequelize.models.Store_payment_log.findOne({
      where: { order_id: order_id },
    });
    if (log && !log.method) {
      const update_log = await log.update(payment_log_data, { transaction: t });
    } else {
      const create_log = await sequelize.models.Store_payment_log.create(
        payment_log_data,
        { transaction: t }
      );
    }

    // ################################ Signature Check End  #################################
    // //console.log(order_id, amount)
    await createTransaction({
      sequelize,
      purpose: transaction.purpose.PURCHASE,
      amount: amount,
      mode: transaction.mode.MONEY,
      StoreUserId: user.id,
      transaction: t,
      txn_type: transaction.txn_type.CREDIT,
    });

    await adminTransaction({
      subdomain: req.subdomain,
      purpose: transaction.purpose.PURCHASE,
      amount: amount,
      mode: transaction.mode.MONEY,
      txn_type: transaction.txn_type.CREDIT,
    });

    const [rows, [order]] = await sequelize.models.Order.update(
      {
        is_paid: true,
        payment_id: order_id,
        is_cod_paid:
          getOrder.payment_mode === "COD" && getOrder.is_paid === true
            ? true
            : false,
      },
      {
        where: { payment_order_id: order_id },
        returning: true,
        transaction: t,
      }
    );

    const [rowsCunt, orderVariant] =
      await sequelize.models.Order_variant.update(
        { status: order_status.NEW },
        {
          where: { OrderId: order.id },
          transaction: t,
          returning: true,
          // raw: true,
        }
      );

    for (const ov of orderVariant) {
      await sequelize.models.Variant.decrement(
        { quantity: ov.quantity },
        {
          where: { id: ov.VariantId },
          transaction: t,
        }
      );
    }

    const htmlContent = fs.readFileSync("./views/orderTemplate.ejs", "utf8");
    const renderedContent = ejs.render(htmlContent, {
      name: user.name,
      price: 200,
      slug: "hsf",
      discount: 10,
    });

    if (user.email) {
      mailSender({
        to: user.email,
        subject: "Order Placed",
        html: renderedContent,
      });
    }

    // // ################### Code to Create Order Tracker entry ############# //

    const orderVariantIds = orderVariant.map((variant) => {
      return variant.id;
    });

    const orderVariants = await sequelize.models.Order_variant.findAll({
      where: { id: { [Op.in]: orderVariantIds } },
      include: [{ model: sequelize.models.Variant, as: "variant" }],
    });

    const ProductIds = orderVariants.map((item) => {
      return item.variant.ProductId;
    });

    await createActivityLog({
      sequelize: sequelize,
      StoreUserId: user.id,
      event: activity_event.ORDER_PLACED,
      transaction: t,
    });
    await orderTracker({
      sequelize,
      order_variant_ids: orderVariantIds,
      status: order_status.NEW,
      transaction: t,
    });

    await tenantMetric({
      subdomain: req.subdomain,
      field_name: tenant_metric_fields.total_orders,
    });
    await tenantMetric({
      subdomain: req.subdomain,
      field_name: tenant_metric_fields.total_transaction,
    });
    await productMetrics({
      sequelize,
      transaction: t,
      field_name: product_metric_field.revenue_generated,
      order_variant: orderVariants,
    });

    await productMetrics({
      sequelize,
      field_name: product_metric_field.ordered_count,
      product_id: ProductIds,
      transaction: t,
    });

    const users = await sequelize.models.Store_user.findAll({
      attributes: ["phone"],
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Consumer" },
          attributes: [],
        },
      ],
    });
    const phoneNumbers = JSON.parse(JSON.stringify(users)).map(
      (item) => item.phone
    );

    const data = {
      // containsImage: true, body: [order.consumer_name, "1299"], hasButton: false, phoneNumber: order.consumer_phone,
      containsImage: true,
      body: [order.consumer_name, "1299"],
      hasButton: false,
      phoneNumber: order.consumer_phone ?? user.phone,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D",
    };
    IntraktNotify(data, sequelize, "ORDER");
    await t.commit();

    return res.redirect(
      `https://${req.subdomain}.socialseller.in/paymentSuccess`
    );
    // return res.status(200).send({ success: true, data: orderVariants });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};
