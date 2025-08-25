const express = require("express");
const router = express.Router();
const RBAC = require("../../../middlewares/RBAC"); // role based access control
const StoreRBAC = require("../../../middlewares/StoreRBAC"); // optional, per-store level control
const storeController = require("../controllers/store"); // adjust path
const { verify } = require("../../../services/jwt");

// Permission List for RBAC/StoreRBAC
const permissions = [
  {
    api: "stores",
    endpoint: "/api/stores",
    method: "POST",
    handler: "Create Store",
  },
  {
    api: "stores",
    endpoint: "/api/stores",
    method: "GET",
    handler: "List All Stores",
  },
  {
    api: "stores",
    endpoint: "/api/stores/:id",
    method: "GET",
    handler: "Get Store by Id",
  },
  {
    api: "stores",
    endpoint: "/api/stores/:id",
    method: "PATCH",
    handler: "Update Store",
  },
  {
    api: "stores",
    endpoint: "/api/stores/:id",
    method: "DELETE",
    handler: "Delete Store",
  },
];

// ROUTES
module.exports = (app) => {
  // Create store
  router.post("/", storeController.createStore);

  // Get all stores
  router.get("/", storeController.getAllStores);

  // Get store by Id
  router.get("/:id", storeController.getStoreById);

  // Update store
  router.patch("/:id", storeController.updateStore);

  // Delete store
  router.delete("/:id", storeController.deleteStore);

  app.use("/api/stores", router);
};

// Export permissions for RBAC system
module.exports.permissions = permissions;
