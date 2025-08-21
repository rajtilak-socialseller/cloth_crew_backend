
// Middleware for permission
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
                "RoleId": Joi.number().positive().required(),
                "PermissionId": Joi.array().items(Joi.number().positive()).min(1)
            });

            return JoiSchema.validate(body);
        }

        let result = validate(req.body);
        if (result.error) {
            return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
        } else {
            await next(); // Corrected the square brackets to curly braces
        }
    },

}
