const express = require("express");
const router = express.Router();
const RBAC = require("../../../middlewares/RBAC");
const transactionController = require("../controllers/transaction");
const { validateRequest } = require("../middlewares/transaction");

const permissions = [
  {
    api: "transactions",
    endpoint: "/api/transactions",
    method: "POST",
    handler: "Create Transaction",
  },
  {
    api: "transactions",
    endpoint: "/api/transactions",
    method: "GET",
    handler: "List Transactions",
  },
  {
    api: "transactions",
    endpoint: "/api/transactions/export",
    method: "GET",
    handler: "Export Transactions to excel",
  },
  {
    api: "transactions",
    endpoint: "/api/transactions/:id",
    method: "GET",
    handler: "Find One Transaction",
  },
  // Add more permissions as needed for update and delete operations
];

module.exports = (app) => {
  router.post("/", [RBAC, validateRequest], transactionController.create);
  router.get("/", [RBAC], transactionController.find);
  router.get("/export", transactionController.exportToExcel);
  router.get("/:id", [RBAC], transactionController.findOne);
  // Uncomment the following lines when you have the corresponding controllers and middleware
  // router.put("/:id", [RBAC, validateRequest], transactionController.update);
  // router.delete("/:id", [RBAC], transactionController.delete);

  // You can pass the permissions array along with the router
  app.use("/api/transactions", router);
};

module.exports.permissions = permissions;
