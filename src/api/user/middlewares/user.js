const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");
const store_types = require("../../../constants/store_types");
module.exports = {
  async createBody(req, res, next) {
    try {
      function validate(body) {
        const JoiSchema = Joi.object({
          "username": Joi.string().required(),
          "password": Joi.string().optional(),
          "email": Joi.string().optional(),
          "subdomain": Joi.string().required(),
          "store_type": Joi.string()
            .valid(...store_types)
            .required(),
          "PlanId": Joi.number().positive().optional(),
          "brand_name": Joi.string().allow(null, "").optional(),
          "tag_line": Joi.string().allow(null, "").optional(),
          "whatsapp_number": Joi.string().allow(null, "").optional(),
          "calling_number": Joi.string().allow(null, "").optional(),
          "address": Joi.string().allow(null, "").optional(),
          "youtube": Joi.string().allow(null, "").optional(),
          "instagram": Joi.string().allow(null, "").optional(),
          "facebook": Joi.string().allow(null, "").optional(),
          "telegram": Joi.string().allow(null, "").optional(),
          "logo": Joi.string().optional(),
          "country_code": Joi.string().optional(),
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
        await next(); // Corrected the square brackets to curly braces
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },

  // function to validate body for admin registration
  async createAdminBody(req, res, next) {
    try {
      function validate(body) {
        const JoiSchema = Joi.object({
          username: Joi.string().required(),
          password: Joi.string().required(),
          email: Joi.string().required(),

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
        await next(); // Corrected the square brackets to curly braces
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },

  // function to update user

  async updateBody(req, res, next) {
    try {
      const body = req.body;
      const JoiSchema = Joi.object({
        password: Joi.string().optional(),
        email: Joi.string().optional(),
        store_type: Joi.string()
          .valid("B2B", "ECOMMERCE", "RESELLER_ECOM", "WHATSAPP")
          .required(),
        is_active: Joi.boolean().required()
      });

      let result = JoiSchema.validate(body);

      if (result.error) {
        return res.status(400).send(
          errorResponse({
            message: result.error.message,
            details: result.error.details,
          })
        );
      } else {
        await next(); // Corrected the square brackets to curly braces
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },

  //  function to validate user & admin login
  async validateLoginBody(req, res, next) {
    try {
      const body = req.body;
      const JoiSchema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
      });
      let result = JoiSchema.validate(body);

      if (result.error) {
        return res.status(400).send(
          errorResponse({
            message: result.error.message,
            details: result.error.details,
          })
        );
      }
      return await next();
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  },
};
