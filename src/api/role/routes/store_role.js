const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const roleController = require("../controllers/role");
const { validateCreateBody, validateUpdateBody } = require("../middlewares/role");

const permissions = [
  {
    api: "store-roles",
    endpoint: "/api/store-roles",
    method: "POST",
    handler: "Create Store_Role",
  },
  {
    api: "store-roles",
    endpoint: "/api/store-roles",
    method: "GET",
    handler: "List Store_Roles",
  },
  {
    api: "store-roles",
    endpoint: "/api/store-roles/:id",
    method: "GET",
    handler: "Find Store_Role",
  },
  {
    api: "store-roles",
    endpoint: "/api/store-roles/:id",
    method: "PUT",
    handler: "Update Store_Role",
  },
  {
    api: "store-roles",
    endpoint: "/api/store-roles/:id",
    method: "DELETE",
    handler: "Delete Store_Role",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateCreateBody], roleController.create);
  router.get("/", roleController.find);
  router.get("/:id", [StoreRBAC], roleController.findOne);
  router.put("/:id", [StoreRBAC, validateUpdateBody], roleController.update);
  router.delete("/:id", [StoreRBAC], roleController.delete);
  app.use("/api/store-roles", router);
};

// module.exports.permissions = permissions;
