const router = require("express").Router();
const payout_logController = require("../controllers/payout_log");
const {validateRequest} = require("../middlewares/payout_log")

const permissions = [
  {
    api: "payout-logs",
    endpoint: "/api/payout-logs",
    method: "POST",
    handler: "Create Payout Log",
  },
  {
    api: "payout-logs",
    endpoint: "/api/payout-logs",
    method: "GET",
    handler: "List Payout Logs",
  },
  {
    api: "payout-logs",
    endpoint: "/api/payout-logs/:id",
    method: "GET",
    handler: "Find Payout Log",
  },
  {
    api: "payout-logs",
    endpoint: "/api/payout-logs/:id",
    method: "PUT",
    handler: "Update Payout Log",
  },
  {
    api: "payout-logs",
    endpoint: "/api/payout-logs/:id",
    method: "DELETE",
    handler: "Delete Payout Log",
  },
];

module.exports = (app) => {
  router.post("/",validateRequest, payout_logController.create);
  router.get("/", payout_logController.find);
  router.get("/:id", payout_logController.findOne);
  router.put("/:id", validateRequest, payout_logController.update);
  router.delete("/:id", payout_logController.delete);
  app.use("/api/payout-logs", router);
};

module.exports.permissions = permissions;
