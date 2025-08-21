
const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse, tokenError } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");

// Controller function to create a new post
/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */


exports.create = async (req, res) => {
    const t = await req.db.transaction();
    try {
        const sequelize = req.db;
        const body = req.body;
        let StoreUserId = false
        if (req.headers.authorization) {
            StoreUserId = jwt.verify(req).id;
        }

        const product_review = await sequelize.models.Product_review.create({ ...body, StoreUserId: StoreUserId || null }, { transaction: t });
        if (body.gallery && body.gallery.length) {
            let galleryArray = body.gallery.map(item => {
                return {
                    ProductReviewId: product_review.id,
                    MediumId: item
                }
            })
            await sequelize.models.Product_review_gallery.bulkCreate(galleryArray, { transaction: t })
        }
        await t.commit();
        return res.status(200).send({ data: product_review })
    } catch (error) {
        await t.rollback();
        console.log(error);
        return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
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
        // const token = jwt.verify(req)
        // if (token.error) return res.status(401).send(tokenError(token))
        const pagination = await getPagination(query.pagination)
        const product_reviews = await sequelize.models.Product_review.findAndCountAll({
            offset: pagination.offset,
            limit: pagination.limit,
            include: ["product", "gallery"]
        });
        const meta = await getMeta(pagination, product_reviews.count)
        return res.status(200).send({ data: product_reviews.rows, meta });
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
    }
};
/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */
// Controller function to get all posts
exports.findByProduct = async (req, res) => {
    try {
        const sequelize = req.db;
        const query = req.query;
        const { id } = req.params
        const pagination = await getPagination(query.pagination)
        const product_reviews = await sequelize.models.Product_review.findAndCountAll({
            where: { ProductId: id },
            offset: pagination.offset,
            limit: pagination.limit,
            include: [
                { model: sequelize.models.Media, as: "gallery", attributes: ["id", "url"] },
                { model: sequelize.models.Media, as: "avatar", attributes: ["id", "url"] },
                {
                    model: sequelize.models.Store_user, as: "user", attributes: ["id", "name",], include: [
                        { model: sequelize.models.Media, as: "avatar", attributes: ["id", "url"] },
                    ]
                }
            ]
        });
        const meta = await getMeta(pagination, product_reviews.count)
        return res.status(200).send({ data: product_reviews.rows, meta });
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
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
        const product_review = await sequelize.models.Product_review.findByPk(id, { include: ["product", "gallery"] });
        if (!product_review) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        return res.status(200).send({ data: product_review })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
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
        const getproduct_review = await sequelize.models.Product_review.findByPk(id)

        if (!getproduct_review) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const product_review = await sequelize.models.Product_review.update(req.body, { where: { id }, returning: true });
        return res.status(200).send({ message: "product_review updated", data: product_review[1][0] })
    } catch (error) {
        console.log(error);
        return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
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
        const getproduct_review = await sequelize.models.Product_review.findByPk(id)

        if (!getproduct_review) {
            return res.status(400).send(errorResponse({ message: "Invalid ID" }))
        }
        const product_review = await sequelize.models.Product_review.destroy({ where: { id } });
        return res.status(200).send({ message: "product_review deleted!" })
    } catch (error) {
        console.log(error);
        res.status(500).send(errorResponse({ message: error.message, status: 500 }));
    }
};

