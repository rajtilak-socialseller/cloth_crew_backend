const { getPagination, getMeta } = require("../../../services/pagination");

// Controller function to create a new post
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

const { errorResponse } = require("../../../services/errorResponse");
const orderBy = require("../../../services/orderBy");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const coupon_code = req.body.coupon_code.toUpperCase();
    const body = req.body;
    body["coupon_code"] = coupon_code;
    const coupon = await sequelize.models.Coupon.findOne({
      where: { coupon_code: coupon_code },
    });

    if (coupon) {
      return res.send(
        errorResponse({ status: 400, message: "Coupon Code Already Exists" })
      );
    }

    const new_coupon = await sequelize.models.Coupon.create(body);

    return res.status(200).send({ data: new_coupon });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to create a coupon" });
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
    const order = orderBy(req.query)
    const coupons = await sequelize.models.Coupon.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order
    });
    const meta = await getMeta(pagination, coupons.count);
    return res.status(200).send({ data: coupons.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch coupons" });
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
    const coupon = await sequelize.models.Coupon.findByPk(id);
    if (!coupon) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    return res.status(200).send(coupon);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch coupon" });
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
    const getcoupon = await sequelize.models.Coupon.findByPk(id);

    if (!getcoupon) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const coupon = await sequelize.models.Coupon.update(req.body, {
      where: { id },
      returning: true,
    });
    return res
      .status(200)
      .send({ message: "coupon updated", data: coupon[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: "Failed to fetch coupon" });
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
    const getcoupon = await sequelize.models.Coupon.findByPk(id);

    if (!getcoupon) {
      return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    }
    const coupon = await sequelize.models.Coupon.destroy({ where: { id } });
    return res.status(200).send({ message: "coupon deleted!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to fetch coupon" });
  }
};
