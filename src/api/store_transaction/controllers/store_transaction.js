// controllers/transactionController.js
const { Op } = require("sequelize");
const { getPreviousDates } = require("../../../services/date");
const { errorResponse, tokenError } = require("../../../services/errorResponse");
const excelExport = require("../../../services/excelExport");
const jwt = require("../../../services/jwt");
const orderBy = require("../../../services/orderBy");
const { getPagination, getMeta } = require("../../../services/pagination");
const transaction = require("../../../constants/transaction");

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
    const query = req.query;
    const whereClause = {};
    const pagination = await getPagination(query.pagination);
    if (query.hasOwnProperty("mode") && Object.values(transaction.mode).includes(query.mode)) {
      whereClause["mode"] = query.mode
    }
    if (query.hasOwnProperty("type") && Object.values(transaction.txn_type).includes(query.type)) {
      whereClause["txn_type"] = query.type
    }
    if (query.hasOwnProperty("purpose") && Object.values(transaction.purpose).includes(query.purpose)) {
      whereClause["purpose"] = query.purpose
    }

    //console.log(whereClause)

    const transactions = await sequelize.models.Transaction.findAndCountAll({
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
    const body = req.body;
    const whereClause = {};
    if (body.items.length && Array.isArray(body.items)) {
      whereClause.id = { [Op.in]: body.items }
    }
    const order = orderBy(query);
    const transactions = await sequelize.models.Transaction.findAll({
      where: whereClause,
      order: order,
      include: ["user"],
      raw: true
    });
    if (!transactions.length) {
      return res.status(400).send({ message: `No data found for last ${query.days}` })
    }

    const excelFile = await excelExport(transactions)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"')
    return res.status(200).send(excelFile);
  } catch (error) {
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: error }))
  }
}
exports.userTransactions = async (req, res) => {
  try {
    const sequelize = req.db;
    const Transaction = sequelize.models.Transaction;
    const query = req.query;
    const pagination = await getPagination(query.pagination);

    const token = jwt.verify(req)
    if (token.error) {
      return res.status(401).send(tokenError(token))
    }

    const transactions = await Transaction.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      where: { StoreUserId: token.id },
      order: [["createdAt", "DESC"]],
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
 * Update a transaction by ID.
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
