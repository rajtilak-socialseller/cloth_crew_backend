// Controller function to create a new post

const { Op } = require("sequelize");
const { tokenError, errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { default: axios } = require("axios");
const { defaultRazorpay } = require("../../../utils/gateway");
const transaction = require("../../../constants/transaction");
const { adminTransaction } = require("../../../services/createTrnx");
const crypto = require("crypto")
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const getglobal = await sequelize.models.Store_global.findAll();

    if (getglobal.length !== 0) {
      const { store_type, ...updatePayload } = req.body;

      const updateGLobal = await sequelize.models.Store_global.update(updatePayload, {
        where: { id: getglobal[0].id },
        returning: true,
      });

      return res.status(200).send({ message: "global updated", data: updateGLobal[1][0] });
    } else {
      const global = await sequelize.models.Store_global.create(req.body);
      return res.status(200).send({ message: "Global Created Successfully", data: global });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create/update the global" });
  }
};
/**
 * 
 * @param {Object} req 
 * @param {import("sequelize").Sequelize} req.db 
 * @returnsimport { RedisFunction } from './../../../../node_modules/@redis/client/dist/lib/commands/index.d';
 
 */
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const global = await sequelize.models.Store_global.findOne();
    // const spayGlobal = await axios.get("https://api.spay.hangs.in/api/global")
    // const server_fee = spayGlobal.data.data.attributes.client_server_subscription_price
    const server_fee = 999
    const currentDate = new Date();
    const serverSubscriptions = await sequelize.models.Store_server_subscription.update({ status: "EXPIRED" }, {
      where: { status: "ACTIVE", valid_to: { [Op.lt]: currentDate } },
    })
    const server_subscriptions = await sequelize.models.Store_server_subscription.findAll({ where: { status: "ACTIVE" }, order: [["valid_to", "asc"]] })
    const registered_date = new Date(global.createdAt);
    const now = new Date();

    const diffTime = Math.abs(now - registered_date); // Difference in milliseconds
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

    let Ssend = false;
    if (diffDays > 30) {
      Ssend = (server_subscriptions && server_subscriptions.length ? server_subscriptions[0] : false)
    } else {
      Ssend = true
      console.log(true);
    }
    return res.status(200).send({ data: { ...global.dataValues, server_subscription: Ssend, server_fee } })

  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Failed to fetch globals" });
  }
};

exports.buyMSG = async (req, res) => {
  try {
    const body = req.body;
    const messages = body.message_qty ?? 100
    // to do server fee
    const options = {
      amount: Number(messages * 20),
      currency: "INR",
      receipt: req.subdomain + "/" + require("uid").uid(10).toUpperCase(),
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
      // await createSubscription(order);
      return res.status(200).send({ data: order, key_id: credentials.razorpay_key });
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch subscription" });
  }
};

exports.bugMSGverify = async (req, res) => {
  try {
    const sequelize = req.db;
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

    const messages = order.amount / 20
    const storeGlobal = await sequelize.models.Store_global.findOne();
    storeGlobal.msg_balance = messages;
    await storeGlobal.save();

    await adminTransaction({
      sequelize: sequelize,
      subdomain: req.subdomain,
      amount: order.amount / 100,
      mode: transaction.mode.MONEY,
      purpose: transaction.purpose.PURCHASE,
      txn_type: transaction.txn_type.CREDIT,
    });
    return res.status(200).send({ message: "Transaction Successful!", data: storeGlobal });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};