const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const shipRocketOrderItemController = require("../controllers/ship_rocket_orderitem");
const { validateCreateOrderItem, validateUpdateOrderItem } = require("../middlewares/ship_rocket_orderitem");

const permissions = [
  {
    api: "ship-rocket-order-items",
    endpoint: "/api/ship-rocket-order-items",
    method: "POST",
    handler: "Create Ship Rocket Order Item",
  },
  {
    api: "ship-rocket-order-items",
    endpoint: "/api/ship-rocket-order-items",
    method: "GET",
    handler: "List Ship Rocket Order Items",
  },
  {
    api: "ship-rocket-order-items",
    endpoint: "/api/ship-rocket-order-items/:id",
    method: "GET",
    handler: "Get Ship Rocket Order Item by ID",
  },
  {
    api: "ship-rocket-order-items",
    endpoint: "/api/ship-rocket-order-items/:id",
    method: "PUT",
    handler: "Update Ship Rocket Order Item",
  },
  {
    api: "ship-rocket-order-items",
    endpoint: "/api/ship-rocket-order-items/:id",
    method: "DELETE",
    handler: "Delete Ship Rocket Order Item",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC], validateCreateOrderItem, shipRocketOrderItemController.create);
  router.get("/", [StoreRBAC], shipRocketOrderItemController.find);
  router.get("/:id", [StoreRBAC], shipRocketOrderItemController.findOne);
  router.put("/:id", [StoreRBAC], validateUpdateOrderItem, shipRocketOrderItemController.update);
  router.delete("/:id", [StoreRBAC], shipRocketOrderItemController.delete);

  app.use("/api/ship-rocket-order-items", router);
};

module.exports.permissions = permissions;
