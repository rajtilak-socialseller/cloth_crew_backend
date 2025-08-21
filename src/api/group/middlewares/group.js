const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
  async validateRequest(req, res, next) {
    function validateGroup(body) {
      const JoiSchema = Joi.object({
        name: Joi.string().required(),
        url: Joi.string().required(),
      });

      return JoiSchema.validate(body);
    }

    let result = validateGroup(req.body);
    if (result.error) {
      return res.status(400).send(
        errorResponse({
          status: 400,
          message: result.error.message,
          details: result.error.details,
        })
      );
    } else {
      await next();
    }
  },
};
