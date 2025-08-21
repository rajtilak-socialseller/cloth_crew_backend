const { errorResponse } = require("../../../services/errorResponse");

/**
 * Controller function to create a new store setting
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const getStoreSetting = await sequelize.models.Store_setting.findAll();

    if (getStoreSetting.length !== 0) {
      const updateStoreSetting = await sequelize.models.Store_setting.update(req.body, {
        where: { id: getStoreSetting[0].id },
        returning: true,
      });

      return res.status(200).send({
        message: "Store setting updated",
        data: updateStoreSetting[1][0],
      });
    } else {
      const storeSetting = await sequelize.models.Store_setting.create(req.body);
      return res.status(200).send({
        message: "Store setting Created Successfully",
        data: storeSetting,
      });
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
 * Controller function to get the store setting
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const storeSetting = await sequelize.models.Store_setting.findOne();
    return res.status(200).send({ data: storeSetting });
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
