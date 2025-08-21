const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const roleController = require("../controllers/role");
const { validateCreateBody, validateUpdateBody } = require("../middlewares/role");

const permissions = [
  {
    api: "roles",
    endpoint: "/api/roles",
    method: "POST",
    handler: "Create Role",
  },
  {
    api: "roles",
    endpoint: "/api/roles",
    method: "GET",
    handler: "List Roles",
  },
  {
    api: "roles",
    endpoint: "/api/roles/:id",
    method: "PUT",
    handler: "Update Role",
  },
  {
    api: "roles",
    endpoint: "/api/roles/:id",
    method: "GET",
    handler: "Find Role",
  },
  {
    api: "roles",
    endpoint: "/api/roles/:id",
    method: "DELETE",
    handler: "Delete Role",
  },
];

module.exports = (app) => {
  router.post("/", [RBAC, validateCreateBody], roleController.create);
  router.get("/", [RBAC], roleController.find);
  router.put("/:id", [RBAC, validateUpdateBody], roleController.update);
  router.get("/:id", [RBAC], roleController.findOne);
  router.delete("/:id", [RBAC], roleController.delete);
  app.use("/api/roles", router);
};

module.exports.permissions = permissions;
