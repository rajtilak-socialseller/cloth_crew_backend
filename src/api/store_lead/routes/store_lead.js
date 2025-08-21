const router = require("express").Router();
const leadController = require("../controllers/store_lead");
const { createLeadValidate, updateLeadValidate } = require("../middlewares/store_lead");
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const queryValidator = require("../../../middlewares/queryValidator");

const permissions = [
  {
    api: "store-leads",
    endpoint: "/api/store-leads",
    method: "POST",
    handler: "Create Store Lead",
  },
  {
    api: "store-leads",
    endpoint: "/api/store-leads",
    method: "GET",
    handler: "List Store Leads",
  },
  {
    api: "store-leads",
    endpoint: "/api/store-leads/export",
    method: "POST",
    handler: "Export Store Leads To Excel",
  },
  {
    api: "store-leads",
    endpoint: "/api/store-leads/:id",
    method: "GET",
    handler: "Get Store Lead by ID",
  },
  {
    api: "store-leads",
    endpoint: "/api/store-leads/:id",
    method: "PUT",
    handler: "Update Store Lead",
  },
  {
    api: "store-leads",
    endpoint: "/api/store-leads/:id",
    method: "DELETE",
    handler: "Delete Store Lead",
  },
  {
    api: "store-leads",
    endpoint: "/api/store-leads/search",
    method: "GET",
    handler: "Search Store Leads",
  },
];

module.exports = (app) => {
  router.post("/", [createLeadValidate], leadController.create);
  router.get("/", [StoreRBAC], leadController.find);
  router.get("/stats", [], leadController.stats);
  router.post("/export", leadController.exportLeads);
  router.get("/:id", [StoreRBAC], leadController.findOne);
  router.put("/:id", [StoreRBAC, updateLeadValidate], leadController.update);
  router.delete("/:id", [StoreRBAC], leadController.delete);
  router.get("/search", [StoreRBAC, queryValidator.search], leadController.search);
  app.use("/api/store-leads", router);
};

module.exports.permissions = permissions;
