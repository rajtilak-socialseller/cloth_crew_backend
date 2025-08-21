const router = require("express").Router();
const globalBrandController = require("../controllers/global_brand");
const globalBrandMiddleware = require("../middlewares/global_brand");
const RBAC = require("../../../middlewares/RBAC");

const permissions = [
  {
    api: "global-brands",
    endpoint: "/api/global-brands",
    method: "POST",
    handler: "Create Global Brand",
  },
  {
    api: "global-brands",
    endpoint: "/api/global-brands",
    method: "GET",
    handler: "List Global Brands",
  },
];

module.exports = (app) => {
  router.post("/", [RBAC, globalBrandMiddleware.validateRequest], globalBrandController.create);
  router.get("/", globalBrandController.find);

  app.use("/api/global-brands", router);
};

module.exports.permissions = permissions;
