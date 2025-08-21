
// Middleware for testimonial
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
                "content": Joi.string().required(),
                "rating": Joi.number().min(1).max(5).required(),
                "VideoId": Joi.number().positive().optional().allow(null),
                "name": Joi.string().required(),
                "ThumbnailId": Joi.number().optional()
            });
            return JoiSchema.validate(body);
        }
        let result = validate(req.body);
        if (result.error) {
            return res.status(400).send(errorResponse({
                message: result.error.message,
                details: result.error.details
            }));
        }
        next();
    }
}
