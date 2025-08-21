const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activity_log");
const { validateActivityLog } = require("../middlewares/activity_log");

const permissions = [
  {
    api: "activity-logs",
    endpoint: "/api/activity-logs",
    method: "POST",
    handler: "Create Activity Log",
  },
  {
    api: "activity-logs",
    endpoint: "/api/activity-logs",
    method: "GET",
    handler: "List Activity Logs",
  },
  {
    api: "activity-logs",
    endpoint: "/api/activity-logs/:id",
    method: "PUT",
    handler: "Update Activity Log",
  },
  {
    api: "activity-logs",
    endpoint: "/api/activity-logs/:id",
    method: "DELETE",
    handler: "Delete Activity Log",
  },
];

module.exports = (app) => {
  router.post("/", validateActivityLog, activityLogController.create);
  router.get("/", activityLogController.find);
  router.put("/:id", validateActivityLog, activityLogController.update);
  // router.get("/:id", activityLogController.findOne);
  router.delete("/:id", activityLogController.delete);
  app.use("/api/activity-logs", router);
};
// module.exports.permissions = permissions;
