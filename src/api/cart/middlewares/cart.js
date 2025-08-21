const Joi = require("joi");
const { requestError } = require("../../../services/errorResponse");

module.exports = {

  async validateAddToCart(req, res, next) {
    const addToCartSchema = Joi.object({
      VariantId: Joi.number().positive().required(),
      quantity: Joi.number().positive().required(),
    });

    let result = addToCartSchema.validate(req.body);

    if (result.error) {
      return res.status(400).send(requestError({ message: result.error.message, details: result.error.details }));
    }
    await next();
  },

  async validateEmptyCartRequest(req, res, next) {
    const emptyCartSchema = Joi.object({
      cartId: Joi.number().required(),
    });

    let result = emptyCartSchema.validate(req.params);

    if (result.error) {
      return res.status(400).send(requestError({ message: result.error.message, details: result.error.details }));
    }

    await next();
  },
};