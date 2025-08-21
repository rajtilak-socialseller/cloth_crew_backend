const { default: axios } = require("axios")

module.exports = async(phone, otp) => {
    try {
        const axiosBody = {
            template_id: "656ec220d6fc0550c2082f12",
            short_url: 0,
            recipients: [
                {
                    mobiles: "+91" + phone,
                    var1: otp,
                },
            ],
        };

        //console.log(url, global.msg91_api_key, global.msg91_template_id)

        const send_sms = await axios.post("https://control.msg91.com/api/v5/flow/", axiosBody, {
            headers: {
                authkey: "275588AIHmHWVyjtu5cd18c59",
            },
        });
        console.log(send_sms.data)
        return send_sms
    } catch (error) {
        console.log(error)
        return error
    }
}