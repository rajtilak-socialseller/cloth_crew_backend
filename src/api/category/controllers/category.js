// Controller function to create a new post

const { Sequelize, where } = require("sequelize");
const { getPagination, getMeta } = require("../../../services/pagination");
const { Op, literal, or } = require("sequelize");
const { errorResponse } = require("../../../services/errorResponse");
const priceFilter = require("../../product/services/priceFilter");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const category = await sequelize.models.Category.create(req.body);
    return res.status(200).send({ message: "Category created successfully", data: category });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
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
    const categories = await sequelize.models.Category.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      include: [
        {
          model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"]
        },
        "subCategories"
      ],
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "Products" WHERE "Products"."CategoryId" = "Category"."id")'), "products"],
          [sequelize.literal('(SELECT COUNT(*) FROM "Sub_categories" WHERE "Sub_categories"."CategoryId" = "Category"."id")'), "sub_categories"],
        ],
      },
    });
    const meta = await getMeta(pagination, categories.count)
    return res.status(200).send({ data: categories.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
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
    const category = await sequelize.models.Category.findByPk(id, {
      include: [
        {
          model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"]
        },
        {
          model: sequelize.models.Sub_category, as: "subCategories", include: [{ model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"] }]
        }
      ],
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "Products" WHERE "Products"."CategoryId" = "Category"."id")'), "products"],
          [sequelize.literal('(SELECT COUNT(*) FROM "Sub_categories" WHERE "Sub_categories"."CategoryId" = "Category"."id")'), "sub_categories"],
        ],
      },
    });
    if (!category) {
      return res.status(404).send(errorResponse({ status: 404, message: "Category not found!", details: "Category ID seems to be invalid" }));
    }
    return res.status(200).send({ data: category });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
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
    const body = req.body;
    const getcategory = await sequelize.models.Category.findByPk(id);

    if (getcategory) {
      const category = await sequelize.models.Category.update(req.body, {
        where: { id },
        returning: true
      });
      return res.status(200).send({ message: "category updated successfully!", data: category[1][0] });
    } else {
      return res.status(404).send(errorResponse({ message: "category not found", details: "category id seems to be invalid , please do check" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
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
    const getcategory = await sequelize.models.Category.findByPk(id);

    if (getcategory) {
      const category = await sequelize.models.Category.destroy({
        where: { id },
      });
      return res.status(200).send({ message: "category deleted successfully!" });
    } else {
      return res.status(404).send(errorResponse({ message: "category not found!", details: "category id seems to be invalid" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
  }
};

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getProducts = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const query = req.query;
    const minPrice = (query.price && parseFloat(query.price.min)) || 0;
    const maxPrice = (query.price && parseFloat(query.price.max)) || Number.MAX_SAFE_INTEGER;
    const order = priceFilter(query, sequelize);
    const pagination = await getPagination(query.pagination);
    const category = await sequelize.models.Category.findByPk(id, {
      include: ['thumbnail']
    });
    if (!category) {
      return res.status(404).send(errorResponse({ message: "category not found", "details": "cateogory id seems to be invalid" }))
    }
    const products = await sequelize.models.Product.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      where: { CategoryId: id, is_active: true },
      attributes: {
        include: [
          [sequelize.literal('(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'), "rating"],
        ],
      },
      order: order,
      distinct: true,
      include: [
        {
          model: sequelize.models.Variant,
          as: "variants",
          ...(query.price && {
            where: {
              price: {
                [Op.between]: [minPrice, maxPrice],
              },
            },
          }),
          include: ["gallery",
            // { model: sequelize.models.Variant_gallery, as: "gallery", attributes: ["id", "url"] },
            { model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"] }, "bulk_pricings"],
        },
        "tags",
        // { model: sequelize.models.Product_gallery, as: "gallery", attributes: ["id", "url"] },
        { model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"] },
        "sub_category",
        "category",
        "collections"
      ],
      limit: pagination.limit,
      offset: pagination.offset,
    })

    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: { category, Product: products.rows }, meta });

  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
  }
};

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.searchInCategory = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const query = req.query;
    const qs = query.qs.trim();

    const pagination = await getPagination(query.pagination);
    const products = await sequelize.models.Product.findAll({
      where: {
        CategoryId: id,
        [Op.or]: [
          { name: { [Op.iLike]: `%${qs}%` } },
          { description: { [Op.iLike]: `%${qs}%` } },
        ],
      },
      offset: pagination.offset,
      limit: pagination.limit,
      attributes: {
        include: [
          [sequelize.literal('(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'), "rating"],
        ],
      },
    });

    const meta = await getMeta(pagination, products.length);
    return res.status(200).send({ data: products, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }))
  }
};
