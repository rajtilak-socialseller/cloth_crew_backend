const router = require("express").Router();
const globalBrandController = require("../controllers/global_brand");
const globalBrandMiddleware = require("../middlewares/global_brand");
const RBAC = require("../../../middlewares/RBAC");
const StoreRBAC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "store-global-brands",
    endpoint: "/api/store-global-brands",
    method: "POST",
    handler: "Create Store Global Brand",
  },
  {
    api: "store-global-brands",
    endpoint: "/api/store-global-brands",
    method: "GET",
    handler: "List Store Global Brands",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, globalBrandMiddleware.validateRequest], globalBrandController.create);
  router.get("/", globalBrandController.find);

  app.use("/api/store-global-brands", router);
};

module.exports.permissions = permissions;
