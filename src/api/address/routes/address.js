const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address");
const { addAddress, updateAddress } = require("../middlewares/address");

const permissions = [
  {
    api: "address",
    endpoint: "/api/address",
    method: "POST",
    handler: "Create Address",
  },
  {
    api: "address",
    endpoint: "/api/address/user-address",
    method: "GET",
    handler: "List User's Address",
  },
  {
    api: "address",
    endpoint: "/api/address/search",
    method: "GET",
    handler: "Search Address",
  },
  {
    api: "address",
    endpoint: "/api/address",
    method: "GET",
    handler: "List All Address",
  },
  {
    api: "address",
    endpoint: "/api/address/:id",
    method: "GET",
    handler: "List Single Address",
  },
  {
    api: "address",
    endpoint: "/api/address/:id",
    method: "PUT",
    handler: "Update Address",
  },
  {
    api: "address",
    endpoint: "/api/address/:id",
    method: "DELETE",
    handler: "Delete Address",
  },
];

module.exports = (app) => {
  router.post("/", addAddress, addressController.create);
  router.get("/user-address", addressController.userAddress);
  router.get("/search", addressController.search);
  router.get("/", addressController.find);
  router.get("/:id", addressController.findOne);
  router.put("/:id", updateAddress, addressController.update);
  router.delete("/:id", addressController.delete);
  app.use("/api/address", router);
};
module.exports.permissions = permissions
