const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const planController = require("../controllers/store_plan");
const plan = require("../middlewares/store_plan");

const permissions = [
  {
    api: "store-plans",
    endpoint: "/api/store-plans",
    method: "POST",
    handler: "Create Store Plan",
  },
  {
    api: "store-plans",
    endpoint: "/api/store-plans",
    method: "GET",
    handler: "List Store Plans",
  },
  {
    api: "store-plans",
    endpoint: "/api/store-plans/:id",
    method: "GET",
    handler: "Get Store Plan by ID",
  },
  {
    api: "store-plans",
    endpoint: "/api/store-plans/:id",
    method: "PUT",
    handler: "Update Store Plan",
  },
  {
    api: "store-plans",
    endpoint: "/api/store-plans/:id",
    method: "DELETE",
    handler: "Delete Store Plan",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, plan.validateCreateRequest], planController.create);
  router.get("/", [], planController.find);
  router.get("/:id", [], planController.findOne);
  router.put("/:id", [StoreRBAC, plan.validateUpdateRequest], planController.update);
  router.delete("/:id", [StoreRBAC], planController.delete);
  app.use("/api/store-plans", router);
};

module.exports.permissions = permissions;
