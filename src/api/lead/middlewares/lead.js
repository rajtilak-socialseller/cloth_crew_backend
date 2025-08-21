const Joi = require("joi");
const jwt = require("../../../services/jwt");
const {
  errorResponse,
  tokenError,
} = require("../../../services/errorResponse");

module.exports = {
  async createLeadValidate(req, res, next) {
    const sequelize = req.db;
    const body = req.body;
    let role;
    let user;
    if (req.headers.hasOwnProperty("authorization")) {
      const token = jwt.verify(req);
      if (token.error) return res.status(403).send(tokenError(token));
      user = await sequelize.models.User.findByPk(token.id, {
        include: "role",
      })
      role = user.role.name;
    } else {
      role = "Public";
    }
    //console.log(role)
    // if (role !== "Super_Admin" && body.hasOwnProperty("AssignedTo")) {
    //   return res.status(400).send(errorResponse({ status: 400, message: "AssignedTo Is Now allwed!" }))
    // }
    // if (role !== "Staff" && body.hasOwnProperty("AssignedTo")) {
    //   return res.status(400).send(errorResponse({ status: 400, message: "AssignedTo Is Now allwed!" }))
    // }
    // if (role !== "Public" && (body.hasOwnProperty("name") || body.hasOwnProperty("phone"))) {
    //   return res.status(400).send(errorResponse({ status: 400, message: "Name or Phone Is Now allwed!" }))
    // }
    // if (role === "Staff") {
    //   req.body.AssignedTo = user.id
    // }

    const JoiSchema = Joi.object({
      name: Joi.string().optional(),
      phone: Joi.number().positive().optional(),
      AssignedTo: Joi.number().positive().optional(),
      consumer_note: Joi.string().optional(),
      quantity: Joi.number().positive().optional(),
      staff_note: Joi.string().optional(),
      status: Joi.string()
        .valid(
          "OPEN",
          "UNDER_CONNECTION",
          "FOLLOWUP",
          "ON_HOLD",
          "CANCELLED",
          "COMPLETED",
          "COMFIRMED"
        )
        .required(),
      source: Joi.string()
        .valid(
          "WHATSAPP",
          "INSTAGRAM",
          "SOCIAL_SELLER_WEBSITE",
          "YOUTUBE_CHANNEL",
          "APP",
          "WEBSITE"
        )
        .required(),
    });

    let result = JoiSchema.validate(body);
    if (result.error)
      return res.status(400).send(errorResponse({
        message: result.error.message,
        details: result.error.details,
      }));
    await next();
  },
  async updateLeadValidate(req, res, next) {
    const sequelize = req.db;
    const body = req.body;

    const JoiSchema = Joi.object({
      AssignedTo: Joi.number().optional().positive(),
      status: Joi.string().valid(
        "OPEN",
        "UNDER_CONNECTION",
        "FOLLOWUP",
        "ON_HOLD",
        "CANCELLED",
        "COMPLETED",
        "COMFIRMED",
      ).optional(),
      "name": Joi.string().optional(),
      "phone": Joi.string().optional(),
      "source": Joi.string().valid("WHATSAPP", "INSTAGRAM", "SOCIAL_SELLER_WEBSITE", "YOUTUBE_CHANNEL", "APP", "WEBSITE").optional(),
      "type": Joi.string().valid("HOT_LEAD", "WARM_LEAD", "COLD_LEAD", "NOT_CONNECTED",).optional(),
      "consumer_note": Joi.string().optional(),
      "staff_note": Joi.string().optional(),
      "quantity": Joi.string().optional(),
    });

    let result = JoiSchema.validate(body);
    if (result.error)
      return res.status(400).send(errorResponse({
        message: result.error.message,
        details: result.error.details,
      }));
    await next();
  },
};
