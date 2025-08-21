const express = require("express");
const router = express.Router();
const storeSettingController = require("../controllers/store_setting");
const { validateRequest } = require("../middlewares/store_setting");

const permissions = [
  {
    api: "store-settings",
    endpoint: "/api/store-settings",
    method: "POST",
    handler: "Create Store Setting",
  },
  {
    api: "store-settings",
    endpoint: "/api/store-settings",
    method: "GET",
    handler: "Find Store Settings",
  },
];

module.exports = (app) => {
  router.post("/", validateRequest, storeSettingController.create);
  router.get("/", storeSettingController.find);
  app.use("/api/store-settings", router);
};

module.exports.permissions = permissions;
