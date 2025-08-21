const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const planMetricsController = require("../controllers/plan_metrics");

const permissions = [
  {
    api: "plan-metrics",
    endpoint: "/api/plan-metrics",
    method: "POST",
    handler: "Create Plan Metric",
  },
  {
    api: "plan-metrics",
    endpoint: "/api/plan-metrics",
    method: "GET",
    handler: "List Plan Metrics",
  },
  {
    api: "plan-metrics",
    endpoint: "/api/plan-metrics/:id",
    method: "GET",
    handler: "Find Plan Metric",
  },
  {
    api: "plan-metrics",
    endpoint: "/api/plan-metrics/:id",
    method: "PUT",
    handler: "Update Plan Metric",
  },
  {
    api: "plan-metrics",
    endpoint: "/api/plan-metrics/:id",
    method: "DELETE",
    handler: "Delete Plan Metric",
  },
];

module.exports = (app) => {
  router.post("/", [RBAC], planMetricsController.create);
  router.get("/", [RBAC], planMetricsController.find);
  router.get("/:id", [RBAC], planMetricsController.findOne);
  router.put("/:id", [RBAC], planMetricsController.update);
  router.delete("/:id", [RBAC], planMetricsController.delete);

  app.use("/api/plan-metrics", router);
};

module.exports.permissions = permissions;
