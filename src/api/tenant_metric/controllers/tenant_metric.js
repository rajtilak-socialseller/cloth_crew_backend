// controllers/user_metricsController.js
const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const body = req.body;

    const tenantMetrics = await sequelize.models.Tenant_metric.create(body);

    return res.status(200).send({
      message: "User Metrics Created Successfully!",
      data: tenantMetrics,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;

    const pagination = await getPagination(query.pagination);
    const userMetrics = await sequelize.models.Tenant_metric.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, userMetrics.count);

    return res.status(200).send({ data: userMetrics.rows, meta });
  } catch (error) {
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
    //console.log(req);
    const sequelize = req.db;
    const { id } = req.params;

    const tenantMetrics = await sequelize.models.Tenant_metric.findOne({
      where: { UserId: id }
    });

    if (!tenantMetrics) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid User metrics ID" }));
    }

    return res.status(200).send(tenantMetrics);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const getTenantMetrics = await sequelize.models.Tenant_metric.findByPk(id);

    if (!getTenantMetrics) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid User metrics ID" }));
    }

    const userMetrics = await getTenantMetrics.update(req.body);

    return res.status(200).send({
      message: "User Metrics Updated Successfully!",
      data: userMetrics,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const getMetric = await sequelize.models.Tenant_metric.findByPk(id);

    if (!getMetric) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid User metrics ID" }));
    }

    await getMetric.destroy();

    return res.status(200).send({ message: "User Metrics Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
