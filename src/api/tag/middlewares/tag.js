
const Joi = require("joi");
const { errorResponse } = require("../../../services/errorResponse");

module.exports = {
    async validateRequest(req, res, next) {
        function validate(body) {
            const JoiSchema = Joi.object({
                "tags": Joi.array().items(Joi.string()).min(1),
                "ProductId": Joi.number().required()
            });
            return JoiSchema.validate(body);
        }
        let result = validate(req.body);
        if (result.error) {
            return res.status(400).send(errorResponse({ status: 400, message: result.error.message, details: result.error.details }));
        }
        next();
    }
}
