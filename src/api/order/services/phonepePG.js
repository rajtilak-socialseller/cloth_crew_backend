const { default: axios } = require("axios");
const crypto = require("crypto")
const { v4: uuidv4 } = require('uuid');

// Function to create a new order
const createNewOrder = (amount, userId) => {
    const orderId = uuidv4();  // Generate a unique order ID
    // Save order details to the database
    // saveOrderToDatabase(orderId, amount, userId);
    return orderId;
};


// const merchantId = 'YOUR_MERCHANT_ID';
// const secretKey = 'YOUR_SECRET_KEY';

const createSignature = (data, secret) => {
    return crypto.createHmac('sha256', secret).update(data).digest('base64');
};

module.exports = async ({
  merchantId,
  body,
  secretKey, // Now using clean variable naming
  amount,
  client,
  keyIndex = 1, // Default index; ensure it matches what's configured in PhonePe dashboard
}) => {
  try {
    // ✅ Basic validation
    if (!merchantId || !secretKey) {
      throw new Error("Missing merchantId or secretKey");
    }

    const merchantTransactionId = "T" + Date.now();
    const redirectUrl = `https://xiinks.mtlapi.socialseller.in/api/orders/verify/phonepe?id=${merchantTransactionId}`;

    const data = {
      merchantId,
      merchantTransactionId,
      merchantUserId: "MUID" + Date.now(),
      name: body.consumer?.name || "Customer",
      amount: amount * 100, // paise
      redirectUrl,
      redirectMode: "POST",
      mobileNumber: body.consumer?.phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payload = JSON.stringify(data);
    const payloadBase64 = Buffer.from(payload).toString("base64");

    // ✅ Create string to sign and generate checksum
    const stringToSign = payloadBase64 + "/pg/v1/pay" + secretKey;
    const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
    const checksum = `${sha256}###${keyIndex}`;

    // ✅ Sandbox API URL (make sure you're using sandbox credentials)
    // const phonepeURL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

    const phonepeURL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

    const options = {
      method: "POST",
      url: phonepeURL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": merchantId,
      },
      data: {
        request: payloadBase64,
      },
    };

    console.log("PhonePe Payment Request:", {
      merchantId,
      keyIndex,
      requestBody: data,
      checksum,
    });

    const response = await axios.post(options);
    console.log("PhonePe Payment Response:",response);
    const resData = response?.data;


    // ✅ Success
    return {
      success: true,
      data: {
        merchantTransactionId,
        redirectUrl: resData?.data?.instrumentResponse?.redirectInfo?.url,
        raw: resData,
      },
    };
  }catch (error) {
  console.error(
    "PhonePe API Error:",
    error?.response?.data || error.message || error
  );
  return {
    success: false,
    message:
      error?.response?.data?.message || "PhonePe payment request failed",
    data: error?.response?.data || {},
    amount,
    order_id: body?.order_id, // optional if you want to return it
  };
  }
};