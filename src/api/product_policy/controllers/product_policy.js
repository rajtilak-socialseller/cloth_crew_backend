
const { getPagination, getMeta } = require("../../../services/pagination");

// Controller function to create a new post
/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */

const { errorResponse } = require("../../../services/errorResponse");

exports.create = async (req, res) => {
    try {

        const sequelize = req.db;
        const product_policy = await sequelize.models.Product_policy.create(req.body);
        return res.status(200).send({ data: product_policy })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }))
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

        const product_policys = await sequelize.models.Product_policy.findAll();

        return res.status(200).send({ data: product_policys });
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }))
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
        const { id } = req.params
        const product_policy = await sequelize.models.Product_policy.findByPk(id);
        if (!product_policy) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send({ data: product_policy })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }))
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
        const { id } = req.params
        const product_policy = await sequelize.models.Product_policy.findByPk(id)

        if (!product_policy) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const [rows, [data]] = await sequelize.models.Product_policy.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "product_policy updated", data: data })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }))
    }
};
/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */

exports.destroy = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const getproduct_policy = await sequelize.models.Product_policy.findByPk(id)

        if (!getproduct_policy) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const product_policy = await sequelize.models.Product_policy.destroy({ where: { id } });
        return res.status(200).send({ message: "product_policy deleted!" })
    } catch (error) {
        console.log(error);
        res.status(500).send(errorResponse({ status: 500, message: error.message }))
    }
};

