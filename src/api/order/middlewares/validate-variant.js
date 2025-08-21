const jwt = require("../../../services/jwt");
const { tokenError, errorResponse } = require("../../../services/errorResponse");
const Joi = require("joi");
const { payment_modes } = require("../../../constants/order");

module.exports = {
  async validate_variant(req, res, next) {
    try {
      //console.log("entered in validate request");
      const sequelize = req.db;
      const { variants } = req.body;

      const global = await sequelize.models.Store_global.findOne({ raw: true });
      const variantIds = variants.map(item => {
        return item.VariantId
      })

      const fetchedVariants = await sequelize.models.Variant.findAll({
        where: { id: variantIds },
        include: ["bulk_pricings",
          { model: sequelize.models.Product, as: "product", where: { is_active: true } }
        ]
      });

      const variants_arr = fetchedVariants.map(variant => variant.get({ plain: true }));

      for (const variantData of variants) {
        const { VariantId, quantity } = variantData;
        const variant = fetchedVariants.find(v => v.id === VariantId);
        if (!variant || variant.quantity < quantity) {
          return res.status(400).send({
            message: (!variant ? `No Variant Found for the id ${VariantId}` : `Insufficient quantity for VariantId ${VariantId}.`)
          });
        }
        if (req.body.payment_mode === "COD" && !variant.product.cod_enabled) {
          return res.status(400).send(errorResponse({ message: `COD order not available for variant ${VariantId}` }));
        }
      }

      if (req.body.payment_mode === "COD" && !global.cod_enabled) {
        return res.status(400).send(errorResponse({ message: "You cannot place COD order as store does not allow" }));
      }

      req.global = global
      req.variants_arr = variants_arr;
      // return res.status(200).send({data: variants_arr,})
      next();
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        message: "Internal Server Error",
      });
    }
  },
};
