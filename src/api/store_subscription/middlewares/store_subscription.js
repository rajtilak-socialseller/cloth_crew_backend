// Middleware for subscription
// Customize the middleware code here

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

// write code below

const Joi = require("joi");
const { Op } = require("sequelize");
const jwt = require("../../../services/jwt");

const { errorResponse } = require("../../../services/errorResponse");
const { getDate } = require("../../../services/date");

module.exports = {
  async validateRequest(req, res, next) {
    function validate(body) {
      const JoiSchema = Joi.object({
        "StoreUserId": Joi.number().required(),
        plan_id: Joi.number().required().positive(),
      });

      return JoiSchema.validate(body);
    }

    let result = validate(req.body);
    if (result.error) {
      return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
    } else {
      await next();
    }
  },

  async checkPlan(req, res, next) {
    try {
      const sequelize = req.db;
      if (!req.body.hasOwnProperty("plan_id"))
        return res.status(400).send({
          error: {
            status: 400,
            message: "Bad Request!",
            details: "plan_id is required please provide!",
          },
        });
      const plan_id = req.body.plan_id;
      const plan = await sequelize.models.Store_plan.findByPk(plan_id);
      //console.log(plan.dataValues);
      if (plan.is_active) {
        req.plan_day = plan.validity;
        await next();
      } else {
        return res.status(400).send({
          error: {
            status: 400,
            message: "Bad Request!",
            details: "Invalid Plan Id ",
          },
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        error: {
          status: 400,
          message: "Bad Request!",
          details: "Invalid Plan Id ",
        },
      });
    }
  },
  async checkExistingSubscription(req, res, next) {
    try {
      const sequelize = req.db;

      const token = jwt.verify(req);
      //console.log(token);

      const user = await sequelize.models.Store_user.findByPk(token.id, {
        distinct: true,
        include: [
          {
            model: sequelize.models.Store_subscription,
            as: "subscriptions",
            where: {
              [Op.and]: [
                {
                  valid_to: {
                    [Op.gt]: getDate(),
                  },
                  is_paid: true,
                },
              ],
            },
            include: "plan",
          },
          // Unconditional association for subscriptions
          {
            model: sequelize.models.Store_subscription,
            as: "subscriptions",
            required: false, // This makes it not required
          },
        ],
      });

      //console.log(user.subscriptions);
      //console.log(user);

      if (!user.subscriptions || user.subscriptions.length === 0) {
        req.existing_sub = false;
        req.valid_from = null;
      } else {
        //console.log(user.subscriptions[user.subscriptions.length - 1].valid_to);
        req.existing_sub = true;
        req.valid_from = user.subscriptions[user.subscriptions.length - 1].valid_to;
      }

      await next();

      //   return res.status(400).send({ message: "testing" });
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },

  async validateUserSubscription(req, res, next) {
    try {
      const sequelize = req.db;
      const token = jwt.verify(req);
      const { id } = req.params;
      const subscription = await sequelize.models.Store_subscription.findByPk(id, { include: ["storeUser", "plan"] });
      if (!subscription) return res.status(requestError({ message: "Invalid Subscription ID" }));
      if (subscription.user.id === token.id && subscription.purchaseType === "ONLINE") {
        req.body.subscription = subscription;
        await next();
      } else {
        return res
          .status(400)
          .send(requestError({ message: "Invalid Request", details: "Token and Subsciption do not belongs to same user" }));
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
  async validateSF(req, res, next) {
    try {
      if (!req.body.hasOwnProperty("PlanId")) {
        return res.status(400).send(errorResponse({ message: "PlanId is required" }));
      }
      return next();
    } catch (error) {
      console.log(error);
      return res.status(500).send(errorResponse({ status: 500, message: error.message }));
    }
  },
};
