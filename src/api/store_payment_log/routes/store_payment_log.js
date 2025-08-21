const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const payment_logController = require("../controllers/store_payment_log");

const permissions = [
  {
    api: "store-payment-log",
    endpoint: "/api/store-payment-log",
    method: "POST",
    handler: "Create Store Payment Log",
  },
  {
    api: "store-payment-log",
    endpoint: "/api/store-payment-log",
    method: "GET",
    handler: "List Store Payment Logs",
  },
  {
    api: "store-payment-log",
    endpoint: "/api/store-payment-log/:id",
    method: "GET",
    handler: "Get Store Payment Log by ID",
  },
  {
    api: "store-payment-log",
    endpoint: "/api/store-payment-log/:id",
    method: "PUT",
    handler: "Update Store Payment Log",
  },
  {
    api: "store-payment-log",
    endpoint: "/api/store-payment-log/:id",
    method: "DELETE",
    handler: "Delete Store Payment Log",
  },
  {
    api: "store-payment-log",
    endpoint: "/api/store-payment-log/export",
    method: "POST",
    handler: "Export Payment Log",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC], payment_logController.create);
  router.post("/export", [], payment_logController.exportToExcel);
  router.get("/", [StoreRBAC], payment_logController.find);
  router.get("/:id", [StoreRBAC], payment_logController.findOne);
  router.put("/:id", [StoreRBAC], payment_logController.update);
  router.delete("/:id", [StoreRBAC], payment_logController.delete);
  app.use("/api/store-payment-log", router);
};

module.exports.permissions = permissions;
