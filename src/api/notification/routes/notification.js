const router = require("express").Router();
const notificationController = require("../controllers/notification");
const {validateRequest} = require("../middlewares/notification")

const permissions = [
  {
    api: "notifications",
    endpoint: "/api/notifications",
    method: "POST",
    handler: "Create Notification",
  },
  {
    api: "notifications",
    endpoint: "/api/notifications",
    method: "GET",
    handler: "List Notifications",
  },
  {
    api: "notifications",
    endpoint: "/api/notifications/:id",
    method: "GET",
    handler: "Find Notification",
  },
  {
    api: "notifications",
    endpoint: "/api/notifications/:id",
    method: "PUT",
    handler: "Update Notification",
  },
  {
    api: "notifications",
    endpoint: "/api/notifications/:id",
    method: "DELETE",
    handler: "Delete Notification",
  },
];

module.exports = (app) => {
  router.post("/",validateRequest, notificationController.create);
  router.get("/", notificationController.find);
  router.get("/:id", notificationController.findOne);
  router.put("/:id", validateRequest, notificationController.update);
  router.delete("/:id", notificationController.delete);
  app.use("/api/notifications", router);
};

module.exports.permissions = permissions;
