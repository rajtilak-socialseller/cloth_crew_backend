const Joi = require("joi");

const createReturn = Joi.object({
  length: Joi.number().required(),
  breadth: Joi.number().required(),
  height: Joi.number().required(),
  weight: Joi.number().required(),
  ShipRocketOrderItemId: Joi.number().required(),
});

const updateReturn = Joi.object({
  length: Joi.number(),
  breadth: Joi.number(),
  height: Joi.number(),
  weight: Joi.number(),
  ShipRocketOrderItemId: Joi.number(),
});

exports.validateCreateParcel = (req, res, next) => {
  const { error } = createReturn.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};

exports.validateUpdateParcel = (req, res, next) => {
  const { error } = updateReturn.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  next();
};
