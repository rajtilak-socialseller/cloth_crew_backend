const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");

// Controller function to create a new post

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const payment_log = await sequelize.models.payment_log.create(req.body);
    return res.status(201).send(payment_log);
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
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

    const payment_logs = await sequelize.models.Payment_log.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, payment_logs.count);

    return res.status(200).send({ data: payment_logs.rows, meta });
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

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const payment_log = await sequelize.models.payment_log.findOne({
      where: { id },
    });

    if (payment_log) {
      return res.status(200).send({ data: payment_log });
    } else {
      return res.status(400).send(errorResponse({ message: "Invalid Payment Log ID" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getpayment_log = await sequelize.models.payment_log.findByPk(id);

    if (getpayment_log) {
      const payment_log = await sequelize.models.payment_log.update(req.body, {
        where: { id },
      });
      return res.status(200).send(payment_log);
    } else {
      return res.status(400).send(errorResponse({ message: "Invalid Payment Log ID" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getpayment_log = await sequelize.models.payment_log.findByPk(id);

    if (getpayment_log) {
      const payment_log = await sequelize.models.payment_log.destroy({
        where: { id },
      });
      return res.status(200).send({ data: payment_log });
    } else {
      return res.status(400).send(errorResponse({ message: "Payment log not found" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
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
    const products = await sequelize.models.Store_payment_log.findAll({
      where: whereClause,
      order: order,
      include: ["order", "store_user"],
      raw: true
    });
    if (!products.length) {
      return res.status(400).send({ message: `No data found for last ${query.days}` })
    }

    const excelFile = await excelExport(products)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"')
    return res.status(200).send(excelFile);
  } catch (error) {
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: error }))
  }
}