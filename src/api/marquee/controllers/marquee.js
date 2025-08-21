
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
        const marquee = await sequelize.models.Marquee.create(req.body);
        return res.status(200).send(marquee)
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to create a marquee' });
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
        const marquees = await sequelize.models.Marquee.findAll({ where: { active: true }, include: ["image"] });
        return res.status(200).send({ data: marquees });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch marquees' });
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
        const marquee = await sequelize.models.Marquee.findByPk(id, { include: ["image"] });
        if (!marquee) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send(marquee)
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch marquee' });
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
        const getMarquee = await sequelize.models.Marquee.findByPk(id)

        if (!getMarquee) {
            return res.status(404).send(errorResponse({ message: "Marquee Not Found!" }))
        }
        const marquee = await sequelize.models.Marquee.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "marquee updated" })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch marquee' });
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
        const getMarquee = await sequelize.models.Marquee.findByPk(id)

        if (!getMarquee) {
            return res.status(404).send(errorResponse({ message: "Marquee Not Found!" }))
        }
        const marquee = await sequelize.models.Marquee.destroy({ where: { id } });
        return res.status(200).send({ message: "marquee deleted!" })
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Failed to fetch marquee' });
    }
};

