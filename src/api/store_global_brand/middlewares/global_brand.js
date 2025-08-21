const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
  async validateRequest(req, res, next) {
    function validate(body) {
      const JoiSchema = Joi.object({
        name: Joi.string().optional(),
        LogoIdDark: Joi.number().optional().allow(""),
        LogoIdLight: Joi.number().optional().allow(""),
        FavIconId: Joi.number().optional().allow(""),
        tagline: Joi.string().optional().allow(""),
        whatsapp_number: Joi.string().optional().allow(""),
        calling_number: Joi.string().optional().allow(""),
        email: Joi.string().email().optional().allow(""),
        about_us: Joi.string().optional().allow(""),
        address: Joi.string().optional().allow(""),
        instagram: Joi.string().optional().allow(""),
        facebook: Joi.string().optional().allow(""),
        telegram: Joi.string().optional().allow(""),
        youtube: Joi.string().optional().allow(""),
      });

      return JoiSchema.validate(body);
    }

    let result = validate(req.body);
    if (result.error) {
      return res.status(400).send(errorResponse({
        status: 400,
        message: result.error.message,
        details: result.error.details,
      }));
    }
    await next();
  },
};
