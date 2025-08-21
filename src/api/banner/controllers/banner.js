// Controller function to create a new post

const { errorResponse } = require("../../../services/errorResponse");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;

    const banner = await sequelize.models.Banner.create(req.body);
    return res.status(200).send({ message: "Banner Created Successfully!", data: banner });

  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "failed to create banner", details: "Some internal server error occured!" }));
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
    const banner = await sequelize.models.Banner.findAll({
      include: ["mobile_thumbnail", "desktop_thumbnail"],
    });
    return res.status(200).send({ data: banner })
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: "some internal server error occured!" }));
  }
};
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const banner = await sequelize.models.Banner.findByPk(id, {
      include: ["mobile_thumbnail", "desktop_thumbnail"]
    });
    return res.status(200).send({ data: banner })
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: "some internal server error occured!" }));
  }
};
exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const banner = await sequelize.models.Banner.findByPk(id);
    if (!banner) {
      return res.status(404).send(errorResponse({ status: 404, message: `banner not found with id ${id}` }))
    }
    const updateanner = await sequelize.models.Banner.update(req.body, { where: { id } })
    return res.status(200).send({ message: "banner update successfully!" })
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: "some internal server error occured!" }));
  }
};
exports.destroy = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const banner = await sequelize.models.Banner.findByPk(id);
    if (!banner) {
      return res.status(404).send(errorResponse({ status: 404, message: `banner not found with id ${id}` }))
    }
    const deletebanner = await sequelize.models.Banner.destroy({ where: { id: id } })
    return res.status(200).send({ message: "banner deleted successfully!" })
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: error.message, details: "some internal server error occured!" }));
  }
};
