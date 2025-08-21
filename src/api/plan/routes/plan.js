const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const planController = require("../controllers/plan");
const { validateCreateRequest, validateUpdateRequest } = require("../middlewares/plan");

const permissions = [
  {
    api: "plans",
    endpoint: "/api/plans",
    method: "POST",
    handler: "Create Plan",
  },
  {
    api: "plans",
    endpoint: "/api/plans",
    method: "GET",
    handler: "List Plans",
  },
  {
    api: "plans",
    endpoint: "/api/plans/:id",
    method: "GET",
    handler: "Find Plan",
  },
  {
    api: "plans",
    endpoint: "/api/plans/:id",
    method: "PUT",
    handler: "Update Plan",
  },
  {
    api: "plans",
    endpoint: "/api/plans/:id",
    method: "DELETE",
    handler: "Delete Plan",
  },
];

module.exports = (app) => {
  router.post("/", [validateCreateRequest], planController.create);
  router.get("/", [RBAC], planController.find);
  router.get("/:id", [RBAC], planController.findOne);
  router.put("/:id", [RBAC, validateUpdateRequest], planController.update);
  router.delete("/:id", [RBAC], planController.delete);
  app.use("/api/plans", router);
};

module.exports.permissions = permissions;
