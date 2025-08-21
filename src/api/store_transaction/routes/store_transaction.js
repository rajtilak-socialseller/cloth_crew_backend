const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/store_transaction");
const { validateRequest } = require("../middlewares/store_transaction");

const permissions = [
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions",
    method: "POST",
    handler: "Create Store Transaction",
  },
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions",
    method: "GET",
    handler: "Find Store Transactions",
  },
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions/store-users",
    method: "GET",
    handler: "Find User's Transactions",
  },
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions/export",
    method: "POST",
    handler: "Export Transactions To Excel",
  },
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions/:id",
    method: "GET",
    handler: "Find One Store Transaction",
  },
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions/:id",
    method: "PUT",
    handler: "Update Store Transaction",
  },
  {
    api: "store-transactions",
    endpoint: "/api/store-transactions/:id",
    method: "DELETE",
    handler: "Delete Store Transaction",
  },
];

module.exports = (app) => {
  router.post("/", [validateRequest], transactionController.create);
  router.get("/store-users", transactionController.userTransactions);
  router.post("/export", transactionController.exportToExcel);
  router.get("/", transactionController.find);
  router.get("/:id", transactionController.findOne);
  router.put("/:id", transactionController.update);
  router.delete("/:id", transactionController.delete);
  app.use("/api/store-transactions", router);
};

module.exports.permissions = permissions;
