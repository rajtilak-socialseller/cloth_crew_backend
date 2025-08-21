// Controller function to create a new post

const jwt = require("../../../services/jwt");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const getglobal = await sequelize.models.Global.findAll();
    if (getglobal.length !== 0) {
      const updateGLobal = await sequelize.models.Global.update(req.body, {
        where: { id: getglobal[0].id },
        returning: true,
      });
      return res
        .status(200)
        .send({ message: "global updated", data: updateGLobal[1][0] });
    } else {
      const global = await sequelize.models.Global.create(req.body);
      return res
        .status(200)
        .send({ message: "Global Created Successfully", data: global });
    }
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    if (!token.error) {
      const globals = await sequelize.models.Global.findOne({
        include: ["logo"],
      });
      return res.status(200).send({ data: globals });
    }
    const globals = await sequelize.models.Global.findOne({
      attributes: ["subscription_price", "subscription_validity"],
      include: ["logo"],
    });

    return res.status(200).send({ data: globals });
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};
