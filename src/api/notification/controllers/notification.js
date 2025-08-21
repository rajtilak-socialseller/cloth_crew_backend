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
    const notification = await sequelize.models.notification.create(req.body);
    return res.status(200).send({ data: notification });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create a notification" });
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
    const notifications = await sequelize.models.notification.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });
    const meta = await getMeta(pagination, notifications.count);
    return res.status(200).send({ data: notifications.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch notifications" });
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
    const notification = await sequelize.models.Notification.findByPk(id);
    if (!notification) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    return res.status(200).send({ data: notification });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch notification" });
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
    const getnotification = await sequelize.models.Notification.findByPk(id);

    if (!getnotification) {
      return res.status(404).send(errorResponse({ message: "Invalid ID", details: `notification with id ${id} not found` }));
    }
    const notification = await sequelize.models.notification.update(req.body, { where: { id }, returning: true });
    return res.status(200).send({ message: "notification updated", data: notification[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch notification" });
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
    const getnotification = await sequelize.models.notification.findByPk(id);

    if (!getnotification) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const notification = await sequelize.models.Notification.destroy({ where: { id } });
    return res.status(200).send({ message: "notification deleted!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch notification" });
  }
};
