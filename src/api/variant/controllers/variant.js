// Controller function to create a new post
const { getPagination, getMeta } = require("../../../services/pagination");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

const { errorResponse } = require("../../../services/errorResponse");

exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const variant = await sequelize.models.Variant.create(req.body, { transaction: t });
    const body = req.body;

    let variant_gallery_body = [];
    if (body.gallery && body.gallery.length) {
      let obj = body.gallery.flatMap((item) => {
        return { MediaId: item, VariantId: variant.id };
      });
      variant_gallery_body.push(...obj);
    }
    await sequelize.models.Variant_gallery.bulkCreate(variant_gallery_body, { transaction: t });
    await t.commit();
    return res.status(200).send({ message: "Variant created successfully!", data: variant });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
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
    const Variant = sequelize.models.Variant;
    const query = req.query;

    const pagination = await getPagination(query.pagination);

    const variants = await Variant.findAndCountAll({
      include: ["thumbnail", "product", "gallery", "bulk_pricings"],
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, variants.count);

    return res.status(200).send({ data: variants.rows, meta });
  } catch (error) {
    console.log(error);

    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
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
    const variant = await sequelize.models.Variant.findByPk(id, {
      include: ["thumbnail", "product", "gallery", "bulk_pricings"],
    });
    if (variant) {
      return res.status(200).send(variant);
    } else {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid Variant ID" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.update = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const body = req.body;

    const getVariant = await sequelize.models.Variant.findByPk(id);
    if (!getVariant) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid Variant ID" }));
    }
    const [updatedRowsCount, [variant]] = await sequelize.models.Variant.update(body, {
      where: { id },
      returning: true,
      transaction: t,
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send(errorResponse({ message: "Variant not found" }));
    }

    if (body.gallery && body.gallery.length) {
      const variantMedia = await sequelize.models.Variant_gallery.findAll({
        where: { VariantId: id },
      });

      const oldArray = variantMedia.map((entry) => entry.dataValues.MediaId);
      const newArray = req.body.gallery;

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
        VariantId: id,
        MediaId: item,
      }));

      const destroyVariantMedia = await sequelize.models.Variant_gallery.destroy(
        {
          where: {
            MediaId: removedElements,
          },
        },
        { transaction: t }
      );

      await sequelize.models.Variant_gallery.bulkCreate(addArray, { transaction: t });
    }

    await t.commit();
    return res.status(200).send({ message: "Variant updated successfully!", data: variant });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
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
    const getVariant = await sequelize.models.Variant.findByPk(id);
    if (!getVariant) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid Variant ID" }));
    }
    const variant = await sequelize.models.Variant.destroy({ where: { id } });
    await sequelize.models.Variant_gallery.destroy({ where: { VariantId: id } });
    return res.status(200).send({ message: "variant deleted successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
