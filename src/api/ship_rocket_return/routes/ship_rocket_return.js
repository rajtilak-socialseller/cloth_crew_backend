const express = require("express");
const router = express.Router();
const shipRocketReturnController = require("../controllers/ship_rocket_return");
const middleware = require("../middlewares/ship_rocket_return");
const StoreRBAC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "ship-rocket-returns",
    endpoint: "/api/ship-rocket-returns",
    method: "POST",
    handler: "Create Ship Rocket Return",
  },
  {
    api: "ship-rocket-returns",
    endpoint: "/api/ship-rocket-returns",
    method: "GET",
    handler: "List Ship Rocket Returns",
  },
  {
    api: "ship-rocket-returns",
    endpoint: "/api/ship-rocket-returns/:id",
    method: "GET",
    handler: "Find One Ship Rocket Return",
  },
  {
    api: "ship-rocket-returns",
    endpoint: "/api/ship-rocket-returns/:id",
    method: "PUT",
    handler: "Update Ship Rocket Return",
  },
  {
    api: "ship-rocket-returns",
    endpoint: "/api/ship-rocket-returns/:id",
    method: "DELETE",
    handler: "Delete Ship Rocket Return",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, middleware.validateCreateParcel], shipRocketReturnController.create);
  router.get("/", [StoreRBAC], shipRocketReturnController.find);
  router.get("/:id", [StoreRBAC], shipRocketReturnController.findOne);
  router.put("/:id", [StoreRBAC, middleware.validateUpdateParcel], shipRocketReturnController.update);
  router.delete("/:id", [StoreRBAC], shipRocketReturnController.delete);

  // You can pass the permissions array along with the router
  app.use("/api/ship-rocket-returns", [router]);
};

// Exporting the permissions array separately
module.exports.permissions = permissions;
