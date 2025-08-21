const Joi = require("joi");

module.exports = {
  validateFreePlan(req, res, next) {
    const schema = Joi.object({
      "name": Joi.string().required(),
      "description": Joi.string().required(),
      "maxUsers": Joi.number().required(),
      "maxProducts": Joi.number().required(),
      "premiumPricing": Joi.boolean().required(),
      "codAllowed": Joi.boolean().required(),
      "prepaidAllowed": Joi.boolean().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }

    next();
  },
};
