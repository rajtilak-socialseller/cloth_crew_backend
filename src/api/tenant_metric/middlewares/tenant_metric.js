const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
  async validateRequest(req, res, next) {
    function validate(body) {
      const JoiSchema = Joi.object({
        total_spendings: Joi.number(),
        total_products: Joi.number().integer().min(0),
        total_users: Joi.number().integer().min(0),
        total_orders: Joi.number().integer().min(0),
        total_leads: Joi.number().integer().min(0),
        total_transaction: Joi.number().integer().min(0),
        total_disk_usage: Joi.number().integer().min(0),
      });

      return JoiSchema.validate(body);
    }

    let result = validate(req.body);
    if (result.error) {
      return res.status(400).send(
        errorResponse({
          message: result.error.message,
          details: result.error.details,
        })
      );
    } else {
      await next();
    }
  },
};
