const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const permissionController = require("../controllers/permission");
const { validateRequest } = require("../middlewares/permission");

const permissions = [
  {
    api: "store-permissions",
    endpoint: "/api/store-permissions",
    method: "POST",
    handler: "Create Store Permission",
  },
  {
    api: "store-permissions",
    endpoint: "/api/store-permissions",
    method: "GET",
    handler: "List Store Permissions",
  },
  {
    api: "store-permissions",
    endpoint: "/api/store-permissions/:id",
    method: "GET",
    handler: "Find Store Permission",
  },
  {
    api: "store-permissions",
    endpoint: "/api/store-permissions/:id",
    method: "PUT",
    handler: "Update Store Permission",
  },
  {
    api: "store-permissions",
    endpoint: "/api/store-permissions/:id",
    method: "DELETE",
    handler: "Delete Store Permission",
  },
  {
    api: "store-permissions",
    endpoint: "/api/store-permissions/bulk/generate",
    method: "GET",
    handler: "Generate Store Permission Lists",
  },
];

module.exports = (app) => {
  router.post("/", [validateRequest], permissionController.create);
  router.get("/", [], permissionController.find);
  router.get("/:id", [], permissionController.findOne);
  router.put("/:id", [StoreRBAC], permissionController.update);
  router.delete("/:id", [StoreRBAC], permissionController.delete);
  router.get("/bulk/generate", [], permissionController.generateLists);
  app.use("/api/store-permissions", router);
};

module.exports.permissions = permissions;
