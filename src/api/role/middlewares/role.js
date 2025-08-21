// Middleware for role
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
    async validateCreateBody(req, res, next) {
        const JoiSchema = Joi.object({
            "name": Joi.string().optional(),
            "description": Joi.string().optional(),
            "permissions": Joi.array().items(Joi.number().positive()).min(0).required()
        });

        let result = JoiSchema.validate(req.body);

        if (result.error) {
            return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
        } else {
            await next(); // Corrected the square brackets to curly braces
        }
    },
    async validateUpdateBody(req, res, next) {
        const JoiSchema = Joi.object({
            "name": Joi.string().optional(),
            "description": Joi.string().optional(),
            "permissions": Joi.array().items(Joi.number().positive()).min(0).required(),
            "delete_permissions": Joi.array().items(Joi.number().positive()).min(0).required(),
        });

        let result = JoiSchema.validate(req.body);

        if (result.error) {
            return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }));
        } else {
            await next(); // Corrected the square brackets to curly braces
        }
    }
}

