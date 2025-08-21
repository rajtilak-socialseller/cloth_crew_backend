const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
    async validateCreateRequest(req, res, next) {
        function validate(body) {
            const JoiSchema = Joi.object({
                name: Joi.string().required(),
                validity: Joi.number().positive().required(),
                price: Joi.number().positive().required(),
                description: Joi.string().required(),
                is_active: Joi.boolean().optional(),
                cod_allowed: Joi.boolean().required(),
                prepaid_allowed: Joi.boolean().required(),
                premium_pricing: Joi.boolean().required(),
            });
            return JoiSchema.validate(body);
        }
        let result = validate(req.body);
        if (result.error) return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }))
        else await next();

    },
    async validateUpdateRequest(req, res, next) {
        function validate(body) {
            const JoiSchema = Joi.object({
                name: Joi.string().optional(),
                validity: Joi.number().positive().optional(),
                price: Joi.number().positive().optional(),
                description: Joi.string().optional(),
                is_active: Joi.boolean().optional(),
                premium_pricing: Joi.boolean().optional(),
                cod_allowed: Joi.boolean().optional(),
                prepaid_allowed: Joi.boolean().optional(),
            });
            return JoiSchema.validate(body);
        }
        let result = validate(req.body);
        if (result.error) return res.status(400).send(errorResponse({ message: result.error.message, details: result.error.details }))
        else await next();
    }
}
