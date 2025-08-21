const { default: axios } = require("axios");

/**
 * 
 * @param {Object} data 
 * @param {boolean} data.containsImage
 * @param {boolean} data.hasButton
 * @param {string} data.phoneNumber
 * @param {Array<string>} data.body
 * @param {string} data.image
 * @param {import("sequelize").Sequelize} sequelize 
 * @param {string} type 
 * @returns {boolean}
 */

const IntraktNotify = async (data, sequelize, type) => {
    try {

        const global = await sequelize.models.Store_global.findOne();
        const interakt_api_key = global.interakt_api_key;

        // let templateName = data.template;
        let image;
        if (data.headerText === undefined || data.headerText === null) {
            image = data.containsImage === true ? data.image : null;
        } else {
            image = data.headerText;
        }

        if (data.phoneNumber == null) {
            //console.log("No Phone Number");
            return { error: "No phone number found!" };
        } else {
            var phone = data.phoneNumber.toString().slice(-10);
        }


        let dataAPI = {
            countryCode: "+91",
            phoneNumber: phone,
            type: "Template",
            template: {
                name: null,
                languageCode: "en",
                headerValues: [image],
                bodyValues: [...data.body],
            },
        };

        switch (type) {
            case "OTP":
                delete dataAPI.template.headerValues;
                dataAPI.template.name = global.otp_template_id
                break;
            case "PRODUCT":
                dataAPI.template.name = global.product_template_id
                break;
            case "ORDER":
                dataAPI.template.name = global.order_template_id
                break;
            case "PAYOUT":
                dataAPI.template.name = global.payout_template_id
                break;
            case "SUBSCRIPTION":
                dataAPI.template.name = global.subscription_template_id
                break;
            case "COLLECION":
                dataAPI.template.name = global.collection_template_id
                break;
            case "CAMPAIGN":
                dataAPI.template.name = global.campaign_template_id
                dataAPI.template["buttonValues"] = data.buttonValues
                break;
            default:
                break;
        }

        const resp = await axios.post(process.env.INTERAKT_URL, dataAPI, {
            headers: {
                Authorization: `Basic ${interakt_api_key}`,
            },
        });
        console.log(resp.data)
        return true;
    } catch (error) {
        console.log(error)
        return error
    }
};


/**
 * 
 * @param {Object} data 
 * @param {boolean} data.containsImage
 * @param {boolean} data.hasButton
 * @param {string} data.phoneNumber
 * @param {Array<string>} data.body
 * @param {Array<string>} data.buttonValues
 * @param {string} data.image
 * @param {string} type 
 * @returns {boolean}
 */

async function storeCreateNotify(data, countryCode) {
    try {
        //console.log(data)
        const interakt_api_key = "MjVFdVlrTXB2UlpWdjFtcm1adnozaURRNlNTLTNrcEtfenVJck9pNGNTdzo=";

        // let templateName = data.template;
        let image;
        if (data.headerText === undefined || data.headerText === null) {
            image = data.containsImage === true ? data.image : null;
        } else {
            image = data.headerText;
        }

        if (data.phoneNumber == null) {
            //console.log("No Phone Number");
            return { error: "No phone number found!" };
        } else {
            var phone = data.phoneNumber.toString().slice(-10);
        }


        let dataAPI = {
            countryCode: countryCode || "+91",
            phoneNumber: phone,
            type: "Template",
            template: {
                name: "store_create_yi",
                languageCode: "en",
                headerValues: [image],
                bodyValues: [...data.body],
                buttonValues: data.buttonValues
            },
        };

        const resp = await axios.post(process.env.INTERAKT_URL, dataAPI, {
            headers: {
                Authorization: `Basic ${interakt_api_key}`,
            },
        });

        return true;
    } catch (error) {
        //console.log(error)
        return error
    }
}
/**
 * 
 * @param {Object} data 
 * @param {boolean} data.containsImage
 * @param {boolean} data.hasButton
 * @param {string} data.phoneNumber
 * @param {Array<string>} data.body
 * @param {Array<string>} data.buttonValues
 * @param {string} data.image
 * @param {string} type 
 * @returns {boolean}
 */

async function subscriptionExpireNotify(data) {
    try {
        // console.log(data)
        const interakt_api_key = "MjVFdVlrTXB2UlpWdjFtcm1adnozaURRNlNTLTNrcEtfenVJck9pNGNTdzo=";
        // let templateName = data.template;
        let image;
        if (data.headerText === undefined || data.headerText === null) {
            image = data.containsImage === true ? data.image : null;
        } else {
            image = data.headerText;
        }

        if (data.phoneNumber == null) {
            //console.log("No Phone Number");
            return { error: "No phone number found!" };
        } else {
            var phone = data.phoneNumber.toString().slice(-10);
        }


        let dataAPI = {
            countryCode: "+91",
            phoneNumber: data.phoneNumber,
            type: "Template",
            template: {
                name: "update_notification",
                languageCode: "en",
                headerValues: [image],
                bodyValues: [...data.body],
                buttonValues: data.buttonValues
            },
        };

        const resp = await axios.post("https://api.interakt.ai/v1/public/message/", dataAPI, {
            headers: {
                Authorization: `Basic ${interakt_api_key}`,
            },
        });
        console.log(resp.data)
        return true;
    } catch (error) {
        console.log(error)
        return error
    }
}

module.exports = { IntraktNotify, storeCreateNotify, subscriptionExpireNotify };