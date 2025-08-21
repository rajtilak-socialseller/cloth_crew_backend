const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const privacy_policyController = require("../controllers/privacy_policy");
const { validateRequest } = require("../middlewares/privacy_policy");

const permissions = [
  {
    api: "privacy-policy",
    endpoint: "/api/privacy-policy",
    method: "POST",
    handler: "Create Privacy Policy",
  },
  {
    api: "privacy-policy",
    endpoint: "/api/privacy-policy",
    method: "GET",
    handler: "List Privacy Policies",
  },
];

module.exports = (app) => {
  router.post("/", validateRequest, privacy_policyController.create);
  router.get("/", privacy_policyController.find);
  app.use("/api/privacy-policy", router);
};

module.exports.permissions = permissions;
