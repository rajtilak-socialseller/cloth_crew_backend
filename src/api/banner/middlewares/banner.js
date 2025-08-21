const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
  async validateRequest(req, res, next) {
    const JoiSchema = Joi.object({
      action: Joi.string().valid("COLLECTION", "LINK", "PRODUCT"),
      data: Joi.string().required(),
      type: Joi.string().valid("HEADER", "SEPARATOR").required(),
      MobileThumbnailId: Joi.number().required(),
      DesktopThumbnailId: Joi.number().required(),
    });

    let result = JoiSchema.validate(req.body);

    if (result.error) {
      return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
    } else {
      await next();
    }
  },
};
