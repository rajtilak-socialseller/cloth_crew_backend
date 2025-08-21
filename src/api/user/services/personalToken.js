const crypto = require('crypto')
module.exports = ({ tenant_name, username }) => {
    try {
        function generateRandomPart(length) {
            const buffer = crypto.randomBytes(length);
            return buffer.toString('hex');
        }
        const randomPart = generateRandomPart(4); // You can adjust the length of the random part as needed
        const uniqueString = `${tenant_name.split("_").join("").slice(0, 4)}${randomPart}${username.split("_").join("").slice(0, 4)}`;
        return uniqueString.toUpperCase();
    } catch (error) {
        //console.log(error)
    }
}