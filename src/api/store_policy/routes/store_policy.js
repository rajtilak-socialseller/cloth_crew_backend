const express = require("express");
const router = express.Router();
const storePolicyController = require("../controllers/store_policy");
const { createStorePolicy, updateStorePolicy } = require("../middlewares/store_policy");

const permissions = [
  {
    api: "store-policy",
    endpoint: "/api/store-policy",
    method: "POST",
    handler: "Create Store Policy",
  },
  {
    api: "store-policy",
    endpoint: "/api/store-policy",
    method: "GET",
    handler: "Get Store Policy",
  },
];

module.exports = (app) => {
  router.post("/", createStorePolicy, storePolicyController.create);
  router.get("/", storePolicyController.get);
  app.use("/api/store-policy", router);
};

module.exports.permissions = permissions;
