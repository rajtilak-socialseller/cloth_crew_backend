const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const leadController = require("../controllers/lead");
const { createLeadValidate, updateLeadValidate } = require("../middlewares/lead");
const queryValidator = require("../../../middlewares/queryValidator");

const permissions = [
  {
    api: "leads",
    endpoint: "/api/leads",
    method: "POST",
    handler: "Create Lead",
  },
  {
    api: "leads",
    endpoint: "/api/leads",
    method: "GET",
    handler: "List Leads",
  },
  {
    api: "leads",
    endpoint: "/api/leads/stats",
    method: "GET",
    handler: "Get Lead Stats",
  },
  {
    api: "leads",
    endpoint: "/api/leads/:id",
    method: "GET",
    handler: "Find Lead",
  },
  {
    api: "leads",
    endpoint: "/api/leads/:id",
    method: "PUT",
    handler: "Update Lead",
  },
  {
    api: "leads",
    endpoint: "/api/leads/:id",
    method: "DELETE",
    handler: "Delete Lead",
  },
  {
    api: "leads",
    endpoint: "/api/leads/search",
    method: "GET",
    handler: "Search Leads",
  },
];

module.exports = (app) => {
  router.post("/", [createLeadValidate], leadController.create);
  router.get("/", [RBAC], leadController.find);
  router.get("/stats", leadController.stats);
  router.get("/:id", [RBAC], leadController.findOne);
  router.put("/:id", [RBAC, updateLeadValidate], leadController.update);
  router.delete("/:id", [RBAC], leadController.delete);
  router.get("/search", [RBAC, queryValidator.search], leadController.search);
  app.use("/api/leads", router);
};

module.exports.permissions = permissions;
