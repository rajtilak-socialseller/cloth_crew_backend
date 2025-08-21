const router = require("express").Router();
const globalController = require("../controllers/global");
const globalMiddleware = require("../middlewares/global");
const RBAC = require("../../../middlewares/RBAC");
// Define routes for the "Post" resource
const permissions = [
  {
    api: "globals",
    endpoint: "/api/globals",
    method: "POST",
    handler: "Create Globals",
  },
  {
    api: "globals",
    endpoint: "/api/globals",
    method: "GET",
    handler: "List globals",
  },
];

module.exports = (app) => {
  router.post("/", [RBAC, globalMiddleware.validateRequest], globalController.create);
  router.get("/", globalController.find);
  app.use("/api/globals", router);
};
module.exports.permissions = permissions
