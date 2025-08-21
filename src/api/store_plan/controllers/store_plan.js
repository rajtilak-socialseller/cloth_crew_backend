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
    const pagination = await getPagination(query.pagination);

    let whereClause = {};
    if (query.hasOwnProperty("active")) {
      query.active === "true"
        ? (whereClause.is_active = true)
        : query.active === "false"
        ? (whereClause.is_active = false)
        : "";
    }

    let plans = await sequelize.models.Store_plan.findAndCountAll({
      where: whereClause,
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM "Store_subscriptions" WHERE "Store_subscriptions"."PlanId" = "Store_plan"."id")'
            ),
            "subscriptions",
          ],
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
    const plan = await sequelize.models.Store_plan.create(req.body);
    return res.status(200).send({ data: plan });
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
    const plan = await sequelize.models.Store_plan.findByPk(id, {
      attributes: {
        include: [
          [
            sequelize.literal(
              '(SELECT COUNT(*) FROM "Store_subscriptions" WHERE "Store_subscriptions"."PlanId" = "Store_plan"."id")'
            ),
            "subscriptions",
          ],
        ],
      },
    });

    if (plan) {
      return res.status(200).send({ data: plan });
    } else {
      return res
        .status(404)
        .send(errorResponse({ message: "Plan not found", status: 404 }));
    }
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
    const existingPlan = await sequelize.models.Store_plan.findByPk(id);

    if (existingPlan) {
      await sequelize.models.Store_plan.update(req.body, {
        where: { id },
      });
      return res.status(200).send({ message: "Plan updated successfully!" });
    } else {
      return res.status(404).send(errorResponse({ error: "Plan not found" }));
    }
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

    const existingPlan = await sequelize.models.Store_plan.findByPk(id);

    if (!existingPlan) {
      return res.status(404).send(errorResponse({ error: "Plan not found" }));
    }

    // 1. Find all subscriptions with this plan
    const subscriptions = await sequelize.models.Store_subscription.findAll({
      where: { PlanId: id },
    });

    const userIds = subscriptions.map((sub) => sub.StoreUserId);

    // 2. Update all affected users to set isPremium = false
    if (userIds.length > 0) {
      await sequelize.models.Store_users.update(
        { isPremium: false },
        {
          where: {
            id: userIds,
          },
        }
      );
    }

    // 3. Delete subscriptions
    await sequelize.models.Store_subscription.destroy({
      where: { PlanId: id },
    });

    // 4. Delete the plan itself
    await sequelize.models.Store_plan.destroy({ where: { id } });

    return res
      .status(200)
      .send({ message: `Plan with id-${id} deleted successfully!` });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
