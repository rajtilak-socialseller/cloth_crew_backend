const router = require("express").Router();
const product_metricsController = require("../controllers/product_metrics");
const { validateProductMetrics } = require("../middlewares/product_metrics");

const permissions = [
  {
    api: "product-metrics",
    endpoint: "/api/product-metrics",
    method: "POST",
    handler: "Create Product Metrics",
  },
  {
    api: "product-metrics",
    endpoint: "/api/product-metrics",
    method: "GET",
    handler: "List Product Metrics",
  },
  {
    api: "product-metrics",
    endpoint: "/api/product-metrics/:id",
    method: "GET",
    handler: "Find Product Metrics",
  },
  {
    api: "product-metrics",
    endpoint: "/api/product-metrics/:id",
    method: "PUT",
    handler: "Update Product Metrics",
  },
  {
    api: "product-metrics",
    endpoint: "/api/product-metrics/:id",
    method: "DELETE",
    handler: "Delete Product Metrics",
  },
];

module.exports = (app) => {
  router.post("/", validateProductMetrics, product_metricsController.create);
  router.get("/", product_metricsController.find);
  router.get("/:id", product_metricsController.findOne);
  router.put("/:id", product_metricsController.update);
  router.delete("/:id", product_metricsController.delete);

  app.use("/api/product-metrics", router);
};

module.exports.permissions = permissions;
