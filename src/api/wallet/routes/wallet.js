const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet");
const { validateWithdraw, validateRequest } = require("../middlewares/wallet");
const StoreRBAC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "wallets",
    endpoint: "/api/wallets",
    method: "POST",
    handler: "Create Wallet",
  },
  {
    api: "wallets",
    endpoint: "/api/wallets",
    method: "GET",
    handler: "List Wallets",
  },
  {
    api: "wallets",
    endpoint: "/api/wallets/:id",
    method: "GET",
    handler: "Find One Wallet",
  },
  {
    api: "wallets",
    endpoint: "/api/wallets/withdraw",
    method: "POST",
    handler: "Withdraw from Wallet",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateRequest], walletController.create);
  router.get("/", StoreRBAC, walletController.find);
  router.get("/:id", [StoreRBAC], walletController.findOne);
  router.post("/withdraw", [StoreRBAC, validateWithdraw], walletController.withdraw);
  // router.put("/:id", walletController.update);
  // router.delete("/:id", walletController.delete);

  app.use("/api/wallets", router);
};
module.exports.permissions = permissions;
