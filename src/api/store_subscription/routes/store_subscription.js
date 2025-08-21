const express = require("express");
const router = express.Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const subscriptionController = require("../controllers/store_subscription");
const {
  validateRequest,
  checkPlan,
  validateTags,
  checkExistingSubscription,
  validateUserSubscription,
  validateSF,
} = require("../middlewares/store_subscription");

const permissions = [
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions",
    method: "POST",
    handler: "Create Store Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions",
    method: "GET",
    handler: "Find Store Subscriptions",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/server-fee",
    method: "GET",
    handler: "Server Fee Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/cf-verify",
    method: "GET",
    handler: "CF Verify Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/:id",
    method: "GET",
    handler: "Find One Store Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/:id",
    method: "PUT",
    handler: "Update Store Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/:id",
    method: "DELETE",
    handler: "Delete Store Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/checkout",
    method: "POST",
    handler: "Check Out Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/verify",
    method: "POST",
    handler: "Verify Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/server-fee/checkout",
    method: "POST",
    handler: "Server Fee Check Out Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/server-fee/verify",
    method: "POST",
    handler: "Server Fee Verify Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/webhooks",
    method: "POST",
    handler: "Webhook Subscription",
  },
  {
    api: "store-subscriptions",
    endpoint: "/api/store-subscriptions/:id/cancel",
    method: "PUT",
    handler: "Refund Subscription",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateRequest], subscriptionController.create);
  router.get("/", [StoreRBAC], subscriptionController.find);
  router.get("/server-fee", [StoreRBAC], subscriptionController.serverFeeSubscription);
  router.get("/cf-verify", subscriptionController.CFVerify);
  router.get("/store-users", [StoreRBAC], subscriptionController.usersSubsctions);
  router.get("/:id", [StoreRBAC], subscriptionController.findOne);
  router.put("/:id", [StoreRBAC], subscriptionController.update);
  router.delete("/:id", [StoreRBAC], subscriptionController.delete);
  router.post("/checkout", [checkPlan, checkExistingSubscription], subscriptionController.checkOut);
  router.post("/verify", subscriptionController.verify);
  router.post("/server-fee/checkout", [StoreRBAC], subscriptionController.SF_checkOut);
  router.post("/server-fee/verify", subscriptionController.SF_verify);
  router.post("/webhooks", subscriptionController.webhook);
  router.put("/:id/cancel", validateUserSubscription, subscriptionController.refund);
  app.use("/api/store-subscriptions", router);
};

module.exports.permissions = permissions;
