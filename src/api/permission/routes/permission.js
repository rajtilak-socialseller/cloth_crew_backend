const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const permissionController = require("../controllers/permission");
const { validateRequest } = require("../middlewares/permission");

const permissions = [
  {
    api: "permissions",
    endpoint: "/api/permissions",
    method: "POST",
    handler: "Create Permission",
  },
  {
    api: "permissions",
    endpoint: "/api/permissions",
    method: "GET",
    handler: "List Permissions",
  },
  {
    api: "permissions",
    endpoint: "/api/permissions/:id",
    method: "GET",
    handler: "Find Permission",
  },
  {
    api: "permissions",
    endpoint: "/api/permissions/:id",
    method: "PUT",
    handler: "Update Permission",
  },
  {
    api: "permissions",
    endpoint: "/api/permissions/:id",
    method: "DELETE",
    handler: "Delete Permission",
  },
  {
    api: "permissions",
    endpoint: "/api/permissions/bulk/generate",
    method: "GET",
    handler: "Generate Permission Lists",
  },
  {
    api: "permissions",
    endpoint: "/api/permissions/staff",
    method: "GET",
    handler: "Generate Staff Permission Lists",
  },
];

module.exports = (app) => {
  router.post("/", [validateRequest], permissionController.create);
  router.get("/", [], permissionController.find);
  router.get("/staff", [], permissionController.staffPermission);
  router.get("/:id", [], permissionController.findOne);
  router.put("/:id", [RBAC], permissionController.update);
  router.delete("/:id", [RBAC], permissionController.delete);
  router.get("/bulk/generate", [RBAC], permissionController.generateLists);
  app.use("/api/permissions", router);
};

module.exports.permissions = permissions;
