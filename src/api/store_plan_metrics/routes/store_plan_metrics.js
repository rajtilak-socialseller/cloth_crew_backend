const router = require("express").Router();
const planMetricsController = require("../controllers/store_plan_metrics");
const StoreRBAC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "store-plan-metrics",
    endpoint: "/api/store-plan-metrics",
    method: "POST",
    handler: "Create Store Plan Metrics",
  },
  {
    api: "store-plan-metrics",
    endpoint: "/api/store-plan-metrics",
    method: "GET",
    handler: "List Store Plan Metrics",
  },
  {
    api: "store-plan-metrics",
    endpoint: "/api/store-plan-metrics/:id",
    method: "GET",
    handler: "Get Store Plan Metrics by ID",
  },
  {
    api: "store-plan-metrics",
    endpoint: "/api/store-plan-metrics/:id",
    method: "PUT",
    handler: "Update Store Plan Metrics",
  },
  {
    api: "store-plan-metrics",
    endpoint: "/api/store-plan-metrics/:id",
    method: "DELETE",
    handler: "Delete Store Plan Metrics",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC], planMetricsController.create);
  router.get("/", [StoreRBAC], planMetricsController.find);
  router.get("/:id", [StoreRBAC], planMetricsController.findOne);
  router.put("/:id", [StoreRBAC], planMetricsController.update);
  router.delete("/:id", [StoreRBAC], planMetricsController.delete);

  app.use("/api/store-plan-metrics", router);
};

module.exports.permissions = permissions;
