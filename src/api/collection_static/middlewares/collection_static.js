const Joi = require("joi");

module.exports = {
  async validateCreateRequest(req, res, next) {
    function validate(body) {
      const JoiSchema = Joi.object({
        name: Joi.string().required(),
        tag: Joi.string().required(),
      });

      return JoiSchema.validate(body);
    }

    let result = validate(req.body);
    if (result.error) {
      return res.status(400).send({ error: result.error.details[0].message });
    } else {
      await next();
    }
  },

  async validateUpdateRequest(req, res, next) {
    function validate(body) {
      const JoiSchema = Joi.object({
        name: Joi.string(),
        tag: Joi.string(),
      }).min(1); // Makes all fields optional

      return JoiSchema.validate(body);
    }

    let result = validate(req.body);
    if (result.error) {
      return res.status(400).send({ error: result.error.details[0].message });
    } else {
      await next();
    }
  },
};
