// Controller function to create a new post

const { Op, QueryError } = require("sequelize");
const { errorResponse } = require("../../../services/errorResponse");
const orderBy = require("../../../services/orderBy");
const { getPagination, getMeta } = require("../../../services/pagination");
const { createActivityLog } = require("../../../services/createActivityLog");
const jwt = require("../../../services/jwt");
const { activity_event } = require("../../../constants/activity_log");
const { lead_status, lead_source, lead_type } = require("../../../constants/lead");
const tenantMetric = require("../../../services/tenantMetric");
const { tenant_metric_fields } = require("../../../constants/tenant_metric");
const excelExport = require("../../../services/excelExport");
const { getPreviousDates } = require("../../../services/date");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const body = req.body;
    const token = jwt.verify(req);

    const product = await sequelize.models.Product.findByPk(body.ProductId)
    if (!product || !product.enquiry_enabled) {
      return res.status(400).send(errorResponse({ status: 400, message: !product ? "Invalid Product ID" : "Enquiry Is not enabled for this product" }))
    }
    const phone = body.phone
    if (body.hasOwnProperty("phone") && body.phone.length > 10) {
      const trimedPhone = phone.trim().split(" ").join("").slice(-10);
      body.phone = trimedPhone;
    }

    const lead = await sequelize.models.Lead.create({ ...body, type: "HOT_LEAD", status: "OPEN" }, { transaction: t });

    await createActivityLog({ sequelize, StoreUserId: token.id, event: activity_event.NEW_LEAD_ADDED, transaction: t });
    tenantMetric({ subdomain: req.subdomain, field_name: tenant_metric_fields.total_leads });
    await t.commit();
    return res.status(201).send({
      message: "Lead created successfully!",
      data: lead,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(500).send(errorResponse({
      status: 500,
      message: error.message,
      details: "Failed to create a lead",
    }));
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
      whereClause.status = query.status;
    }
    if (query.hasOwnProperty("source")) {
      whereClause.source = query.source;
    }
    if (query.hasOwnProperty("type")) {
      whereClause.type = query.type;
    }
    const leads = await sequelize.models.Lead.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      order: order,
      where: whereClause,
      include: [
        {
          model: sequelize.models.Product, as: "product", attributes: ["id", "name"],
          include: [{ model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"] }]
        },
        {
          model: sequelize.models.Store_user, as: "assigned_to",
          attributes: ["id", "name", "email", "phone"]
        },
        {
          model: sequelize.models.Store_user, as: "user",
          attributes: ["id", "name", "email", "phone"]
        }
      ]
    });

    const meta = await getMeta(pagination, leads.count);
    return res.status(200).send({ data: leads.rows, meta });
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
exports.exportLeads = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const body = req.body;
    const whereClause = {};
    if (body.items.length && Array.isArray(body.items)) {
      whereClause.id = { [Op.in]: body.items }
    }
    const order = orderBy(query);
    const leads = await sequelize.models.Lead.findAll({
      where: whereClause,
      order: order,
      include: [{ model: sequelize.models.Product, as: "product", include: ["thumbnail", "gallery"] }],
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
 * Find a lead by ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const lead = await sequelize.models.Lead.findByPk(id, { include: [{ model: sequelize.models.Product, as: "product", include: ["thumbnail", "gallery"] }] });
    if (!lead) {
      return res.status(404).send(errorResponse({ status: 404, message: "Lead not found", details: "lead id seems to be invalid" }));
    }
    return res.status(200).send({ data: lead });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

/**
 * Update a lead by ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getLead = await sequelize.models.Lead.findByPk(id);

    if (!getLead) {
      return res.status(404).send(errorResponse({ status: 404, message: "Lead not found", details: "lead id seems to be invalid" }));
    }
    await sequelize.models.Lead.update(req.body, { where: { id } });

    return res.status(200).send({ message: "Lead updated successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

/**
 * Delete a lead by ID.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const getLead = await sequelize.models.Lead.findByPk(id);

    if (!getLead) {
      return res.status(404).send(errorResponse({ status: 404, message: "Lead not found", details: "lead id seems to be invalid" }));
    }
    await sequelize.models.Lead.destroy({ where: { id } });
    return res.status(200).send({ message: "Lead deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: error.message }));
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.search = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs.trim();
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const leads = await sequelize.models.Lead.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      where: {
        [Op.or]: [{ name: { [Op.iLike]: `%${qs}%` } }, { phone: { [Op.iLike]: `%${qs}%` } }],
      },
      include: [{ model: sequelize.models.Product, as: "product", include: ["thumbnail", "gallery"] }]
    });

    const meta = await getMeta(pagination, leads.count);
    return res.status(200).send({ data: leads.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
exports.stats = async (req, res) => {
  try {
    const sequelize = req.db;
    const allStatuses = Object.values(lead_status);
    const allSources = Object.values(lead_source);
    const alltype = Object.values(lead_type);

    const initialStatusCounts = Object.fromEntries(allStatuses.map((status) => [status, 0]));
    const initialSourceCounts = Object.fromEntries(allSources.map((source) => [source, 0]));
    const initialTypeCounts = Object.fromEntries(alltype.map((type) => [type, 0]));

    const counts = await sequelize.models.Lead.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("status")), "statusCount"],
        "source",
        [sequelize.fn("COUNT", sequelize.col("source")), "sourceCount"],
        "type",
        [sequelize.fn("COUNT", sequelize.col("type")), "typeCount"],
      ],
      group: ["status", "source", "type"],
    });

    const finalStats = {
      status: { ...initialStatusCounts },
      source: { ...initialSourceCounts },
      type: { ...initialTypeCounts }
    };

    counts.forEach((count) => {
      const status = count.dataValues.status;
      const source = count.dataValues.source;
      const type = count.dataValues.type;
      finalStats.status[status] = +count.dataValues.statusCount || 0;
      finalStats.source[source] = +count.dataValues.sourceCount || 0;
      finalStats.type[type] = +count.dataValues.typeCount || 0;
    });

    return res.status(200).send({ data: finalStats });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
