const express = require("express");
const router = express.Router();
const RBAC = require("../../../middlewares/RBAC"); // if you use RBAC
const StoreRBAC = require("../../../middlewares/StoreRBAC"); // optional store-level RBAC
const measurementController = require("../controllers/measurement");
// adjust path if needed

// Permission List for RBAC/StoreRBAC
const permissions = [
  {
    api: "measurements",
    endpoint: "/api/measurements",
    method: "POST",
    handler: "Create Measurement",
  },
  {
    api: "measurements",
    endpoint: "/api/measurements",
    method: "GET",
    handler: "List All Measurements",
  },
  {
    api: "measurements",
    endpoint: "/api/measurements/:userId",
    method: "GET",
    handler: "Get Measurement by UserId",
  },
  {
    api: "measurements",
    endpoint: "/api/measurements/:id",
    method: "PATCH",
    handler: "Update Measurement",
  },
  //   {
  //     api: "measurements",
  //     endpoint: "/api/measurements/:id",
  //     method: "DELETE",
  //     handler: "Delete Measurement",
  //   },
];

module.exports = (app) => {
  // Create measurement
  router.post("/", measurementController.createMeasurement);

  // Get all measurements
  router.get("/", measurementController.getAllMeasurements);

  // Get measurement by userId
  router.get("/:userId", measurementController.getMeasurementByUser);

  // Update measurement
  router.patch("/:userId", measurementController.updateMeasurement);

  // Delete measurement
  //   router.delete("/:id", measurementController.deleteMeasurement);

  app.use("/api/measurements", router);
};

// Export permissions for RBAC system
module.exports.permissions = permissions;
