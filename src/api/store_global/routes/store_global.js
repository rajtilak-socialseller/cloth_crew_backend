const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const globalController = require("../controllers/store_global");
const { validateRequest } = require("../middlewares/store_global");

const permissions = [
  {
    api: "store-globals",
    endpoint: "/api/store-globals",
    method: "POST",
    handler: "Create Store Global",
  },
  {
    api: "store-globals",
    endpoint: "/api/store-globals",
    method: "GET",
    handler: "List Store Globals",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateRequest], globalController.create);
  router.get("/", [validateRequest], globalController.find);
  router.post("/buy-msg", globalController.buyMSG)
  router.post("/verify-msg", globalController.bugMSGverify)
  app.use("/api/store-globals", router);
};

module.exports.permissions = permissions;
