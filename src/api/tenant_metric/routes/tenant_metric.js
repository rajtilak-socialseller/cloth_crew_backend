const express = require("express");
const router = express.Router();
const tenantMetricController = require("../controllers/tenant_metric");
const { validateRequest } = require("../middlewares/tenant_metric"); // Import your validation middleware here

const permissions = [
  {
    api: "tenant-metrics",
    endpoint: "/api/tenant-metrics",
    method: "POST",
    handler: "Create Tenant Metric",
  },
  {
    api: "tenant-metrics",
    endpoint: "/api/tenant-metrics",
    method: "GET",
    handler: "List Tenant Metrics",
  },
  {
    api: "tenant-metrics",
    endpoint: "/api/tenant-metrics/:id",
    method: "GET",
    handler: "Find One Tenant Metric",
  },
  {
    api: "tenant-metrics",
    endpoint: "/api/tenant-metrics/:id",
    method: "PUT",
    handler: "Update Tenant Metric",
  },
  {
    api: "tenant-metrics",
    endpoint: "/api/tenant-metrics/:id",
    method: "DELETE",
    handler: "Delete Tenant Metric",
  },
];

module.exports = (app) => {
  router.post("/", validateRequest, tenantMetricController.create);
  router.get("/", tenantMetricController.find);
  router.get("/:id", tenantMetricController.findOne);
  router.put("/:id", validateRequest, tenantMetricController.update);
  router.delete("/:id", tenantMetricController.delete);

  // You can pass the permissions array along with the router
  app.use("/api/tenant-metrics", router);
};

module.exports.permissions = permissions;
