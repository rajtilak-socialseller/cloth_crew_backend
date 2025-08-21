
// Middleware for wallet
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
                "amount": Joi.number().positive().required(),
                "remark": Joi.string().required(),
                "StoreUserId": Joi.number().required(),
            });
            return JoiSchema.validate(body);
        }

        let result = validate(req.body);
        if (result.error) {
            return res.status(400).send(errorResponse({
                message: result.error.message,
                details: result.error.details
            }));
        } else {
            await next(); // Corrected the square brackets to curly braces
        }
    },
    async validateWithdraw(req, res, next) {
        try {
            const JoiSchema = Joi.object({
                "mode": Joi.string().valid("upi", "bank").required(),
                "account_number": Joi.when("mode", {
                    is: "bank",
                    then: Joi.string().required(),
                    otherwise: Joi.forbidden()
                }),
                "ifsc": Joi.when("mode", {
                    is: "bank",
                    then: Joi.string().required(),
                    otherwise: Joi.forbidden()
                }),
                "upi_address": Joi.when("mode", {
                    is: "upi",
                    then: Joi.string().required(),
                    otherwise: Joi.forbidden()
                }),
                "amount": Joi.number().positive().required()
            })

            let result = JoiSchema.validate(req.body)
            if (result.error) {
                return res.status(400).send(errorResponse({ message: result.error.details, details: result.error.details }))
            } else next()

        } catch (error) {
            //console.log(error)
            return res.status(500).send(error)
        }
    }
}
