const Joi = require("joi");

const { Op } = require("sequelize");
const {
  errorResponse,
  tokenError,
} = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");

module.exports = {
  async createUser(req, res, next) {
    const sequelize = req.db;
    let role;
    const body = req.body;
    // if (req.headers.hasOwnProperty("authorization")) {
    //   const token = jwt.verify(req);
    //   if (token.error) return res.status(403).send(tokenError(token));
    //   const storeUser = await sequelize.models.Store_user.findByPk(token.id, {
    //     include: "role",
    //   });
    //   role = storeUser.role.name.toString();
    //   if (role !== "Admin" && body.hasOwnProperty("RoleId"))
    //     return res
    //       .status(400)
    //       .send(errorResponse({ message: "RoleId is not allowed!" }));
    // } else {
    //   return res
    //     .status(403)
    //     .send(
    //       errorResponse({
    //         status: 403,
    //         message: "Your are not allowed to access this endpoint",
    //       })
    //     );
    // }

    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      phone: Joi.string().regex(/^\+91\s?[0-9]{10}$/).required(),
      RoleId: Joi.number().positive().optional(),
      AvatarId: Joi.number().positive().optional().allow(null),
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json(errorResponse({ message: error.message, details: error.details }));
    }
    next();
  },
  async updateUser(req, res, next) {
    const sequelize = req.db;
    const body = req.body;
    const schema = Joi.object({
      name: Joi.string().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().optional(),
      AvatarId: Joi.number().positive().optional().allow(null),
    });

    const { error } = schema.validate(req.body);

    if (error) { return res.status(400).json(errorResponse({ message: error.message, details: error.details })); }
    next();
  },
  async FCM_registration(req, res, next) {
    try {
      const validateBody = (body) => {
        const JoiSchema = Joi.object({
          FCM_web_token: Joi.string(),
          FCM_app_token: Joi.string()
        }).or('FCM_web_token', 'FCM_app_token').without('FCM_web_token', 'FCM_app_token');
        return JoiSchema.validate(body)
      }
      let result = validateBody(req.body)
      if (result.error) {
        return res.status(400).send(requestError({ message: result.error.message, details: result.error.details }));
      }
      return await next()
    } catch (error) {
      //console.log(error)
      return res.status(500).send(error)
    }
  },
  async validatelogin(req, res, next) {
    try {
      const JoiSchema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
      });
      let result = JoiSchema.validate(req.body)
      if (result.error) {
        return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
      }
      next()
    } catch (error) {
      //console.log(error)
      return res.status(500).send(error)
    }
  },
  async forgetPassword(req, res, next) {
    try {
      const JoiSchema = Joi.object({
        email: Joi.string().email().required(),
      })

      let result = JoiSchema.validate(req.body)
      if (result.error) {
        return res.status(errorResponse({ message: result.error.message, details: result.error.details }))
      }
      next()
    } catch (error) {
      //console.log(error)
      return res.status(500).send(errorResponse({ status: 500, message: error.message }))
    }
  },
  async resetPassword(req, res, next) {
    try {
      const JoiSchema = Joi.object({
        password: Joi.string().required(),
      })

      let result = JoiSchema.validate(req.body)
      if (result.error) {
        return res.status(errorResponse({ message: result.error.message, details: result.error.details }))
      }
      next();
    } catch (error) {
      //console.log(error)
      return res.status(500).send(errorResponse({ status: 500, message: error.message }))
    }
  },
  async validateSendOTP(req, res, next) {
    try {
      const JoiSchema = Joi.object({
        phone: Joi.string().required(),
      });
      let result = JoiSchema.validate(req.body)
      if (result.error) {
        return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
      }
      next()
    } catch (error) {
      //console.log(error)
      return res.status(500).send(error)
    }
  },
  async validateVerifyOTP(req, res, next) {
    try {
      const JoiSchema = Joi.object({
        phone: Joi.string().required(),
        otp: Joi.string().required()
      });
      let result = JoiSchema.validate(req.body)
      if (result.error) {
        return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
      }
      next()
    } catch (error) {
      //console.log(error)
      return res.status(500).send(error)
    }
  },
};
