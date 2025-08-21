
const { getPagination, getMeta } = require("../../../services/pagination");

const { errorResponse } = require("../../../services/errorResponse");

exports.create = async (req, res) => {
    try {
        const sequelize = req.db;
        const body = req.body;
        const story = await sequelize.models.Story.create(req.body);
        if (req.body.products.length) {
            let array = body.products.map((item) => {
                return { StoryId: story.dataValues.id, ProductId: item }
            })
            await sequelize.models.StoryProduct.bulkCreate(array)
        }
        return res.status(200).send({ data: story })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to create a story' });
    }
};

exports.find = async (req, res) => {
    try {
        const sequelize = req.db;
        const story = await sequelize.models.Story.findAll({
            include: ["video", "thumbnail", { model: sequelize.models.Product, as: "products", include: ['thumbnail', "variants"] }]
        });
        return res.status(200).send({ data: story });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch storys' });
    }
};

exports.findOne = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const story = await sequelize.models.Story.findByPk(id, {
            include: ["video", "thumbnail", { model: sequelize.models.Product, as: "products", include: ['thumbnail', "variants"] }]
        });
        if (!story) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send({ data: story })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch story' });
    }
};

exports.update = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const getstory = await sequelize.models.Story.findByPk(id)
        if (!getstory) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        if (req.body.products.length) {
            await sequelize.models.StoryProduct.update({ ProductId: req.body.products[0] }, { where: { StoryId: getstory.id } })
        }
        const story = await sequelize.models.Story.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "story updated", data: story[1][0] })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch story' });
    }
};

exports.delete = async (req, res) => {
    try {
        const sequelize = req.db;
        const { id } = req.params
        const getstory = await sequelize.models.Story.findByPk(id)
        if (!getstory) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const story = await sequelize.models.Story.destroy({ where: { id } });
        return res.status(200).send({ message: "story deleted!" })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Failed to fetch story' });
    }
};