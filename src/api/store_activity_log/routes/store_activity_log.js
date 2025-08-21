const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/store_activity_log");
const { validateActivityLog , updateActivityLog } = require("../middlewares/store_activity_log");
const StoreRBAC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "store-activity-logs",
    endpoint: "/api/store-activity-logs",
    method: "POST",
    handler: "Create Store Activity Log",
  },
  {
    api: "store-activity-logs",
    endpoint: "/api/store-activity-logs",
    method: "GET",
    handler: "List Store Activity Logs",
  },
  {
    api: "store-activity-logs",
    endpoint: "/api/store-activity-logs/:id",
    method: "PUT",
    handler: "Update Store Activity Log",
  },
  {
    api: "store-activity-logs",
    endpoint: "/api/store-activity-logs/:id",
    method: "DELETE",
    handler: "Delete Store Activity Log",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateActivityLog], activityLogController.create);
  router.get("/", [StoreRBAC], activityLogController.find);
  router.put("/:id", [StoreRBAC, updateActivityLog], activityLogController.update);
  router.delete("/:id", [StoreRBAC], activityLogController.delete);
  app.use("/api/store-activity-logs", router);
};

module.exports.permissions = permissions;
