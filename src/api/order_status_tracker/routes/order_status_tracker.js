const router = require("express").Router();
const order_status_trackerController = require("../controllers/order_status_tracker");
const { validateRequest } = require("../middlewares/order_status_tracker");

const permissions = [
  {
    api: "order-status-trackers",
    endpoint: "/api/order-status-trackers",
    method: "POST",
    handler: "Create Order Status Tracker",
  },
  {
    api: "order-status-trackers",
    endpoint: "/api/order-status-trackers",
    method: "GET",
    handler: "List Order Status Trackers",
  },
  {
    api: "order-status-trackers",
    endpoint: "/api/order-status-trackers/:id",
    method: "GET",
    handler: "Find Order Status Tracker",
  },
  {
    api: "order-status-trackers",
    endpoint: "/api/order-status-trackers/:id",
    method: "PUT",
    handler: "Update Order Status Tracker",
  },
  {
    api: "order-status-trackers",
    endpoint: "/api/order-status-trackers/:id",
    method: "DELETE",
    handler: "Delete Order Status Tracker",
  },
];

module.exports = (app) => {
  router.post("/", validateRequest, order_status_trackerController.create);
  router.get("/", order_status_trackerController.find);
  router.get("/:id", order_status_trackerController.findOne);
  router.put("/:id", validateRequest, order_status_trackerController.update);
  router.delete("/:id", order_status_trackerController.delete);
  app.use("/api/order-status-trackers", router);
};

module.exports.permissions = permissions;
