// controllers/freePlanController.js

const { errorResponse } = require("../../../services/errorResponse");

/**
 * Controller function to create/update a free plan
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const getFreePlan = await sequelize.models.Free_plan.findOne();

    if (getFreePlan) {
      const updateFreePlan = await sequelize.models.Free_plan.update(req.body, {
        where: { id: getFreePlan.id },
        returning: true,
      });

      return res.status(200).send({ message: "Free plan updated", data: updateFreePlan[1][0] });
    } else {
      const freePlan = await sequelize.models.Free_plan.create(req.body);
      return res.status(200).send({ message: "Free plan Created Successfully", data: freePlan });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal Server Error", details: error.message }));
  }
};

/**
 * Controller function to get the free plan details
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const freePlan = await sequelize.models.Free_plan.findOne();
    return res.status(200).send({ data: freePlan });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal Server Error" }));
  }
};
