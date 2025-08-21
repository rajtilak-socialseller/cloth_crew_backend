const router = require("express").Router();
const returnsController = require("../controllers/return_order");

const permissions = [
  {
    api: "return-orders",
    endpoint: "/api/return-orders",
    method: "POST",
    handler: "Create Return",
  },
  {
    api: "return-orders",
    endpoint: "/api/return-orders",
    method: "GET",
    handler: "List Return-orders",
  },
  {
    api: "return-orders",
    endpoint: "/api/return-orders/:id",
    method: "GET",
    handler: "Find Return",
  },
  {
    api: "return-orders",
    endpoint: "/api/return-orders/:id",
    method: "PUT",
    handler: "Update Return",
  },
  {
    api: "return-orders",
    endpoint: "/api/return-orders/:id",
    method: "DELETE",
    handler: "Delete Return",
  },
];

module.exports = (app) => {
  router.post("/", returnsController.create);
  router.get("/", returnsController.find);
  router.get("/:id", returnsController.findOne);
  router.put("/:id", returnsController.update);
  router.delete("/:id", returnsController.delete);
  app.use("/api/return-orders", router);
};

module.exports.permissions = permissions;
