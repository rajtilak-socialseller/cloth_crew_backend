const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const subscriptionController = require("../controllers/server_subscription");
const { validateRequest, checkPlan, validateTags, checkExistingSubscription, verifySchema } = require("../middlewares/server_subscription");

const permissions = [
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions",
    method: "POST",
    handler: "Create Server Subscription",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions",
    method: "GET",
    handler: "List Server Subscriptions",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/cf-verify",
    method: "GET",
    handler: "CF Verify",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/:id",
    method: "GET",
    handler: "Find Server Subscription",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/:id",
    method: "PUT",
    handler: "Update Server Subscription",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/:id",
    method: "DELETE",
    handler: "Delete Server Subscription",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/checkout",
    method: "POST",
    handler: "Checkout Server Subscription",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/verify",
    method: "POST",
    handler: "Verify Server Subscription",
  },
  {
    api: "server-subscriptions",
    endpoint: "/api/server-subscriptions/webhooks",
    method: "POST",
    handler: "Server Subscription Webhook",
  },
];

// Define routes for the "Post" resource
module.exports = (app) => {
  router.post("/", [RBAC, validateRequest], subscriptionController.create);
  router.get("/", [], subscriptionController.find);
  router.get("/cf-verify", [RBAC], subscriptionController.CFVerify);
  router.get("/:id", [RBAC], subscriptionController.findOne);
  router.put("/:id", [RBAC], subscriptionController.update);
  router.delete("/:id", [RBAC], subscriptionController.delete);
  router.post("/checkout", [RBAC, validateRequest, checkPlan, checkExistingSubscription], subscriptionController.checkOut);
  router.post("/verify", [RBAC, verifySchema], subscriptionController.verify);
  router.post("/webhooks", subscriptionController.webhook);
  // router.put('/:id/cancel', subscriptionController.refund);
  app.use("/api/server-subscriptions", router);
};

module.exports.permissions = permissions;
