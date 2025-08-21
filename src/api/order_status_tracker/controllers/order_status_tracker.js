const { getPagination, getMeta } = require("../../../services/pagination");

// Controller function to create a new post
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

const { errorResponse } = require("../../../services/errorResponse");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const order_status_tracker = await sequelize.models.order_status_tracker.create(req.body);
    return res.status(200).send(order_status_tracker);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create a order_status_tracker" });
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
    const order_status_trackers = await sequelize.models.Order_status_tracker.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });
    const meta = await getMeta(pagination, order_status_trackers.count);
    return res.status(200).send({ data: order_status_trackers.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch order_status_trackers" });
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
    const order_status_tracker = await sequelize.models.order_status_tracker.findByPk(id);
    if (!order_status_tracker) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    return res.status(200).send(order_status_tracker);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch order_status_tracker" });
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
    const getorder_status_tracker = await sequelize.models.order_status_tracker.findByPk(id);

    if (!getorder_status_tracker) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const order_status_tracker = await sequelize.models.order_status_tracker.update(req.body, { where: { id }, returning: true });
    return res.status(200).send({ message: "order_status_tracker updated", data: order_status_tracker[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch order_status_tracker" });
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
    const getorder_status_tracker = await sequelize.models.order_status_tracker.findByPk(id);

    if (getorder_status_tracker) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const order_status_tracker = await sequelize.models.order_status_tracker.destroy({ where: { id } });
    return res.status(200).send({ message: "order_status_tracker deleted!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch order_status_tracker" });
  }
};
