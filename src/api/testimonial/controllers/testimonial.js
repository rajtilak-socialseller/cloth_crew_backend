
const { getPagination, getMeta } = require("../../../services/pagination");

const { errorResponse, tokenError } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");

exports.create = async (req, res) => {
    try {
        const token = jwt.verify(req);
        if (token.error) {
            return res.status(400).send(tokenError(token))
        }
        const sequelize = req.db;
        const testimonial = await sequelize.models.Testimonial.create({ ...req.body, StoreUserId: token.id });
        return res.status(200).send({ data: testimonial })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to create a testimonial' });
    }
};

exports.find = async (req, res) => {
    try {
        const sequelize = req.db;
        const testimonials = await sequelize.models.Testimonial.findAll({
            include: [{
                model: sequelize.models.Store_user, as: "user",
                attributes: ["id", "name", "email",],
                include: ["avatar"],
            }, "video", "thumbnail"]
        });
        return res.status(200).send({ data: testimonials });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch testimonials' });
    }
};

exports.findOne = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const testimonial = await sequelize.models.Testimonial.findByPk(id, {
            include: ["user", "video"]
        });
        if (!testimonial) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send({ data: testimonial })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch testimonial' });
    }
};

exports.update = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const gettestimonial = await sequelize.models.Testimonial.findByPk(id)

        if (!gettestimonial) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const testimonial = await sequelize.models.Testimonial.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "testimonial updated" })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch testimonial' });
    }
};

exports.delete = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const gettestimonial = await sequelize.models.Testimonial.findByPk(id)

        if (!gettestimonial) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const testimonial = await sequelize.models.Testimonial.destroy({ where: { id } });
        return res.status(200).send({ message: "testimonial deleted!" })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch testimonial' });
    }
};

