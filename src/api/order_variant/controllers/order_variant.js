// ordersController.js
const { getPagination, getMeta } = require("../../../services/pagination");
const { tokenError, errorResponse } = require("../../../services/errorResponse");
const { makeOrderVariantBody } = require("../services/order_variant");
const jwt = require("../../../services/jwt");
const order = require("../../../constants/order");
const orderBy = require("../../../services/orderBy");
const { order_status } = require("../../../constants/order_status");
const { createActivityLog } = require("../../../services/createActivityLog");
const { activity_event } = require("../../../constants/activity_log");
const orderTracker = require("../../../services/orderTracker");
const excelExport = require("../../../services/excelExport");
const { request } = require("express");
const { Op } = require("sequelize");

// ordersController.js

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const order_by = orderBy(query)
    const pagination = await getPagination(query.pagination);
    const whereClause_OV = {};
    const whereClause_O = {};
    if (query.hasOwnProperty("status")) {
      if (query.status.toLowerCase() === "all") {
      } else if (!Object.values(order.order_status).includes(query.status)) {
        return res.status(400).send(errorResponse({ message: `Invalid status type select from ${Object.values(order.order_status)}` }));
      } else {
        whereClause_OV.status = query.status;
      }
    }
    if (query.hasOwnProperty("payment_mode")) {
      if (!Object.values(order.payment_modes).includes(query.payment_mode)) {
        return res.status(400).send(errorResponse({ message: `Invalid Payment Mode Type select from ${Object.values(order.payment_modes)}` }));
      }
      whereClause_O.payment_mode = query.payment_mode;
    }
    if (query.hasOwnProperty("reseller_order")) {
      query.reseller_order === "true" ? (whereClause_O.is_reseller_order = true) : query.reseller_order === "false" ? (whereClause_O.is_reseller_order = false) : "";
    }
    const order_variants = await sequelize.models.Order_variant.findAndCountAll({
      where: whereClause_OV,
      order: order_by,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variant",
          include: ["thumbnail", { model: sequelize.models.Product, as: "product", include: ["thumbnail"], attributes: ["id", "name"] }],
        },
        {
          model: sequelize.models.Order,
          as: "order",
          where: {
            ...whereClause_O, [Op.or]: [
              { payment_mode: "COD" },
              { is_paid: true }
            ]
          },
        },
      ],
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, order_variants.count);

    return res.status(200).send({
      data: order_variants.rows,
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

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;

    const createdOrderVariant = await OrderVariant.create(req.body);

    return res.status(201).send({
      message: "Order variant created successfully!",
      data: createdOrderVariant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const orderVariant = await sequelize.models.Order_variant.findByPk(id, {
      include: [
        "custom_couriers",
        "shipRocketOrderItem",
        "status_tracker",
        {
          model: sequelize.models.Variant,
          as: "variant",
          include: ["thumbnail", { model: sequelize.models.Product, as: "product", attributes: ["id", "name"] }],
        },
        {
          model: sequelize.models.Order,
          as: "order",
          include: ["address",
            { model: sequelize.models.Store_user, as: "store_user", attributes: { execlude: ["password"] } }],
        },

      ],
    });

    if (!orderVariant) {
      return res.status(400).send(errorResponse({ status: 400, message: "Order not found" }));
    }

    return res.status(200).send({
      data: orderVariant
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findOneStoreUser = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const token = jwt.verify(req)

    const orderVariant = await sequelize.models.Order_variant.findByPk(id, {
      include: [
        {
          model: sequelize.models.Custom_courier,
          as: "custom_couriers",
        },
        {
          model: sequelize.models.Ship_rocket_orderitem,
          as: "shipRocketOrderItem",
        },
        {
          model: sequelize.models.Variant,
          as: "variant",
          include: [
            {
              model: sequelize.models.Product,
              as: "product",
              include: ["category", "sub_category", "thumbnail", "gallery"]
            },
            "thumbnail",
            "gallery", "bulk_pricings"]
        },
        {
          model: sequelize.models.Order,
          where: { StoreUserId: token.id },
          as: "order",
          include: ["address"]
        },

      ],
    });

    // const orderVariantResponse = await makeOrderVariantBody(orderVariant, order_status_trackers);
    return res.status(200).send({
      data: orderVariant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const orderVariantId = req.params.id;

    const [updatedRowsCount, updatedOrderVariant] = await OrderVariant.update(req.body, {
      where: { id: orderVariantId },
      returning: true,
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send(errorResponse({ message: "Order variant not found" }));
    }

    return res.status(200).send({
      message: "Order variant updated successfully!",
      data: updatedOrderVariant[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const orderVariantId = req.params.id;

    const deletedRowCount = await OrderVariant.destroy({
      where: { id: orderVariantId },
    });

    if (deletedRowCount === 0) {
      return res.status(404).send(errorResponse({ message: "Order variant not found" }));
    }

    return res.status(200).send({
      message: "Order variant deleted successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findByOrderId = async (req, res) => {
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const orderId = req.params.id;

    const orderVariants = await OrderVariant.findAll({
      where: { OrderId: orderId },
    });

    if (!orderVariants) {
      return res.status(400).send(errorResponse({ status: 400, message: "Order is not found" }));
    }

    return res.status(200).send({
      message: `All order variants for OrderId ${orderId} retrieved successfully`,
      data: orderVariants,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.updateReturnStatus = async (req, res) => {
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const orderId = req.params.orderId;
    const variantId = req.params.variantId;

    const orderVariant = await OrderVariant.findOne({
      where: { OrderId: orderId, VariantId: variantId },
    });

    if (!orderVariant) {
      return res.status(404).send(errorResponse({ message: "Order variant not found" }));
    }

    await orderVariant.update({ status: "RETURN_REQUEST" });

    return res.status(200).send({
      message: "Return status updated successfully!",
      data: orderVariant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.storeUserOrders = async (req = request, res) => {
  try {
    //console.log("entering search");
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    let user_id;
    if (query.hasOwnProperty("user") && query.user) {
      user_id = query.user;
    } else {
      const token = jwt.verify(req);
      if (token.error) {
        return res.status(401).send(tokenError(token))
      }
      user_id = token.id;
    }

    const whereClause_OV = {}
    const whereClause_O = {}

    if (query.hasOwnProperty("status")) {
      if (query.status.toLowerCase() === "all") {
      } else if (!Object.values(order.order_status).includes(query.status)) {
        return res.status(400).send(errorResponse({ message: `Invalid status type select from ${Object.values(order.order_status)}` }));
      } else {
        whereClause_OV.status = query.status;
      }
    }
    if (query.hasOwnProperty("payment_mode")) {
      if (!Object.values(order.payment_modes).includes(query.payment_mode)) {
        return res.status(400).send(errorResponse({ message: `Invalid Payment Mode Type select from ${Object.values(order.payment_modes)}` }));
      }
      whereClause_O.payment_mode = query.payment_mode;
    }
    if (query.hasOwnProperty("reseller_order")) {
      query.reseller_order === "true" ? (whereClause_O.is_reseller_order = true) : query.reseller_order === "false" ? (whereClause_O.is_reseller_order = false) : "";
    }

    const order_variants = await sequelize.models.Order_variant.findAll({
      offset: pagination.offset,
      limit: pagination.limit,
      where: whereClause_OV,
      include: [
        {
          model: sequelize.models.Order,
          as: "order",
          attributes: [],
          where: { StoreUserId: user_id, ...whereClause_O },
        },
        {
          model: sequelize.models.Variant,
          as: "variant",
          include: ["thumbnail", "gallery", {
            model: sequelize.models.Product,
            as: "product",
            include: ["thumbnail", "gallery", "category", "collections"]
          }]
        }
      ],
    });

    // const orderDetail = await sequelize.models.Order.findAll({
    //   where: { StoreUserId: token.id },
    // });

    const meta = await getMeta(pagination, order_variants.length);
    return res.status(200).send({ data: order_variants, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch orders" });
  }
};

exports.searchOrderVariants = async (req, res) => {
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
        return res.status(400).send(errorResponse({ message: `Invalid status type select from ${Object.values(order.order_status)}` }));
      }
      whereClause_OV.status = query.status;
    }
    if (query.hasOwnProperty("payment_mode")) {
      if (!Object.values(order.payment_modes).includes(query.payment_mode)) {
        return res
          .status(400)
          .send(errorResponse({ message: `Invalid Payment Mode Type select from ${Object.values(order.payment_modes)}` }));
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

    const orders = await sequelize.models.Order_variant.findAndCountAll({
      where: whereClause_OV,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variant",
          where: qs ? { name: { [Op.iLike]: `%${qs}%` } } : {},
        },
        {
          model: sequelize.models.Order,
          as: "order",
          where: whereClause_O,
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

exports.storeUserOrderStats = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req)

    const allStatuses = Object.values(order.order_status);
    const initialStatusCounts = Object.fromEntries(allStatuses.map((status) => [status, 0]));
    const counts = await sequelize.models.Order_variant.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("status")), "statusCount"],
      ],
      group: ["status"],
      include: [
        {
          model: sequelize.models.Order,
          as: "order",
          attributes: [],
          where: {
            [Op.and]: [
              { StoreUserId: token.id },
              { is_paid: true }
            ]
          },
        },
      ],
    });

    const finalStats = {
      status: { ...initialStatusCounts },
    };

    const orderVariants = await sequelize.models.Order_variant.count({
      include: [
        {
          model: sequelize.models.Order,
          as: "order",
          attributes: [],
          where: { StoreUserId: token.id },
        },
      ],
    })

    counts.forEach((count) => {
      const status = count.dataValues.status;
      finalStats.status[status] = +count.dataValues.statusCount || 0;
    });

    return res.status(200).send({ data: { ...finalStats.status, ALL: orderVariants } });
  } catch (error) {
    //console.log(error)
    return res.status(500).send(errorResponse({ status: 500, message: error.message }))
  }
}

exports.stats = async (req, res) => {
  try {
    const sequelize = req.db;
    const allStatuses = Object.values(order.order_status);

    const initialStatusCounts = Object.fromEntries(allStatuses.map((status) => [status, 0]));

    const counts = await sequelize.models.Order_variant.findAll({
      where: { status: { [Op.ne]: null } },
      attributes: ["status", [sequelize.fn("COUNT", sequelize.col("status")), "statusCount"]],
      group: ["status"],
      include: [{
        model: sequelize.models.Order,
        as: "order",
        attributes: [],
        where: {
          [Op.or]: [
            { payment_mode: "COD" },
            { is_paid: true }
          ]
        },
      },]
    });

    const orderVariants = await sequelize.models.Order_variant.count();

    const finalStats = {
      status: { ...initialStatusCounts },
    };

    counts.forEach((count) => {
      const status = count.dataValues.status;
      finalStats.status[status] = +count.dataValues.statusCount || 0;
    });

    return res.status(200).send({ data: { ...finalStats.status, ALL: orderVariants } });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.acceptOrder = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const { id } = req.params;

    const orderVariant = await sequelize.models.Order_variant.findByPk(id);


    if (orderVariant.dataValues.status === order_status.ACCEPTED) {
      return res.status(400).send(
        errorResponse({
          message: "Order Has Already Been Accepted",
          details: "Order is not processed yet",
        })
      );
    }

    await orderVariant.update({
      status: order_status.ACCEPTED,
    },
      {
        where: { id: id },
        transaction: t,
      });

    await createActivityLog({
      event: activity_event.ORDER_ACCEPTED,
      sequelize,
      StoreUserId: token.id,
      transaction: t,
    });
    await orderTracker({
      sequelize,
      order_variant_ids: [id],
      status: order_status.ACCEPTED,
      transaction: t,
    });
    await t.commit();
    return res.status(200).send({ message: "Order Variant has been accepted!" });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.declineOrder = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const { id } = req.params;

    const orderVariant = await sequelize.models.Order_variant.findByPk(id);

    if (!orderVariant || orderVariant.status === order_status.INTRANSIT) {
      return res.status(400).send(
        errorResponse({
          message: "Order not eligible for decline",
          details: "Order is In-Transit",
        })
      );
    }

    await orderVariant.update(
      {
        status: order_status.DECLINED,
      },
      {
        transaction: t,
      }
    );

    await createActivityLog({
      event: activity_event.ORDER_DECLINED,
      sequelize,
      StoreUserId: token.id,
      transaction: t,
    });
    await orderTracker({
      sequelize,
      order_variant_ids: [id],
      status: order_status.DECLINED,
      transaction: t,
    });
    await t.commit();

    return res.status(200).send({ message: "Order Variant has been declined!" });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.cancelOrder = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const { id } = req.params;

    await sequelize.models.Order_variant.update(
      { status: order_status.CANCELLED },
      {
        where: { id: id },
        transaction: t,
      }
    );

    await createActivityLog({
      event: activity_event.ORDER_DECLINED,
      sequelize,
      StoreUserId: token.id,
      transaction: t,
    });
    await orderTracker({
      sequelize,
      order_variant_ids: [id],
      status: order_status.CANCELLED,
      transaction: t,
    });
    await t.commit();
    return res.status(200).send({ message: "Order Variant has been cancelled!" });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.deliverOrder = async (req, res) => {
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

    if (orderVariant.order.is_reseller_order && orderVariant.order.payment_mode === "COD") {
      let payout_amount = orderVariant.selling_price - orderVariant.price
      await sequelize.models.Store_user.update({
        wallet_balance: sequelize.literal(`wallet_balance + ${payout_amount}`)
      }, { where: { id: orderVariant.order.StoreUserId }, transaction: t })
      await createTransaction({ sequelize, purpose: transaction.purpose.ADDED_TO_WALLET, amount: payout_amount, mode: transaction.mode.WALLET, StoreUserId: orderVariant.order.StoreUserId, transaction: t, txn_type: transaction.txn_type.DEBIT })
      await sequelize.models.Wallet.create(
        {
          StoreUserId: orderVariant.order.StoreUserId,
          amount: payout_amount,
          transaction_type: "DEBIT",
          remark: `Payout done for reseller order`,
        },
        { transaction: t }
      );
    }
    await createActivityLog({ event: activity_event.ORDER_DELIVERED, sequelize, StoreUserId: token.id, transaction: t });
    await orderTracker({ sequelize, order_variant_ids: [id], status: order_status.DELIVERED, transaction: t });
    await t.commit();

    return res.status(200).send({ message: "Order Variant has been delivered!", data: orderVariant });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.declineReturn = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const token = jwt.verify(req);
    const { id } = req.params;

    const orderVariant = await OrderVariant.findByPk(id);

    if (!orderVariant || orderVariant.status !== order_status.RETURN_REQUEST) {
      return res.status(400).send(errorResponse({
        message: "Return request not eligible for decline",
        details: "Order is not in RETURN_REQUEST status",
      })
      );
    }

    await OrderVariant.update(
      { status: order_status.RETURN_DECLINED },
      {
        where: { id: id },
        transaction: t,
      }
    );

    await orderTracker({
      sequelize,
      order_variant_ids: [id],
      status: order_status.RETURN_DECLINED,
      transaction: t,
    });
    await t.commit();

    return res.status(200).send({ message: "Return request has been declined" });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.returnRequest = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const token = jwt.verify(req);
    const { id } = req.params;

    if (token.error) return res.status(401).send(tokenError(token))

    const orderVariant = await OrderVariant.findByPk(id, { include: [{ model: sequelize.models.Variant, as: "variant", include: ["product"] }] });

    if (!orderVariant.variant.product.product_return) {
      return res.status(400).send(errorResponse({ message: "You can not return this product", details: "product return is not available for this product" }))
    }

    if (!orderVariant || orderVariant.status !== order_status.DELIVERED) {
      return res.status(400).send(
        errorResponse({
          message: "Return request not eligible",
          details: "Order is not in DELIVERED status",
        })
      );
    }

    await OrderVariant.update({ status: order_status.RETURN_REQUEST },
      {
        where: { id: id },
        transaction: t,
      });


    const returnOrder = await sequelize.models.Return_order.create({
      ...req.body, StoreUserId: token.id,
      OrderVariantId: id
    }, { transaction: t })

    await orderTracker({
      sequelize,
      order_variant_ids: [id],
      status: order_status.RETURN_REQUEST,
      transaction: t,
    });
    await t.commit();
    return res.status(200).send({ message: "Order is requested for return" });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.listReturnRequests = async (req, res) => {
  try {
    const sequelize = req.db;
    const OrderVariant = sequelize.models.Order_variant;
    const token = jwt.verify(req);
    if (token.error) return res.status(401).send(tokenError(token))
    const orderVariant = await OrderVariant.findAll({
      where: { status: order_status.RETURN_REQUEST },
      include: [
        { model: sequelize.models.Order, as: "order", where: { StoreUserId: token.id } },
        {
          model: sequelize.models.Variant, as: "variant",
          include: ['thumbnail', { model: sequelize.models.Product, as: "product", include: ["thumbnail"] }]
        }
      ]
    });
    return res.status(200).send({ data: orderVariant });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const orderStatuses = await sequelize.models.Order_status_tracker.findAll({ where: { OrderVariantId: id } })
    return res.status(200).send({ data: orderStatuses })
  } catch (error) {
    //console.log(error)
    return res.status(500).send(errorResponse({ message: error.message, status: 500 }))
  }
}

exports.exportToExcel = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const body = req.body;
    const whereClause = {};
    if (body.items.length && Array.isArray(body.items)) {
      whereClause.id = { [Op.in]: body.items }
    }
    const order = orderBy(query);
    const order_variants = await sequelize.models.Order_variant.findAll({
      where: whereClause,
      order: order,
      include: [{ model: sequelize.models.Variant, as: "variant", }],
      raw: true
    });
    if (!order_variants.length) {
      return res.status(400).send({ message: `No data found for last ${query.days}` })
    }

    const excelFile = await excelExport(order_variants)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"')
    return res.status(200).send(excelFile);
  } catch (error) {
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: error }))
  }
}

exports.acceptBulkOrder = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const ids = req.body.ids
    let order_variant_ids = []
    for (const item of ids) {
      const orderVariant = await sequelize.models.Order_variant.findByPk(item);


      if (orderVariant.dataValues.status === order_status.ACCEPTED) {
        return res.status(400).send(
          errorResponse({
            message: "Order Has Already Been Accepted",
            details: "Order is not processed yet",
          })
        );
      }

      await orderVariant.update({
        status: order_status.ACCEPTED,
      },
        {
          where: { id: item },
          transaction: t,
        });

      await createActivityLog({
        event: activity_event.ORDER_ACCEPTED,
        sequelize,
        StoreUserId: token.id,
        transaction: t,
      });

      order_variant_ids.push(item)

    }
    await orderTracker({
      sequelize,
      order_variant_ids: [order_variant_ids],
      status: order_status.ACCEPTED,
      transaction: t,
    });
    await t.commit();
    return res.status(200).send({ message: "Order Variant has been accepted!" });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send({ error: "Failed to update the order status" });
  }
};