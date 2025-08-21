const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");
const { order_status } = require("../../../constants/order");

exports.validateCreateCustomCourier = async (req, res, next) => {
  const schema = Joi.object({
    images: Joi.array().items(Joi.number()).optional(),
    trackingId: Joi.string().required(),
    courierName: Joi.string().required(),
    courierEmail: Joi.string().required().email(),
    phone: Joi.string().required(),
    OrderVariantId: Joi.number().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }

  const sequelize = req.db;
  const orderVariantId = req.body.OrderVariantId;

  const orderVariant = await sequelize.models.Order_variant.findByPk(orderVariantId);

  if (!orderVariant) {
    return res.status(400).send(
      errorResponse({
        status: 400,
        message: "Order is not available",
      })
    );
  }

  if (orderVariant.status !== order_status.accepted) {
    return res.status(400).send(
      errorResponse({
        status: 400,
        message: "Order is not accepted by the administrator",
      })
    );
  }

  next();
};

exports.validateReturnCustomCourier = async (req, res, next) => {
  const schema = Joi.object({
    OrderVariantId: Joi.number().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }

  const sequelize = req.db;
  const orderVariantId = req.body.OrderVariantId;

  const customCourier = await sequelize.models.Custom_courier.findOne({ where: { OrderVariantId: orderVariantId } });

  if (!customCourier) {
    return res.status(400).send(
      errorResponse({
        status: 400,
        message: "Order is not placed by custom courier",
      })
    );
  }

  const orderVariant = await sequelize.models.Order_variant.findByPk(orderVariantId);

  if (orderVariant.status !== order_status.return_accepted) {
    return res.status(400).send(
      errorResponse({
        status: 400,
        message: "Return request is not accepted yet ",
      })
    );
  }

  next();
};

exports.validateUpdateCustomCourier = (req, res, next) => {
  const schema = Joi.object({
    images: Joi.array().items(Joi.number()).optional(),
    trackingId: Joi.string(),
    courierName: Joi.string(),
    courierEmail: Joi.string().email(),
    phone: Joi.string(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }

  next();
};
