require("dotenv").config();
const jwt = require("jsonwebtoken");
const orderBy = require("../../../services/orderBy");
const orderTracker = require("../../../services/orderTracker");
const productMetrics = require("../../../services/productMetrics");
const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");
const { product_metric_field } = require("../../../constants/productMetric");
const { order_status, order_status_shiprocket, } = require("../../../constants/order");
const { makeShipmentOrderBody, makeShipmentReturnBody, regenerateToken, createShiprocketReturn, sendOrderInTransitEmail, } = require("../service/ship_rocket_order");
const { Op } = require("sequelize");
const { default: axios } = require("axios");

exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    //console.log("Entering ship rocket order");
    const sequelize = req.db;
    const globals = await sequelize.models.Store_global.findOne();
    const client = req.hostname.split(".")[0];
    const orderVariantIds = req.orderVariantIds;
    const SHIPROCKET_API_URL = process.env.SHIPROCKET_API_URL;
    // verifing the shiprocket token
    if (globals.is_shiprocket_enabled !== true) {
      return res.status(400).send(errorResponse({
        status: 400,
        message: "ship rocket is not enabled in the store",
      }));
    }

    let shiprocketToken = await globals.shiprocket_token;

    if (!shiprocketToken) {
      //console.log("Shiprocket token not found");
      shiprocketToken = await regenerateToken(globals);
    }

    const decodedToken = jwt.decode(shiprocketToken);
    const isTokenExpired = decodedToken.exp < Date.now() / 1000;
    if (isTokenExpired) {
      //console.log("Token is expired");
      shiprocketToken = await regenerateToken(globals);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${shiprocketToken}`,
    };

    const order = await sequelize.models.Order.findByPk(req.orderId, {
      include: [
        {
          model: sequelize.models.Address,
          as: "address",
        },
        {
          model: sequelize.models.Store_user,
          as: "store_user",
        },
      ],
    });

    const body = req.body;
    const [totalAmount] = await sequelize.query('SELECT SUM(price * quantity) AS totalSum FROM "Order_variants" WHERE id IN (:ordervariantIds)',
      {
        replacements: { ordervariantIds: orderVariantIds },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const totalSum = parseInt(totalAmount.totalsum, 10);

    const orderData = await makeShipmentOrderBody({ body, client, order, orderVariants: req.orderVariants, totalSum, globals });

    //console.log(orderData);

    try {
      const shiprocketResponse = await axios.post(SHIPROCKET_API_URL,
        orderData, {
        headers,
      });


      if (!shiprocketResponse.error) {
        const shiprocketOrder = await sequelize.models.Ship_rocket_order.create({
          ...orderData,
          shiprocket_order_id: shiprocketResponse.data.order_id,
          shipment_id: shiprocketResponse.data.shipment_id,
        },
          { transaction: t }
        );

        const orderItems = orderData.order_items.map((item) => ({
          ...item,
          ShipRocketOrderId: shiprocketOrder.id,
          OrderVariantId: item.sku,
        }));

        const Ship_rocket_order_item = await sequelize.models.Ship_rocket_orderitem.bulkCreate(orderItems, { transaction: t });

        await sequelize.models.Order_variant.update(
          { status: order_status.intransit },
          {
            where: { id: { [Op.in]: orderVariantIds } },
            transaction: t,
          }
        );
        // updating the status tracker, ordervariants and sending email

        await orderTracker({ sequelize, order_variant_ids: orderVariantIds, status: order_status.intransit, transaction: t });
        await sendOrderInTransitEmail(order);

        await t.commit();
        return res.status(200).send({ message: "Your order has been intransit" })
      }
    } catch (error) {
      await t.rollback();
      //console.log(error)
      return res.status(500).send(errorResponse({ message: error.message, status: 500 }))
    }
    return res.status(200).send({ data: shiprocketResponse });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.productReturn = async (req, res) => {
  try {
    //console.log("Entering ship rocket order return");

    const { body, db } = req;
    const orderVariant = req.orderVariant;
    // return res.status(200).send(orderVariant)
    const sequelize = db;
    const globals = await sequelize.models.Store_global.findByPk(1);
    const client = req.hostname.split(".")[0];
    const SHIPROCKET_RETURN_API = process.env.SHIPROCKET_RETURN_API_URL;

    // verifying the Shiprocket token

    if (!globals.is_shiprocket_enabled) {
      return res.status(401).send(errorResponse({
        status: 401,
        message: "Shiprocket is not enabled in the store",
      }));
    }

    let shiprocketToken = globals.shiprocket_token;

    if (!shiprocketToken || jwt.decode(shiprocketToken).exp < Date.now() / 1000
    ) {
      //console.log("Regenerating Shiprocket token");
      shiprocketToken = await regenerateToken(globals);
    }

    // creating headers for Shiprocket API
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${shiprocketToken}`,
    };


    const order = await sequelize.models.Order.findOne({
      // where: {},
      include: [
        {
          model: sequelize.models.Address,
          as: "address",
        },
        {
          model: sequelize.models.Store_user,
          as: "store_user",
        },
      ],
    });

    const shipRocketOrderItem = await sequelize.models.Ship_rocket_orderitem.findOne({
      where: {
        OrderVariantId: orderVariant.id,
      },
    });


    const shipRocketOrder = await sequelize.models.Ship_rocket_order.findOne({
      where: { id: shipRocketOrderItem.dataValues.ShipRocketOrderId },
      raw: true
    });

    const totalAmount = await sequelize.query(
      'SELECT SUM(price * quantity) AS totalSum FROM "Order_variants" WHERE id IN (:ordervariantIds)',
      {
        replacements: { ordervariantIds: orderVariant.id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const totalSum = parseInt(totalAmount[0]?.totalsum, 10) || 0;
    const returnOrderData = await makeShipmentReturnBody({ body, client, order, orderVariant: orderVariant, totalSum, shipmentOrderId: shipRocketOrder.shiprocket_order_id, sr_token: globals.shiprocket_token });
    try {
      //console.log("inside axios")
      const shiprocketResponse = await axios.post(SHIPROCKET_RETURN_API,
        returnOrderData,
        { headers });

      const t = await sequelize.transaction();
      try {
        await sequelize.models.Order_variant.update({ status: order_status.return_accepted },
          { where: { id: orderVariant.id }, transaction: t });

        const Ship_rocket_return = await sequelize.models.Ship_rocket_return.create(body, {
          transaction: t,
        });

        const return_order = await sequelize.models.Return_order.update({ status: "ACCEPTED" }, { where: { OrderVariantId: orderVariant.id } })

        const Ship_rocker_orderitems = await sequelize.models.Ship_rocket_orderitem.update(
          { ShipRocketReturnId: Ship_rocket_return.id },
          {
            where: { OrderVariantId: orderVariant.id },
            transaction: t
          }
        );

        await orderTracker({
          sequelize,
          order_variant_ids: orderVariant.id,
          status: order_status.return_accepted,
          transaction: t,
        });

        await productMetrics({
          sequelize,
          product_id: orderVariant.variant.product.id,
          field_name: product_metric_field.return_count,
          transaction: t,
        });

        await t.commit();
        return res.status(200).send({ data: shiprocketResponse.data })
      } catch (error) {
        await t.rollback();
        console.error("Error updating the database:", error.message);
      }
    } catch (error) {
      //console.log(error.response.data)
      return res.status(500).send(error.response.data)
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server error" }));
  }
};

exports.webhook = async (req, res) => {
  const t = await req.db.transaction();
  try {
    //console.log("Entered webhook");
    const body = req.body;
    const sequelize = req.db;

    const { order_id, current_status } = body;
    const status = order_status_shiprocket[current_status];

    if (!status) {
      return res.status(401).send(errorResponse({ status: 401, message: "status is not defined" }));
    }

    const orderVariantIdsResult = await sequelize.query(
      `
      SELECT CAST("Ship_rocket_orderitems"."sku" AS INTEGER) as order_variant_id
      FROM "Ship_rocket_orders"
      JOIN "Ship_rocket_orderitems" ON "Ship_rocket_orders".id = "Ship_rocket_orderitems"."ShipRocketOrderId"
      WHERE "Ship_rocket_orders".shiprocket_order_id = :order_id
      `,
      {
        replacements: { order_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const orderVariantIds = orderVariantIdsResult.map((row) => row.order_variant_id);

    await sequelize.models.Order_variant.update(
      { status: status },
      { where: { id: orderVariantIds } },
      { transaction: t }
    );
    await orderTracker({
      sequelize,
      order_variant_ids: orderVariantIds,
      status,
      transaction: t,
    });

    //console.log("Order status updated successfully");
    return res.status(200).send({ data: "successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);

    const Ship_rocket_orders =
      await sequelize.models.Ship_rocket_order.findAndCountAll({
        offset: pagination.offset,
        limit: pagination.limit,
        order: order,
      });

    const meta = await getMeta(pagination, Ship_rocket_orders.count);

    return res.status(200).send({ data: Ship_rocket_orders.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const Ship_rocket_order = await sequelize.models.Ship_rocket_order.findOne({
      where: { id },
    });

    if (!Ship_rocket_order) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order ID",
        })
      );
    }

    return res.status(200).send({ data: Ship_rocket_order });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal Server Error",
        details: error.message,
      })
    );
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const getShip_rocket_order =
      await sequelize.models.Ship_rocket_order.findByPk(id);

    if (!getShip_rocket_order) {
      return res.status(400).send({
        status: 400,
        message: "Invalid Ship_rocket_order ID",
      });
    }

    const Ship_rocket_order = await sequelize.models.Ship_rocket_order.update(
      req.body,
      {
        where: { id },
        returning: true,
      }
    );

    return res.status(200).send({
      message: "Ship_rocket_order Updated",
      data: Ship_rocket_order[1][0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const getShip_rocket_order =
      await sequelize.models.Ship_rocket_order.findByPk(id);

    if (getShip_rocket_order) {
      const Ship_rocket_order =
        await sequelize.models.Ship_rocket_order.destroy({
          where: { id },
        });

      return res.status(200).send({
        status: 201,
        message: "Ship_rocket_order Deleted Successfully",
      });
    } else {
      return res.status(404).send({
        status: 404,
        message: "Invalid Ship_rocket_order ID",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};
/**
 * @param {Object} res The 'res' object containing the Sequelize instance.
 * @param {import("sequelize").Sequelize} res.db The Sequelize instance.
 * @returns {void} Returns nothing.
 */
exports.pickupAddresses = async (req, res) => {
  try {
    const sequelize = req.db;
    const global = await sequelize.models.Store_global.findOne();
    if (!global.shiprocket_token) {
      return res.status(401).send({
        message: `Token is not provided. Kindly ReGenerate Shiprocket Token in the Admin Panel`,
      });
    }
    let data;
    try {
      data = await axios.get(`https://apiv2.shiprocket.in/v1/external/settings/company/pickup`, {
        headers: {
          Authorization: `Bearer ${global.shiprocket_token}`,
        },
      });
    } catch (err) {
      if (err.response.status === 401 || err.response.status === 403) {
        const res = await axios.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
          email: "shreyansh.socialseller@gmail.com",
          password: "Shreyansh619@"
        })
        global.shiprocket_token = res.data.token;
        await global.save();
        data = await axios.get(`https://apiv2.shiprocket.in/v1/external/settings/company/pickup`, {
          headers: {
            Authorization: `Bearer ${res.data.token}`,
          },
        });
      }
    }
    let addresess = data.data.data.shipping_address.map(
      (it) => it.pickup_location
    );

    return res.status(200).send({ data: addresess });

  } catch (error) {
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: error }))
  }
}