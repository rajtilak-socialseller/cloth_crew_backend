
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
        const payout_log = await sequelize.models.payout_log.create(req.body);
        return res.status(200).send(payout_log)
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to create a payout_log' });
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
        const pagination = await getPagination(query.pagination)
        const payout_logs = await sequelize.models.payout_log.findAndCountAll({
            offset: pagination.offset,
            limit: pagination.limit
        });
        const meta = await getMeta(pagination, payout_logs.count)
        return res.status(200).send({ data: payout_logs.rows, meta });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch payout_logs' });
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
        const payout_log = await sequelize.models.payout_log.findByPk(id);
        if (!payout_log) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send(payout_log)
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch payout_log' });
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
        const getpayout_log = await sequelize.models.payout_log.findByPk(id)

        if (!getpayout_log) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const payout_log = await sequelize.models.payout_log.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "payout_log updated", data: payout_log[1][0] })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch payout_log' });
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
        const getpayout_log = await sequelize.models.payout_log.findByPk(id)

        if (getpayout_log) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const payout_log = await sequelize.models.payout_log.destroy({ where: { id } });
        return res.status(200).send({ message: "payout_log deleted!" })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to fetch payout_log' });
    }
};

