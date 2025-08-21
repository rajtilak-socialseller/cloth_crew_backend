// Controller function to create a new post
const { uid } = require("uid");

const jwt = require("../../../services/jwt");
const crypto = require("crypto");
const { getPagination, getMeta } = require("../../../services/pagination");

// firebase credentials

const getWebhookBody = require("../services/getWebhookBody");
const payment_log = require("../../payment_log/models/payment_log");
const orderBy = require("../../../services/orderBy");
const { razorpay, defaultRazorpay, getRazorpay } = require("../../../utils/gateway");
const { default: axios } = require("axios");
const { errorResponse, tokenError } = require("../../../services/errorResponse");
const { getDate, getValidToDates, updatetValidToDates } = require("../../../services/date");
const { adminTransaction, createTransaction } = require("../../../services/createTrnx");
const transaction = require("../../../constants/transaction");
const { createActivityLog } = require("../../../services/createActivityLog");
const { activity_event } = require("../../../constants/activity_log");
const dbCache = require("../../../utils/dbCache");
const dbConnection = require("../../../utils/dbConnection");
const { IntraktNotify } = require("../../../services/notification");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const body = req.body;
    const valid_from = getDate();
    const plan = await sequelize.models.Store_plan.findByPk(body.plan_id);
    if (!plan) {
      return res.status(400).send(
        errorResponse({
          message: "Invalid Plan Id",
        })
      );
    }
    const valid_to = getValidToDates(Number(plan.validity));
    const subscription = await sequelize.models.Store_subscription.create({
      order_id: `OID_${uid(10)}`,
      payment_id: `PID_${uid(10)}`,
      valid_from: valid_from,
      valid_to: valid_to,
      PlanId: body.plan_id,
      status: "ACTIVE",
      purchaseType: "CASH",
      amount: plan.price,
      StoreUserId: body.StoreUserId,
    });

    const storeUser = await sequelize.models.Store_user.findOne({
      where: { id: body.StoreUserId },
      include: ["wallets"],
    });

    if (!storeUser.sign_in_bonus) {
      const wallet = await sequelize.models.Wallet.create(
        {
          StoreUserId: storeUser.id,
          amount: 500,
          transaction_type: "DEBIT",
          remark: "500 Bonus Added to Wallet",
        },
        { transaction: t }
      );

      await storeUser.increment(
        { wallet_balance: 500 },
        { where: { id: body.StoreUserId } },
        { transaction: t }
      );

      await storeUser.update(
        { sign_in_bonus: true },
        { where: { id: body.StoreUserId }, transaction: t }
      );

      await createTransaction({
        sequelize,
        purpose: "ADDED_TO_WALLET",
        amount: 500,
        mode: "WALLET",
        StoreUserId: body.StoreUserId,
        transaction: t,
        txn_type: "DEBIT",
      });
    }
    await t.commit();
    return res.status(200).send(subscription);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create a subscription" });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
