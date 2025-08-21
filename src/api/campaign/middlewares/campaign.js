
// Middleware for banner
// Customize the middleware code here

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */

// write code below


const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
    async validateRequest(req, res, next) {

        function validate(body) {
            const JoiSchema = Joi.object({
                "notification_title": Joi.string().required(),
                "notification_body": Joi.string().required(),
                "data": Joi.string().required(),
                "NotificationImageId": Joi.number().positive().required(),
                "type": Joi.string().valid("LINK", "PRODUCT", "COLLECTION"),
                "web_notification": Joi.boolean().optional(),
                "app_notification": Joi.boolean().optional(),

            });
            return JoiSchema.validate(body);
        }

        let result = validate(req.body);
        if (result.error) {
            return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }))
        } else {
            await next();
        }
    }
}
