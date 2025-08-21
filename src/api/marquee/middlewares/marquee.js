
// Middleware for marquee
// Customize the middleware code here

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 */

// write code below


const Joi = require("joi")

module.exports = {
    async validateRequest(req, res, next) {

        const JoiSchema = Joi.object({
            "name": Joi.string().optional(),
            "active": Joi.boolean().required(),
            "ImageId": Joi.number().required()
        });

        let result = JoiSchema.validate(req.body);
        if (result.error) {
            return res.status(400).send(errorResponse({
                message: result.error.message,
                details: result.error.details
            }));
        }
        next();
    }
}
