// controllers/transactionController.js
const { Op } = require("sequelize");
const { getPreviousDates } = require("../../../services/date");
const { errorResponse } = require("../../../services/errorResponse");
const excelExport = require("../../../services/excelExport");
const orderBy = require("../../../services/orderBy");
const { getPagination, getMeta } = require("../../../services/pagination");

/**
 * Create a new transaction.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const transaction = await sequelize.models.Transaction.create(req.body);
    return res.status(200).send({
      message: "Transaction created successfully!",
      data: transaction,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create a transaction" });
  }
};

/**
 * Get a specific transaction by ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const transaction = await sequelize.models.Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).send({ error: "Transaction not found" });
    }

    return res.status(200).send({ data: transaction });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

/**
 * Get a specific transaction by ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const Transaction = sequelize.models.Transaction;
    const query = req.query;
    let whereClause = {};



    // code to validate query filters
    if (query.hasOwnProperty("purpose")) {
      whereClause.purpose = query.purpose;
    }
    if (query.hasOwnProperty("txn_type")) {
      whereClause.txn_type = query.txn_type;
    }
    if (query.hasOwnProperty("mode")) {
      whereClause.mode = query.mode;
    }
    //console.log(whereClause)
    const pagination = await getPagination(query.pagination);

    const transactions = await Transaction.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      where: whereClause
    });
    const meta = await getMeta(pagination, transactions.count);
    return res.status(200).send({ data: transactions.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(
        errorResponse({
          status: 500,
          message: "Internal server Error",
          details: error.message,
        })
      );
  }
};
exports.exportToExcel = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const order = orderBy(query);

    const lastDate = getPreviousDates(query.days ? parseInt(query.days) : 7)
    const leads = await sequelize.models.Transaction.findAll({
      where: {
        createdAt: { [Op.gte]: lastDate }
      },
      order: order,
      include: [{ model: sequelize.models.User, as: "user", attributes: ["email", "username"] }],
      raw: true
    });
    if (!leads.length) {
      return res.status(400).send({ message: `No data found for last ${query.days}` })
    }

    const excelFile = await excelExport(leads)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"')
    return res.status(200).send(excelFile);
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    }));
  }
};

exports.search = async (req, res) => {
  try {
    const sequelize = req.db;
    const Transaction = sequelize.models.Transaction;
    const query = req.query;

    const pagination = await getPagination(query.pagination);

    const transactions = await Transaction.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });
    const meta = await getMeta(pagination, transactions.count);
    return res.status(200).send({ data: transactions.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(
        errorResponse({
          status: 500,
          message: "Internal server Error",
          details: error.message,
        })
      );
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const transaction = await sequelize.models.Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).send({ error: "Transaction not found" });
    }

    await transaction.update(req.body);

    return res.status(200).send({
      message: "Transaction Updated Successfully!",
      data: transaction,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to update transaction" });
  }
};

/**
 * Delete a transaction by ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const transaction = await sequelize.models.Transaction.findByPk(id);

    if (!transaction) {
      return res.status(404).send({ error: "Transaction not found" });
    }

    await transaction.destroy();

    return res.status(200).send({ message: "Transaction Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to delete transaction" });
  }
};
