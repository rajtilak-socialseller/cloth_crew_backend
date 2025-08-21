const express = require("express");
const router = express.Router();
const bulkPricingController = require("../controllers/bulk_pricing");
const { updateBulkPricing, createBulkPricing } = require("../middlewares/bulk_pricing");



const permissions = [
  {
    api: "bulk-pricings",
    endpoint: "/api/bulk-pricings",
    method: "POST",
    handler: "Create bulk-pricings",
  },
  {
    api: "bulk-pricings",
    endpoint: "/api/bulk-pricings",
    method: "GET",
    handler: "List bulk-pricings",
  },
  {
    api: "bulk-pricings",
    endpoint: "/api/bulk-pricings/:id",
    method: "GET",
    handler: "List Single bulk-pricings",
  },
  {
    api: "bulk-pricings",
    endpoint: "/api/bulk-pricings/:id",
    method: "PUT",
    handler: "Update bulk-pricings",
  },
  {
    api: "bulk-pricings",
    endpoint: "/api/bulk-pricings/:id",
    method: "DELETE",
    handler: "Delete bulk-pricings",
  },
];

router.post("/", createBulkPricing, bulkPricingController.create);
router.put("/:id", updateBulkPricing, bulkPricingController.update);
router.get("/", bulkPricingController.find);
router.get("/:id", bulkPricingController.findOne);
router.delete("/:id", bulkPricingController.delete);

module.exports = (app) => {
  app.use("/api/bulk-pricings", router);
};
module.exports.permissions = permissions