// Controller function to get all posts
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const order = orderBy(query);
    const pagination = await getPagination(query.pagination);
    const whereClause = {};

    if (query.hasOwnProperty("purchaseType") && ["ONLINE", "CASH"].includes(query.purchaseType)) {
      whereClause.purchaseType = query.purchaseType;
    }
    if (query.hasOwnProperty("is_paid")) {
      query.is_paid === "true" ? (whereClause.is_paid = true) : query.is_paid === "false" ? (whereClause.is_paid = false) : "";
    }

    const subscriptions = await sequelize.models.Store_subscription.findAndCountAll({
      where: whereClause,
      limit: pagination.limit,
      offset: pagination.offset,
      order: order,
      include: [
        {
          model: sequelize.models.Store_user, as: "store_user",
          attributes: ["id", "name", "email", "phone"],
          include: ["avatar"]
        },
        "plan"
      ]
    });

    const meta = await getMeta(pagination, subscriptions?.count);

    return res.status(200).send({ data: subscriptions?.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch subscriptions" });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const subscription = await sequelize.models.Store_subscription.findByPk(id, { include: { model: sequelize.models.Store_plan, as: "plan" } });
    if (!subscription) return res.status(400).send(errorResponse({ message: "Invalid Subscription ID" }));
    return res.status(200).send(subscription);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch subscription" });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.usersSubsctions = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req)
    if (token.error) {
      return res.status(401).send(tokenError(token))
    }
    const subscriptions = await sequelize.models.Store_subscription.findAll({ where: { StoreUserId: token.id }, include: { model: sequelize.models.Store_plan, as: "plan" } });
    if (!subscriptions) return res.status(400).send(errorResponse({ message: "Invalid Subscription ID" }));
    return res.status(200).send({ data: subscriptions });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch subscription" });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getsubscription = await sequelize.models.Store_subscription.findByPk(id);

    if (!getsubscription) return res.status(400).send(errorResponse({ message: "Invalid Subscription ID" }));
    const subscription = await sequelize.models.Store_subscription.update(req.body, {
      where: { id },
      returning: true,
    });
    return res.status(200).send({ message: "subscription updated successfully!", data: subscription[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch subscription" });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getsubscription = await sequelize.models.Store_subscription.findByPk(id);

    if (!getsubscription) return res.status(400).send(errorResponse({ message: "Invalid ID to delete" }));
    const subscription = await sequelize.models.Store_subscription.destroy({ where: { id } });
    return res.status(200).send({ message: "subscription deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch subscription" });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.checkOut = async (req, res) => {
  try {
    //console.log("entered in checkout");
    const sequelize = req.db;
    const body = req.body;
    const plan = await sequelize.models.Store_plan.findByPk(body.plan_id);
    const store_global = await sequelize.models.Store_global.findOne({ raw: true });

    const GATEWAY = store_global.selected_payment_gateway;
    const amount = Number(plan.price);
    const options = {
      amount: Number(amount * 100),
      currency: "INR",
      receipt: "RCT" + require("uid").uid(10).toUpperCase(),
    };

    const token = jwt.verify(req);
    const createSubscription = async (order) => {
      //console.log("entered create subscription")
      try {
        const valid_from = getDate();
        const valid_to = getValidToDates(plan.validity);
        if (req.existing_sub) {
          //console.log("user has existing subscription");
          const subscription = await sequelize.models.Store_subscription.create({
            order_id: order.id || order,
            order_type: body.order_type,
            valid_from: req.valid_from,
            valid_to: updatetValidToDates(plan.validity, req.valid_from),
            PlanId: body.plan_id,
            amount: amount,
            purchaseType: "ONLINE",
            StoreUserId: token.id,
          });
          //console.log(subscription);
        } else {
          //console.log("user has not existing subscription");

          const subscription = await sequelize.models.Store_subscription.create({
            order_id: order.id || order,
            order_type: body.order_type,
            valid_from: valid_from,
            valid_to: valid_to,
            PlanId: body.plan_id,
            purchaseType: "ONLINE",
            StoreUserId: token.id,
          });
          //console.log(subscription);

        }
      } catch (error) {
        console.log(error);
        return error;
      }
    };


    const razorpay = await getRazorpay({ razorpay_key: store_global.razorpay_key, razorpay_secret: store_global.razorpay_secret });
    switch (GATEWAY) {
      case "NONE":
        // main db payment gateway
        const subscription = razorpay.orders.create(options, async function (error, order) {
          //console.log(order);
          if (error) {
            return res.status(error.statusCode).send(
              errorResponse({
                status: error.statusCode,
                message: error.error.reason,
                details: error.error.description,
              })
            );
          }
          await createSubscription(order);
          return res.status(200).send({ data: order });
        });
        break;
      case "RAZORPAY":
        const prePaidSubscription = razorpay.orders.create(options, async function (error, order) {
          //console.log(order);
          if (error) {
            return res.status(error.statusCode).send(
              errorResponse({
                status: error.statusCode,
                message: error.error.reason,
                details: error.error.description,
              })
            );
          }
          await createSubscription(order);
          return res.status(200).send({ data: order });
        });
        break;
      case "CASHFREE":
        const user = await sequelize.models.Store_user.findByPk(token.id);
        const uuid = uid(10);
        const order_id = `CFPG_${uuid}`;
        const response = await axios.post(
          "https://sandbox.cashfree.com/pg/orders",
          {
            customer_details: {
              customer_id: "7112AAA812234",
              customer_phone: "9908734801",
              customer_email: user.email,
            },
            order_meta: {
              return_url: `http://localhost:4500/api/subscriptions/cf-verify?order_id=${order_id}`,
              notify_url: "http://localhost:4500/api",
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
        // Create a subscription
        await createSubscription(order_id);
        return res.status(200).send({ data: data });

        break;
      case "PHONEPE":
        break;

      default:
        break;
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch subscription" });
  }
};
/**
 *
 * @param {Object} req
 * @param {import("sequelize").Sequelize} req.db
 * @param {import("express").Response} res
 */
exports.verify = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;

    const token = jwt.verify(req);
    const body = req.body;
    const store_global = await sequelize.models.Store_global.findOne({ raw: true });
    const { razorpay_signature, razorpay_payment_id, razorpay_order_id } = body;
    const razorpay_OP_id = razorpay_order_id + "|" + razorpay_payment_id;
    const razorpay = await getRazorpay({ razorpay_key: store_global.razorpay_key, razorpay_secret: store_global.razorpay_secret });

    const generateSignature = crypto.createHmac("sha256", store_global.razorpay_secret).update(razorpay_OP_id.toString()).digest("hex");
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    if (generateSignature !== razorpay_signature) {
      return res.status(400).send(
        errorResponse({
          message: "Bad Request!",
          details: "razorpay_signature and generated signature did not matched!",
        })
      );
    }
    const [count, [subscription]] = await sequelize.models.Store_subscription.update(
      {
        is_paid: true,
        payment_id: razorpay_payment_id,
        status: "ACTIVE",
      },
      {
        where: { order_id: razorpay_order_id },
        returning: true,
        transaction: t
      },
    );

    const plan = await sequelize.models.Store_plan.findByPk(subscription.PlanId)


    // const token =
    //   "dDQ53sEPIHr6Wu5TUvxX5M:APA91bHlYmCT6Veoukmk_AozLrtYRegqhtPZIVHYtz8OeclbTp9jTTCrjuR20orkmAOa9P1yGom4hvfpPgOoDWOsHMr-XHhaftEYUKHfvdzI6oWxwhJrwM_4TuhJAQdD31YPewmC8kiP";
    // const message = {
    //   notification: {
    //     title: "Subscription Purchased successfullY!",
    //     body: "Your subscription has been created successfully , now you can enjoy premium benifits",
    //   },
    //   token,
    // };
    // const sendMessage = await firebaseAdmin.messaging().send(message)
    // //console.log(sendMessage)
    await createTransaction(
      {
        sequelize,
        purpose: transaction.purpose.PURCHASE,
        amount: razorpayOrder.amount,
        mode: transaction.mode.MONEY,
        StoreUserId: token.id,
        transaction: t,
        txn_type: transaction.txn_type.CREDIT,
      },
      { transaction: t }
    );
    await createActivityLog({
      sequelize,
      event: activity_event.SUBSCRIPTION_ADDED,
      StoreUserId: token.id,
      transaction: t,
    });

    const users = await sequelize.models.Store_user.findOne({
      where: { id: token.id },
      attributes: ["phone"],
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Consumer" }, attributes: []
        }]
    })

    const data = {
      containsImage: true, body: [`Plan Name - ${plan.name}`, subscription.amount], hasButton: false, phoneNumber: users.phone,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D"
    }
    IntraktNotify(data, sequelize, "SUBSCRIPTION")
    await t.commit();
    return res.status(200).send({ message: "Transaction Successful!", data: subscription });
  } catch (error) {
    await t.rollback()
    console.log(error);
    return res.status(500).send(error);
  }
};
exports.CFVerify = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const body = req.body;
    const orderId = req.query.order_id;
    const response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${orderId}`, {
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
      },
    });

    const cashfree = response.data;
    //console.log(cashfree);
    if (cashfree.order_status === "PAID") {
      const subscription = await sequelize.models.Store_subscription.update(
        {
          is_paid: true,
          payment_id: cashfree.payment_session_id,
          status: "ACTIVE",
        },
        {
          where: { order_id: cashfree.order_id },
        }
      );
      return res.status(200).send(errorResponse({ message: "subscription purchased successfully!" }));
    } else {
      return res.status(200).send(errorResponse({ message: "Invalid Request!" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.refund = async (req, res) => {
  try {
    const subscription = req.body.subscription;
    //console.log(subscription);
    const refund = await razorpay.payments.refund(subscription.payment_id, { amount: subscription.plan.price * 100, speed: "normal" });
    if (refund) {
      const updateSubsciption = await sequelize.models.Store_subscription.update(
        { status: "REFUNDED" },
        { where: { id: subscription.id } }
      );
    }
    return res.status(200).send({ message: "Refund Created", data: refund, subscription });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.webhook = async (req, res) => {
  try {
    const body = req.body;
    const sequelize = req.db;
    //console.log("web hook");
    const hookSignature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRETE);
    hookSignature.update(JSON.stringify(req.body));
    const digest = hookSignature.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).send({ error: "Invalid Request!" });
    }

    const webHookBody = await getWebhookBody(req);
    const payment_log = sequelize.models.Store_payment_log.create(webHookBody);
    return res.status(200).send("ok");
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
exports.CFWebhook = async (req, res) => {
  try {
    const sequelize = req.db;
    const ts = req.headers["x-webhook-timestamp"];
    const signature = req.headers["x-webhook-signature"];
    const currTs = Math.floor(new Date().getTime() / 1000);

    if (currTs - ts > 30000) {
      return res.status(400).send(errorResponse({ message: "Invalid Request!" }));
    }

    const tsBody = ts + rawBody;
    const secretKey = process.env.CASHFREE_CLIENT_SECRET;
    let genSignature = crypto.createHmac("sha256", secretKey).update(tsBody).digest("base64");

    if (signature === genSignature) {
      //console.log("signature is verified");
      const webHookBody = await getWebhookBody(req);
      const payment_log = await sequelize.models.Store_payment_log.create(webHookBody);
      return res.status(200).send("OK");
    } else {
      return res.status(400).send(errorResponse({ message: "Invalid Request!" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
};

exports.SF_checkOut = async (req, res) => {
  try {
    const sequelize = req.db;

    const subscription_type = req.body.subscription_type;
    const prices = {
      monthly_server_price: 999,
      half_yearly_server_price: 4999,
      yearly_server_price: 5999
    }
    if (!subscription_type || !['monthly_server_price', 'half_yearly_server_price', 'yearly_server_price'].includes(subscription_type)) {
      return res.status(400).send(errorResponse({ message: "invalid subsciption type" }))
    }
    // to do server fee
    const options = {
      amount: Number(prices[subscription_type] * 100),
      currency: "INR",
      receipt: req.subdomain + "/" + require("uid").uid(10).toUpperCase(),
    };

    const createSubscription = async (order) => {
      try {
        const valid_from = getDate();
        const valid_to = getValidToDates(subscription_type === "monthly_server_price" ? 30 : 365);
        const subscription = await sequelize.models.Store_server_subscription.create({
          order_id: order.id || order,
          valid_from: valid_from,
          valid_to: valid_to,
          purchaseType: "ONLINE",
          // StoreUserId: ,
          amount: prices[subscription_type]
        });
      } catch (error) {
        console.log(error);
      }
    };


    const razorpay = (await defaultRazorpay()).instance;
    const credentials = (await defaultRazorpay()).credential
    const prePaidSubscription = razorpay.orders.create(options, async function (error, order) {
      if (error) {
        return res.status(error.statusCode).send(
          errorResponse({
            status: error.statusCode,
            message: error.error.reason,
            details: error.error.description,
          })
        );
      }
      await createSubscription(order);
      return res.status(200).send({ data: order, key_id: credentials.razorpay_key });
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch subscription" });
  }
};

exports.SF_verify = async (req, res) => {
  try {
    const tenant_sequelize = req.db;
    // const sequelize = await dbConnection(null);
    const token = jwt.verify(req);
    const body = req.body;
    const { razorpay_signature, razorpay_payment_id, razorpay_order_id } = body;
    const razorpay_OP_id = razorpay_order_id + "|" + razorpay_payment_id;
    const razorpay_secret = (await defaultRazorpay()).credential.razorpay_secret;
    const generateSignature = crypto.createHmac("sha256", razorpay_secret).update(razorpay_OP_id.toString()).digest("hex");
    const razorpay = (await defaultRazorpay()).instance;
    if (generateSignature !== razorpay_signature) {
      //console.log("sign mismatch");
      return res.status(400).send(
        errorResponse({
          message: "Bad Request!",
          details: "razorpay_signature and generated signature did not matched!",
        })
      );
    }
    //console.log("signature verified!");
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const [rows_count, [subscription]] = await tenant_sequelize.models.Store_server_subscription.update(
      {
        is_paid: true,
        payment_id: razorpay_payment_id,
        status: "ACTIVE",
        amount: order.amount / 100,
      },
      {
        where: { order_id: razorpay_order_id },
        returning: true,
        raw: true,
      }
    );

    await adminTransaction({
      tenant_sequelize: tenant_sequelize,
      subdomain: req.subdomain,
      amount: order.amount / 100,
      mode: transaction.mode.MONEY,
      purpose: transaction.purpose.PURCHASE,
      txn_type: transaction.txn_type.CREDIT,
    });
    return res.status(200).send({ message: "Transaction Successful!", data: subscription });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

exports.serverFeeSubscription = async (req, res) => {
  try {
    // const tenant_sequelize = req.db;
    // const sequelize = dbCache.get("main_instance");
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(req.pagination);
    const whereClause = {};

    if (query.hasOwnProperty("purchaseType")) {
      whereClause.purchaseType = query.purchaseType;
    }
    if (query.hasOwnProperty("status")) {
      whereClause.status = query.status;
    }
    const feeSubscriptions = await sequelize.models.Store_server_subscription.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      where: whereClause,
    });
    const meta = await getMeta(pagination, feeSubscriptions.count);
    return res.status(200).send({ data: feeSubscriptions.rows, meta });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch subscription" });
  }
};
