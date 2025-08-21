// Controller function to create a new post

const { errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");
const { Op } = require("sequelize");
const { getPreviousDates } = require("../../../services/date");
const excelExport = require("../../../services/excelExport");

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
    //console.log(token.id);
    const Store_support_ticket = await sequelize.models.Store_support_ticket.create({
      title: body.title,
      description: body.description,
      StoreUserId: token.id,
      status: "OPEN",
    });
    return res.status(200).send({ data: Store_support_ticket });
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
// Controller function to get all posts
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const Store_support_ticket = await sequelize.models.Store_support_ticket.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
    });
    const meta = await getMeta(pagination, Store_support_ticket.count);
    return res.status(200).send({ data: Store_support_ticket.rows, meta });
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
// Controller function to get all posts
exports.userTickets = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const token = jwt.verify(req);
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const Store_support_ticket = await sequelize.models.Store_support_ticket.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      where: { StoreUserId: token.id },
    });
    const meta = await getMeta(pagination, Store_support_ticket.count);
    return res.status(200).send({ data: Store_support_ticket.rows, meta });
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
// Controller function to get all posts
exports.userSingleTicket = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const id = req.params.id;
    const token = jwt.verify(req);

    const Store_support_ticket = await sequelize.models.Store_support_ticket.findByPk(id, {
      where: { StoreUserId: token.id },
    });
    return res.status(200).send({ data: Store_support_ticket });
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
    const Store_support_ticket = await sequelize.models.Store_support_ticket.findOne({
      where: { id },
    });
    if (Store_support_ticket) {
      return res.status(200).send({ data: Store_support_ticket });
    } else {
      return res
        .status(404)
        .send(
          errorResponse({
            status: 404,
            message: `Support Ticket with Id ${id} Not Found`,
            details: "Support ticket id seems to be invalid",
          })
        );
    }
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

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getStore_support_ticket = await sequelize.models.Store_support_ticket.findByPk(id);

    if (!getStore_support_ticket) {
      return res.status(400).send(errorResponse({ message: "Invalid Ticket ID" }));
    }
    const [rowsCount, [Store_support_ticket]] = await sequelize.models.Store_support_ticket.update(req.body, {
      where: { id },
      returning: true,
    });
    return res.status(200).send({
      message: "Support Ticket Updated",
      data: Store_support_ticket,
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
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.changeStatus = async (req, res) => {
  try {
    //console.log("change status");
    const sequelize = req.db;
    const { id } = req.params;
    const params = req.params;
    if (!["OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"].includes(params.status)) {
      return res.status(400).send(
        errorResponse({
          message: 'status must be one of ["OPEN", "CLOSED", "IN_PROGRESS", "ON_HOLD"]',
        })
      );
    }
    const getStore_support_ticket = await sequelize.models.Store_support_ticket.findByPk(id);

    if (!getStore_support_ticket) {
      return res.status(400).send(errorResponse({ message: "Invalid Ticket ID" }));
    }
    if (getStore_support_ticket.status === params.status) {
      return res.status(400).send(errorResponse({ message: `Support Ticket Status Is Already Status is already ${params.status}` }));
    }
    const [rowsCount, [Store_support_ticket]] = await sequelize.models.Store_support_ticket.update(
      { status: params.status },
      { where: { id, status: { [Op.ne]: params.status } }, returning: true }
    );
    return res.status(200).send({
      message: "Support Ticket Status Has Been Updated!",
      data: Store_support_ticket,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
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

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getStore_support_ticket = await sequelize.models.Store_support_ticket.findByPk(id);

    if (getStore_support_ticket) {
      const Store_support_ticket = await sequelize.models.Store_support_ticket.destroy({
        where: { id },
      });
      return res.status(200).send({ status: 201, message: "Support ticket Deleted Successfully" });
    } else {
      return res.status(404).send(errorResponse({ status: 404, message: "Support Ticket Not Found" }));
    }
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

exports.exportToExcel = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const order = orderBy(query);

    const lastDate = getPreviousDates(query.days ? parseInt(query.days) : 7)
    const support_tickets = await sequelize.models.Store_support_ticket.findAll({
      where: {
        createdAt: { [Op.gte]: lastDate }
      },
      order: order,
      include: [{ model: sequelize.models.Store_user, as: "store_user", attributes: ["email", "name"] }],
      raw: true
    });
    if (!support_tickets.length) {
      return res.status(400).send({ message: `No data found for last ${query.days} days` })
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

