const { getPagination, getMeta } = require("../../../services/pagination");

// Controller function to create a new post
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

const { errorResponse } = require("../../../services/errorResponse");
const { createActivityLog } = require("../../../services/createActivityLog");
const { activity_event } = require("../../../constants/activity_log");
const { mode, purpose, txn_type } = require("../../../constants/transaction");
const { createTransaction, adminTransaction } = require("../../../services/createTrnx");
const orderBy = require("../../../services/orderBy");
const tenantMetric = require("../../../services/tenantMetric");
const { tenant_metric_fields } = require("../../../constants/tenant_metric");
const jwt = require("../../../services/jwt");
const { default: axios } = require("axios");
const { IntraktNotify } = require("../../../services/notification");

exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const { StoreUserId, amount, remark } = req.body;
    const storeUser = await sequelize.models.Store_user.findOne({
      where: { id: StoreUserId },
      include: ["wallets"],
    });
    const wallet = await sequelize.models.Wallet.create(
      {
        StoreUserId: storeUser.id,
        amount: amount,
        transaction_type: "DEBIT",
        remark,
      },
      { transaction: t }
    );

    const data = {
      containsImage: true, body: ["order.consumer_name", "1299"], hasButton: false, phoneNumber: storeUser.phone,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D"
    }
    IntraktNotify(data, sequelize, "ORDER")

    await storeUser.increment({ wallet_balance: amount }, { where: { id: StoreUserId } }, { transaction: t });

    await createActivityLog({ sequelize, StoreUserId, event: activity_event.WALLET_DEBIT, transaction: t });
    await createTransaction({
      sequelize,
      purpose: purpose.ADDED_TO_WALLET,
      amount,
      mode: mode.WALLET,
      StoreUserId,
      transaction: t,
      txn_type: txn_type.DEBIT,
    });
    await adminTransaction({ subdomain: req.subdomain, purpose: purpose.ADDED_TO_WALLET, mode: mode.MONEY, amount: amount, txn_type: txn_type.CREDIT })
    tenantMetric({ subdomain: req.subdomain, field_name: tenant_metric_fields.total_transaction });
    await t.commit();
    return res.status(200).send({ data: wallet });
  } catch (error) {
    await t.rollback()
    console.log(error);
    return res.status(500).send({ error: 'Failed to create a wallet' });
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
    const pagination = await getPagination(query.pagination);
    const wallets = await sequelize.models.Wallet.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: sequelize.models.Store_user, as: "store_user",
          attributes: ["id", "name", "email", "phone"],
          include: ["avatar"]
        }
      ],
    });
    const meta = await getMeta(pagination, wallets.count);
    return res.status(200).send({ data: wallets.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Failed to fetch wallets' });
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
    const wallet = await sequelize.models.Wallet.findByPk(id);
    if (!wallet) {
      return res.status(404).send(errorResponse({ status: 404, message: "Wallet with id not found!" }));
    }
    return res.status(200).send({ data: wallet });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Failed to fetch wallet' });
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
    const getwallet = await sequelize.models.Wallet.findByPk(id);

    if (!getwallet) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const wallet = await sequelize.models.Wallet.update(req.body, { where: { id }, returning: true });
    return res.status(200).send({ message: "wallet updated", data: wallet[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Failed to fetch wallet' });
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
    const getwallet = await sequelize.models.Wallet.findByPk(id);

    if (getwallet) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const wallet = await sequelize.models.Wallet.destroy({ where: { id } });
    return res.status(200).send({ message: "wallet deleted!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Failed to fetch wallet' });
  }
};

exports.withdraw = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req)
    const body = req.body;
    let fund_account

    const global = await sequelize.models.Store_global.findOne();
    const storeUser = await sequelize.models.Store_user.findByPk(token.id, { raw: true })
    if (global.dataValues.selected_payment_gateway === "NONE") {
      return res.status(400).send(errorResponse({ message: "you can not withdraw wallet money , please use them for purchase" }))
    }

    if (body.mode === "upi") {
      fund_account = {
        "account_type": "vpa",
        "vpa": {
          "address": body.upi_address
        },
      }
    } else {
      fund_account = {
        "account_type": "bank_account",
        "bank_account": {
          "name": storeUser.name,
          "ifsc": body.ifsc,
          "account_number": body.account_number
        },

      }
    }

    const data = {
      "account_number": global.razorpayX_account_number,
      "amount": body.amount * 100,
      "currency": "INR",
      "mode": body.mode === "upi" ? "UPI" : "NEFT",
      "purpose": "refund",
      "fund_account": {
        ...fund_account,
        contact: {
          name: storeUser.name,
          contact: storeUser.phone,
          "notes": {
            "notes_key_1": "Wallet Payout",
            "notes_key_2": "Wallet Payout."
          }
        }
      },

      "queue_if_low_balance": true,
      "notes": {
        "notes_key_1": "Account withdrawal",
        "notes_key_2": "Account withdrawal"
      }
    }

    const user = await sequelize.models.Store_user.findByPk(token.id, { attributes: ["wallet_balance", "id"] })

    if (!user.wallet_balance > body.amount && global.withdraw_limit < body.amount) {
      return res.status(400).send(errorResponse({ message: global.withdraw_limit < body.amount ? `amount must be lower or equal to ${global.withdraw_limit}` : "Insufficient Wallet Balance" }))
    }

    const tranx = await createTransaction({ sequelize, amount: body.amount, mode: mode.WALLET, purpose: purpose.PURCHASE, StoreUserId: token.id, transaction: t, txn_type: txn_type.DEBIT })

    const username = global.razorpay_key
    const password = global.razorpay_secret
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    const authHeader = `Basic ${credentials}`;
    let payout
    try {
      payout = await axios.post("https://api.razorpay.com/v1/payouts", data, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json"
        }
      })
    } catch (error) {
      await t.rollback()
      //console.log(error.response.data)
      return res.status(500).send(error.response.data)
    }

    const payout_log = await sequelize.models.Payout_log.create({
      payout_id: payout.data.id,
      fund_account_id: payout.data.fund_account_id,
      account_type: payout.data.fund_account.account_type,
      amount: payout.data.amount / 100,
      currency: payout.data.currency,
      mode: payout.data.mode,
      purpose: payout.data.purpose,
      vpa: (body.mode === "upi" ? payout.data.fund_account.vpa.address : null),
      name: payout.data.fund_account.contact.name,
      contact: payout.data.fund_account.contact.contact,
      contact_id: payout.data.fund_account.contact.id,
      status: payout.data.status,
      reference_id: payout.data.reference_id,
      fund_account_id: payout.data.fund_account_id,
      fund_account_contact_id: payout.data.fund_account.contact.id,
      fund_bank_account_ifsc: (body.mode === "bank" ? payout.data.fund_account.bank_account.ifsc : null),
      fund_bank_account_number: (body.mode === "bank" ? payout.data.fund_account.bank_account.account_number : null),
      fund_bank_name: (body.mode === "bank" ? payout.data.fund_account.bank_account.bank_name : null),
      StoreUserId: token.id
    })

    const data_notify = {
      containsImage: true, body: ["order.consumer_name", "1299"], hasButton: false, phoneNumber: user.phone,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D"
    }
    IntraktNotify(data_notify, sequelize, "PAYOUT")

    await sequelize.models.Store_user.increment({ wallet_balance: - body.amount }, { where: { id: user.dataValues.id } })
    await t.commit()
    return res.status(200).send({
      message: "withdrawal successfull!", data: {
        amount: payout_log.amount,
        status: payout_log.status, fund_account
      }
    })

  } catch (error) {
    await t.rollback()
    //console.log(error)
    return res.status(500).send(error)
  }
}
exports.webHook = async (ctx) => {
  try {
    const body = ctx.request.body

    const secret = "secret123";
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(ctx.request.body));
    const digest = shasum.digest("hex");

    const rzp_signature = ctx.request.headers["x-razorpay-signature"];

    if (digest === rzp_signature) {
      const payoutLog = await strapi.db.query("api::payout-log.payout-log").update({
        data: {
          status: body.payload.payout.entity.status
        }, where: {
          payout_id: body.payload.payout.entity.id
        }
      })
      return ctx.send("OK", 200)

    }

  } catch (error) {
    //console.log(error)
    return ctx.send(error, 500)
  }
}
