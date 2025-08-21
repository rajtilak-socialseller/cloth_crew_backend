const router = require("express").Router();
const freePlanController = require("../controllers/free_plan");
const { validateFreePlan } = require("../middlewares/free_plan");

const permissions = [
  {
    api: "free-plan",
    endpoint: "/api/store-free-plans",
    method: "POST",
    handler: "Create Store Free Plan",
  },
  {
    api: "free-plan",
    endpoint: "/api/store-free-plans",
    method: "GET",
    handler: "List Store free-plans",
  },
];

module.exports = (app) => {
  router.post("/", [validateFreePlan], freePlanController.create);
  router.get("/", freePlanController.find);
  app.use("/api/store-free-plans", router);
};
module.exports.permissions = permissions
