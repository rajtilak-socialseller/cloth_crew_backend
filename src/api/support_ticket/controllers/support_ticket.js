// Controller function to create a new post

const jwt = require("../../../services/jwt");
const orderBy = require("../../../services/orderBy");
const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");
const support_tickets = require("../../../constants/support_tickets");
const { getPreviousDates } = require("../../../services/date");
const excelExport = require("../../../services/excelExport");
const { Op } = require("sequelize");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const body = req.body;
    const token = jwt.verify(req);
    const support_ticket = await sequelize.models.Support_ticket.create({
      title: body.title,
      description: body.description,
      UserId: token.id,
      status: "OPEN",
    });
    return res.status(200).send(support_ticket);
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
    const order = orderBy(query);
    const whereClause = {};
    // code to validate query filters
    if (query.hasOwnProperty("status")) {
      if (!["OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"].includes(query.status)) {
        return res.status(400).send(errorResponse({ message: `Invalid Status Type please select on of "OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"` }))
      }
      whereClause.status = query.status;
    }

    const support_ticket =
      await sequelize.models.Support_ticket.findAndCountAll({
        offset: pagination.offset,
        limit: pagination.limit,
        order: order,
        where: whereClause
      });
    const meta = await getMeta(pagination, support_ticket.count);
    return res.status(200).send({ data: support_ticket.rows, meta });
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

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const support_ticket = await sequelize.models.Support_ticket.findOne({
      where: { id },
    });
    if (support_ticket) {
      return res.status(200).send({ data: support_ticket });
    } else {
      return res.status(400).send({ error: "Invalid Id" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
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
    const getsupport_ticket = await sequelize.models.Support_ticket.findByPk(
      id
    );

    if (!getsupport_ticket) {
      return res
        .status(400)
        .send(errorResponse({ message: "Invalid Ticket ID" }));
    }
    const support_ticket = await sequelize.models.Support_ticket.update(
      req.body,
      { where: { id }, returning: true }
    );
    return res
      .status(200)
      .send({ message: "Support Ticket Updated", data: support_ticket[1][0] });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.changeStatus = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const params = req.params;
    if (!["OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"].includes(params.status)) {
      return res.status(400).send(
        errorResponse({
          message:
            'status must be one of ["OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"]',
        })
      );
    }
    const getsupport_ticket = await sequelize.models.Support_ticket.findByPk(
      id
    );

    if (!getsupport_ticket) {
      return res
        .status(400)
        .send(errorResponse({ message: "Invalid Ticket ID" }));
    }
    const support_ticket = await sequelize.models.Support_ticket.update(
      { status: params.status },
      { where: { id }, returning: true }
    );
    return res
      .status(200)
      .send({ message: "Support Ticket Updated", data: support_ticket[1][0] });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
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
    const getsupport_ticket = await sequelize.models.Support_ticket.findByPk(
      id
    );

    if (getsupport_ticket) {
      const support_ticket = await sequelize.models.Support_ticket.destroy({
        where: { id },
      });
      return res
        .status(200)
        .send({ message: "support ticket deleted successfully" });
    } else {
      return res
        .status(400)
        .send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.stats = async (req, res) => {
  try {
    const sequelize = req.db;
    const [rows, value] =
      await sequelize.query(`SELECT status, COUNT(*) as count
            FROM public."Support_tickets"
            GROUP BY status;`);

    let obj3 = {};
    let statuses = Object.values(support_tickets.status);
    let allCount = 0;

    for (const status of statuses) {
      const match = rows.find((item) => item.status === status);
      obj3[status.toLowerCase()] = match ? parseInt(match.count) : 0;
      allCount += match ? parseInt(match.count) : 0;
    }

    obj3["total"] = allCount;

    return res.status(200).send({ data: obj3 });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};

exports.exportToExcel = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const order = orderBy(query);

    const lastDate = getPreviousDates(query.days ? parseInt(query.days) : 7)
    const support_tickets = await sequelize.models.Support_ticket.findAll({
      where: {
        createdAt: { [Op.gte]: lastDate }
      },
      order: order,
      include: [{ model: sequelize.models.User, as: "user", attributes: ["email", "username"] }],
      raw: true
    });
    if (!support_tickets.length) {
      return res.status(400).send({ message: `No data found for last ${query.days}` })
    }

    const excelFile = await excelExport(support_tickets)
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
