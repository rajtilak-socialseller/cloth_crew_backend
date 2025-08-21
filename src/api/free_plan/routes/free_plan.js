const router = require("express").Router();
const freePlanController = require("../controllers/free_plan");
const { validateFreePlan } = require("../middlewares/free_plan");

const permissions = [
  {
    api: "free-plan",
    endpoint: "/api/free-plans",
    method: "POST",
    handler: "Create Free Plan",
  },
  {
    api: "free-plan",
    endpoint: "/api/free-plans",
    method: "GET",
    handler: "List free-plans",
  },
];

module.exports = (app) => {
  router.post("/", [validateFreePlan], freePlanController.create);
  router.get("/", freePlanController.find);
  app.use("/api/free-plans", router);
};
module.exports.permissions = permissions
