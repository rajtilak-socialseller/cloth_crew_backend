const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

exports.createBulkPricing = async (req, res, next) => {
  const schema = Joi.object({
    from: Joi.number().required(),
    to: Joi.number().required(),
    price: Joi.number().required(),
    premiumPrice: Joi.number().optional(),
    VariantId: Joi.number().required(),
  });

  let result = schema.validate(req.body);
  if (result.error) {
    return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
  }
  await next();
};
exports.updateBulkPricing = async (req, res, next) => {
  const schema = Joi.object({
    from: Joi.number().positive().optional(),
    to: Joi.number().positive().optional(),
    price: Joi.number().positive().optional(),
    premiumPrice: Joi.number().positive().optional(),
    VariantId: Joi.number().positive().optional(),
  });

  let result = schema.validate(req.body);
  if (result.error) {
    return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
  }
  await next();
};
