// src/api/post/postRoutes.js
const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const payment_logController = require("../controllers/payment_log");

// Define routes for the "Post" resource
const permissions = [
  {
    api: "payment-logs",
    endpoint: "/api/payment-logs",
    method: "POST",
    handler: "Create Payment Log",
  },
  {
    api: "payment-logs",
    endpoint: "/api/payment-logs",
    method: "GET",
    handler: "List All Payment Logs",
  },
  {
    api: "payment-logs",
    endpoint: "/api/payment-logs/:id",
    method: "GET",
    handler: "List Single Payment Logs",
  },
  {
    api: "payment-logs",
    endpoint: "/api/payment-logs/:id",
    method: "PUT",
    handler: "Update Payment Log",
  },
  {
    api: "payment-logs",
    endpoint: "/api/payment-logs/:id",
    method: "DELETE",
    handler: "Delete Payment Log",
  },
];
module.exports = (app) => {
  router.post("/", [RBAC], payment_logController.create);
  router.get("/", [RBAC], payment_logController.find);
  router.get("/:id", [RBAC], payment_logController.findOne);
  router.put("/:id", [RBAC], payment_logController.update);
  router.delete("/:id", [RBAC], payment_logController.delete);
  app.use("/api/payment-logs", router);
};
module.exports.permissions = permissions;
