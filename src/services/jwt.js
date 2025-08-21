const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET
module.exports = {
    issue(payload) {
        try {
            const token = JWT.sign(payload, JWT_SECRET, { expiresIn: "7d" })
            return token
        } catch (error) {
            //console.log(error)
            return { error }
        }
    },
    verify(req) {
        try {
            if (req.headers.hasOwnProperty("authorization")) {

                const token = req.headers.authorization.split(" ")[1]
                const data = JWT.verify(token, JWT_SECRET)
                return data
            } else {
                return { error: "No Bearer token pass in request" }
            }
        } catch (error) {
            //console.log(error)
            return { error }
        }
    }
}
