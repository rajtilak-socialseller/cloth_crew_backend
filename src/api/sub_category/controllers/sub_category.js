const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");
const priceFilter = require("../../product/services/priceFilter");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;

    const subCategory = await sequelize.models.Sub_category.create(req.body);
    return res.status(200).send({
      message: "Sub-category created successfully!",
      data: subCategory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;

    const { id } = req.params;
    const subCategory = await sequelize.models.Sub_category.findByPk(id);

    if (!subCategory) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }

    await subCategory.update(req.body);

    return res.status(200).send({
      message: "Sub-category updated successfully!",
      data: subCategory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;

    const subCategories = await sequelize.models.Sub_category.findAll({
      include: ["thumbnail", "category"],
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "Products" WHERE "Products"."SubCategoryId" = "Sub_category"."id")'), "products"],
        ],
      }
    });
    return res.status(200).send({ data: subCategories });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;

    const { id } = req.params;
    const subCategory = await sequelize.models.Sub_category.findByPk(id, {
      include: ["thumbnail", "category"],
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "Products" WHERE "Products"."SubCategoryId" = "Sub_category"."id")'), "products"],
        ],
      }
    });

    if (!subCategory) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }

    return res.status(200).send({ data: subCategory });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;

    const { id } = req.params;
    const subCategory = await sequelize.models.Sub_category.findByPk(id);

    if (!subCategory) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }

    await subCategory.destroy();

    return res.status(200).send({ message: "Sub-category deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.getProducts = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const query = req.query;
    const minPrice = (query.price && parseFloat(query.price.min)) || 0;
    const maxPrice = (query.price && parseFloat(query.price.max)) || Number.MAX_SAFE_INTEGER;
    const order = priceFilter(query, sequelize);
    const pagination = await getPagination(query.pagination);
    const category = await sequelize.models.Sub_category.findByPk(id, {
      include: ['thumbnail']
    });
    if (!category) {
      return res.status(404).send(errorResponse({ message: "category not found", "details": "cateogory id seems to be invalid" }))
    }
    const products = await sequelize.models.Product.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      where: { SubCategoryId: id, is_active: true },
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
            { model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"] }, "bulk_pricings"],
        },
        "tags",
        { model: sequelize.models.Media, as: "thumbnail", attributes: ["id", "url"] },
        "sub_category",
        "category",
        "collections"
      ],
      limit: pagination.limit,
      offset: pagination.offset,
    })

    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: { Sub_category: category, Product: products.rows }, meta });

  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured!" }));
  }
};