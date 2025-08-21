const { getPagination, getMeta } = require("../../../services/pagination");
const { Op, col } = require("sequelize");
const { createActivityLog } = require("../../../services/createActivityLog");
const { errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { activity_event } = require("../../../constants/activity_log");
const priceFilter = require("../../product/services/priceFilter");
const { IntraktNotify } = require("../../../services/notification");

exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const body = req.body;
    const collection = await sequelize.models.Collection.create(req.body, { transaction: t });

    if (body.products && body.products.length) {
      const productIds = req.body.products;
      const collectionProduct = productIds.map((productId) => ({
        CollectionId: collection.id,
        ProductId: productId,
      }));
      const createProdCollection = await sequelize.models.CollectionProduct.bulkCreate(collectionProduct, { transaction: t });
    }

    const users = await sequelize.models.Store_user.findAll({
      attributes: ["phone"],
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Consumer" }, attributes: []
        }]
    })
    const phoneNumbers = JSON.parse(JSON.stringify(users)).map((item) => item.phone)
    const data = {
      containsImage: true, body: [body.name, "sale"], hasButton: false, phoneNumber: phoneNumbers,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZHVjdHxlbnwwfHwwfHx8MA%3D%3D"
    }
    IntraktNotify(data, sequelize, "COLLECTION")
    await createActivityLog({ event: activity_event.NEW_COLLECTION_ADDED, sequelize, StoreUserId: token.id, transaction: t });
    await t.commit();
    return res.status(200).send({ message: "Collection Created Successfully!", data: collection });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "failed to perform action", details: "Some internal server error occured!" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const collections = await sequelize.models.Collection.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      include: "thumbnail",
      attributes: {
        include: [
          [sequelize.literal('(SELECT COUNT(*) FROM "CollectionProduct" WHERE "CollectionProduct"."CollectionId" = "Collection"."id")'), "products"],
        ],
      },
    });
    const meta = await getMeta(pagination, collections.count);
    return res.status(200).send({ data: collections.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "failed to perform action", details: "Some internal server error occured!" }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const collection = await sequelize.models.Collection.findByPk(id, {
      include: ["thumbnail", { model: sequelize.models.Product, as: "products", attributes: ["id", "name"] }],
    });
    if (!collection) {
      return res.status(404).send(errorResponse({ message: "Invalid Collection ID" }));
    }

    return res.status(200).send({ data: collection });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message, details: "Some internal server error occured!" }));
  }
};

exports.update = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const [updatedRowsCount, updatedCollection] = await sequelize.models.Collection.update(req.body, {
      where: { id: id },
      returning: true,
      transaction: t
    });
    if (updatedRowsCount === 0) {
      return res.status(404).send(errorResponse({ message: "Invalid Collection ID" }));
    }
    if (req.body.products && Array.isArray(req.body.products)) {
      const collectionProduct = await sequelize.models.CollectionProduct.findAll({
        where: { CollectionId: id },
      });

      const oldArray = collectionProduct.map((entry) => entry.dataValues.ProductId);
      const newArray = req.body.products;

      let newElements = [];
      let removedElements = [];

      for (let i = 0; i < newArray.length; i++) {
        if (!oldArray.includes(newArray[i])) {
          newElements.push(newArray[i]);
        }
      }

      for (let i = 0; i < oldArray.length; i++) {
        if (!newArray.includes(oldArray[i])) {
          removedElements.push(oldArray[i]);
        }
      }

      const addArray = newElements.map((item) => ({
        CollectionId: id,
        ProductId: item,
      }));

      const destroyedCollection = await sequelize.models.CollectionProduct.destroy({
        where: {
          ProductId: removedElements,
        }
      }, { transaction: t });

      await sequelize.models.CollectionProduct.bulkCreate(addArray, { transaction: t });
    }

    await t.commit()

    return res.status(200).send({
      message: "Collection Updated Successfully!",
      data: updatedCollection[0],
    });
  } catch (error) {
    console.log(error);
    await t.rollback()
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "failed to perform action", details: "Some internal server error occured!" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const collectionId = req.params.id;
    const deletedRowCount = await sequelize.models.Collection.destroy({
      where: { id: collectionId },
    });
    if (deletedRowCount === 0) {
      return res.status(404).send(errorResponse({ message: "Collection Not Found!", details: "Collection id seems to be invalid" }));
    }

    const destroyedCollection = await sequelize.models.CollectionProduct.destroy({
      where: {
        CollectionId: collectionId,
      },
    });

    return res.status(200).send({ message: "Collection Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "failed to perform action", details: "Some internal server error occured!" }));
  }
};

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.getProductsByCollection = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const query = req.query;
    const minPrice = (query.price && parseFloat(query.price.min)) || 0;
    const maxPrice = (query.price && parseFloat(query.price.max)) || Number.MAX_SAFE_INTEGER;

    const order = priceFilter(query, sequelize);
    const pagination = await getPagination(query.pagination);
    const collection = await sequelize.models.Collection.findByPk(id, {
      include: ["thumbnail"],
    });
    if (!collection) {
      return res.status(404).send(errorResponse({ message: "Invalid Collection ID" }));
    }

    const products = await sequelize.models.Product.findAndCountAll({
      order: order,
      distinct: true,
      include: [
        {
          model: sequelize.models.Collection, as: "collections",
          where: { id: id },
          attributes: []
        },
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
          include: ["gallery", "thumbnail", "bulk_pricings"],
        },
        "tags",
        "gallery",
        "thumbnail",
        "sub_category",
        "category"
      ],
      limit: pagination.limit,
      offset: pagination.offset,
      where: {
        is_active: true
      },
      attributes: {
        include: [
          [sequelize.literal('(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'), "rating"],
        ],
      },
    })

    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: { collection, products: products.rows }, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "failed to perform action", details: "Some internal server error occured!" }));
  }
};


exports.searchProductsInCollection = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const query = req.query;

    const collection = await sequelize.models.Collection.findByPk(id)

    const pagination = await getPagination(query.pagination);
    const qs = query.qs.trim();

    const products = await sequelize.models.Product.findAndCountAll({
      where: {
        [Op.or]: [{ name: { [Op.iLike]: `%${qs}%` } }, { description: { [Op.iLike]: `%${qs}%` } }],
      },
      offset: pagination.offset,
      limit: pagination.limit,
      include: ["thumbnail", {
        model: sequelize.models.Collection, as: "collections",
        where: { id: id },
        attributes: []
      }],
      attributes: {
        include: [
          [sequelize.literal('(SELECT ROUND(AVG("rating"), 2) FROM "Product_reviews" WHERE "Product_reviews"."ProductId" = "Product"."id")'), "rating"],
        ],
      },
    });

    const meta = await getMeta(pagination, products.count);
    return res.status(200).send({ data: products.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "failed to perform action",
        details: "Some internal server error occurred!",
      })
    );
  }
};

