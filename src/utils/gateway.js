const Razorpay = require("razorpay");
const dbConnection = require("./dbConnection");

exports.getRazorpay = async ({ razorpay_key, razorpay_secret }) => {
  return new Razorpay({
    key_id: razorpay_key,
    key_secret: razorpay_secret,
  });
}

exports.defaultRazorpay = async () => {
  const razorpay_key = process.env.RAZORPAY_KEY_ID;
  const razorpay_secret = process.env.RAZORPAY_KEY_SECRET;
  const instance = new Razorpay({
    key_id: razorpay_key,
    key_secret: razorpay_secret,
  });

  return {
    instance,
    credential: {
      razorpay_key,
      razorpay_secret,
    }
  };
};
