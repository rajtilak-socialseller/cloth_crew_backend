const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const { create, delete: destroy, find, findOne, productReturn, update, webhook, pickupAddresses } = require("../controllers/ship_rocket_order");
const { validateShipRocketOrder, validateShipRocketReturn } = require("../middlewares/ship_rocket_order");

const permissions = [
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders",
    method: "POST",
    handler: "Create Ship Rocket Order",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders/return",
    method: "POST",
    handler: "Create Ship Rocket Return",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders/webhook",
    method: "POST",
    handler: "Ship Rocket Webhook",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders",
    method: "GET",
    handler: "List Ship Rocket Orders",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders/:id",
    method: "GET",
    handler: "Get Ship Rocket Order by ID",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders/:id",
    method: "PUT",
    handler: "Update Ship Rocket Order",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders/:id",
    method: "DELETE",
    handler: "Delete Ship Rocket Order",
  },
  {
    api: "ship-rocket-orders",
    endpoint: "/api/ship-rocket-orders/address",
    method: "GET",
    handler: "Ship Rocket Pickup addresses",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC], validateShipRocketOrder, create);
  router.post("/return", [StoreRBAC], validateShipRocketReturn, productReturn);
  router.post("/webhook", [StoreRBAC], pickupAddresses);
  router.get("/address", pickupAddresses);
  router.get("/", [StoreRBAC], find);
  router.get("/:id", [StoreRBAC], findOne);
  router.put("/:id", [StoreRBAC], validateShipRocketOrder, update);
  router.delete("/:id", [StoreRBAC], destroy);

  app.use("/api/ship-rocket-orders", router);
};

module.exports.permissions = permissions;
