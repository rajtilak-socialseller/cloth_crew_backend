// Controller function to create a new post

const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse } = require("../../../services/errorResponse");

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
    let whereClause = {}
    if (query.hasOwnProperty("active")) {
      (query.active === "true" ? whereClause.is_active = true : query.active === "false" ? whereClause.is_active = false : "")
    }
    if (query.hasOwnProperty("trial")) {
      (query.trial === "true" ? whereClause.is_trial = true : query.trial === "false" ? whereClause.is_trial = false : "")
    }
    if (query.hasOwnProperty("visible")) {
      (query.visible === "true" ? whereClause.is_visible = true : query.visible === "false" ? whereClause.is_visible = false : "")
    }
    if (query.hasOwnProperty("group")) {
      let group = ["MONTHLY", "QUARTERLY", "YEARLY", "TRIAL"]
      if (group.includes(query.group)) {
        whereClause.group = query.group;
      }
      else {
        return res.status(400).send(errorResponse({ message: `invalid group value , select on of ${group}` }))
      }
    }
    //console.log(whereClause)

    const pagination = await getPagination(query.pagination);

    const plans = await sequelize.models.Plan.findAndCountAll({
      where: whereClause,
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "Server_subscriptions" WHERE "Server_subscriptions"."PlanId" = "Plan"."id")'), "subscriptions"],
        ],
      },
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const meta = await getMeta(pagination, plans.count);

    return res.status(200).send({ data: plans.rows, meta });
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

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const plan = await sequelize.models.Plan.create(req.body);
    return res.status(200).send({ data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const plan = await sequelize.models.Plan.findByPk(id, {
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "Server_subscriptions" WHERE "Server_subscriptions"."PlanId" = "Plan"."id")'), "subscriptions"],
        ],
      },
    });

    if (!plan) {
      return res.status(404).send(errorResponse({ status: 404, message: "Plan not found" }));
    }
    return res.status(200).send({ data: plan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const isPlanExists = await sequelize.models.Plan.findByPk(id);

    if (isPlanExists) {
      await sequelize.models.Plan.update(req.body, {
        where: { id },
      });
      return res.status(200).send({ message: "Plan updated successfully!" });
    } else {
      return res.status(404).send(errorResponse({ status: 404, message: "Plan not found" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const isPlanExists = await sequelize.models.Plan.findByPk(id);

    if (isPlanExists) {
      await sequelize.models.Plan.destroy({ where: { id } });
      return res
        .status(200)
        .send({ message: `Plan with id-${id} deleted successfully!` });
    } else {
      return res.status(404).send(errorResponse({ error: "Plan not found" }));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
  }
};
