const router = require("express").Router();
const campaignController = require("../controllers/campaign");
const StoreRABC = require("../../../middlewares/StoreRBAC");
const { validateRequest } = require("../middlewares/campaign");

const permissions = [
  {
    api: "campaigns",
    endpoint: "/api/campaigns",
    method: "POST",
    handler: "Create campaigns",
  },
  {
    api: "campaigns",
    endpoint: "/api/campaigns",
    method: "GET",
    handler: "List campaigns",
  },
  {
    api: "campaigns",
    endpoint: "/api/campaigns/:id",
    method: "GET",
    handler: "List Single campaigns",
  },
  {
    api: "campaigns",
    endpoint: "/api/campaigns/:id",
    method: "POST",
    handler: "Update campaigns",
  },
  {
    api: "campaigns",
    endpoint: "/api/campaigns/:id",
    method: "DELETE",
    handler: "Delete campaigns",
  },
];

module.exports = (app) => {
  // Define routes for the "Campaign" resource
  router.post("/", [StoreRABC, validateRequest], campaignController.create);
  router.put("/:id", [StoreRABC, validateRequest], campaignController.update);
  router.get("/", [StoreRABC], campaignController.find);
  router.get("/:id", [StoreRABC], campaignController.findOne);
  router.delete("/:id", [StoreRABC], campaignController.delete);

  // Use the router in the app
  app.use("/api/campaigns", router);
};
module.exports.permissions = permissions;
