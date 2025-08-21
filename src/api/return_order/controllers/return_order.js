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
    const returns = await sequelize.models.returns.create(req.body);
    return res.status(200).send(returns);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create a returns" });
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
    const returnss = await sequelize.models.returns.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });
    const meta = await getMeta(pagination, returnss.count);
    return res.status(200).send({ data: returnss.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch returnss" });
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
    const returns = await sequelize.models.returns.findByPk(id);
    if (!returns) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    return res.status(200).send({ data: returns });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch returns" });
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
    const getreturns = await sequelize.models.returns.findByPk(id);

    if (!getreturns) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const returns = await sequelize.models.returns.update(req.body, { where: { id }, returning: true });
    return res.status(200).send({ message: "returns updated", data: returns[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch returns" });
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
    const getreturns = await sequelize.models.returns.findByPk(id);

    if (!getreturns) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const returns = await sequelize.models.returns.destroy({ where: { id } });
    return res.status(200).send({ message: "returns deleted!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch returns" });
  }
};
