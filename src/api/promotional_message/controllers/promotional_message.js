
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
        const promotional_message = await sequelize.models.Promotional_message.create(req.body);
        return res.status(200).send({ data: promotional_message })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }));
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
        const promotional_messages = await sequelize.models.Promotional_message.findAll();
        return res.status(200).send({ data: promotional_messages });
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }));
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
        const promotional_message = await sequelize.models.Promotional_message.findByPk(id);
        if (!promotional_message) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send({ data: promotional_message })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }));
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
        const getpromotional_message = await sequelize.models.Promotional_message.findByPk(id)

        if (!getpromotional_message) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const promotional_message = await sequelize.models.Promotional_message.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "promotional_message updated" })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ status: 500, message: error.message }));
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
        const { id } = req.params
        const getpromotional_message = await sequelize.models.Promotional_message.findByPk(id)

        if (!getpromotional_message) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const promotional_message = await sequelize.models.Promotional_message.destroy({ where: { id } });
        return res.status(200).send({ message: "promotional_message deleted!" })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to fetch promotional_message' });
    }
};

