const router = require("express").Router();
const ordersController = require("../controllers/order");
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const { validateOrderBody, checkUserSubscription } = require("../middlewares/order-validations");
const { validate_variant, validateWalletOrder } = require("../middlewares/validate-variant");

const permissions = [
  {
    api: "orders",
    endpoint: "/api/orders/checkout/cashfree",
    method: "POST",
    handler: "Create Cashfree Order",
  },

  {
    api: "orders",
    endpoint: "/api/orders/verify/cashfree",
    method: "GET",
    handler: "Verify Cashfree Order",
  },

  {
    api: "orders",
    endpoint: "/api/orders",
    method: "GET",
    handler: "List Orders",
  },
  {
    api: "orders",
    endpoint: "/api/orders",
    method: "POST",
    handler: "Create Order",
  },
  {
    api: "orders",
    endpoint: "/api/orders/search",
    method: "GET",
    handler: "Search Orders",
  },
  {
    api: "orders",
    endpoint: "/api/orders/:id",
    method: "GET",
    handler: "Find Order",
  },
  {
    api: "orders",
    endpoint: "/api/orders/:id",
    method: "PUT",
    handler: "Update Order",
  },
  {
    api: "orders",
    endpoint: "/api/orders/checkout/razorpay",
    method: "POST",
    handler: "Checkout Razorpay Order",
  },
  {
    api: "orders",
    endpoint: "/api/orders/verify/razorpay",
    method: "POST",
    handler: "Verify Razorpay Order",
  },
  {
    api: "orders",
    endpoint: "/api/orders/webhook/razorpay",
    method: "POST",
    handler: "Razorpay Webhook",
  },
  {
    api: "orders",
    endpoint: "/api/orders/checkout/wallet",
    method: "POST",
    handler: "Checkout Wallet Order",
  },
  {
    api: "orders",
    endpoint: "/api/orders/reseller/payout/:id",
    method: "GET",
    handler: "Reseller Payout",
  },
  {
    api: "orders",
    endpoint: "/api/orders/export",
    method: "POST",
    handler: "Export ORders",
  },

];

module.exports = (app) => {

  router.post("/checkout/cashfree", [StoreRBAC], ordersController.createCashfreeOrder);
  router.get("/verify/cashfree", ordersController.verifyCashfree);
  router.post("/export", ordersController.exportToExcel);
  router.get("/", [], ordersController.find);
  router.post("/", ordersController.create);
  router.get("/search", ordersController.searchOrders);
  router.get("/:id/invoice", ordersController.generateInvoice);
  router.get("/:id", ordersController.findOne);
  router.put("/:id", ordersController.update);
  router.post("/checkout/razorpay", [StoreRBAC, validateOrderBody, validate_variant, checkUserSubscription], ordersController.checkOut
  );
  router.post("/verify/razorpay", ordersController.verify);
  router.post("/verify/phonepe", ordersController.phonePayVerify)
  router.post("/webhook/razorpay", ordersController.webhook);
  router.post("/checkout/wallet", [validateOrderBody, validate_variant, checkUserSubscription], ordersController.checkOutWallet);
  router.get("/reseller/payout/:id", ordersController.resellerPayout);
  app.use("/api/orders", router);
};

module.exports.permissions = permissions;
