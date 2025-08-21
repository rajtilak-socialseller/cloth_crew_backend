const express = require("express");
const router = express.Router();
const RBAC = require("../../../middlewares/RBAC");
const variant = require("../controllers/variant");
const { updateBody, createBody } = require("../middlewares/variant");

const permissions = [
  {
    api: "variants",
    endpoint: "/api/variants",
    method: "POST",
    handler: "Create Variant",
  },
  {
    api: "variants",
    endpoint: "/api/variants",
    method: "GET",
    handler: "List Variants",
  },
  {
    api: "variants",
    endpoint: "/api/variants/:id",
    method: "GET",
    handler: "Find One Variant",
  },
  {
    api: "variants",
    endpoint: "/api/variants/:id",
    method: "PUT",
    handler: "Update Variant",
  },
  {
    api: "variants",
    endpoint: "/api/variants/:id",
    method: "DELETE",
    handler: "Delete Variant",
  },
];

module.exports = (app) => {
  router.post("/", createBody, variant.create);
  router.get("/", variant.find);
  router.get("/:id", variant.findOne);
  router.put("/:id", updateBody, variant.update);
  router.delete("/:id", variant.delete);
  app.use("/api/variants", router);
};

// Exporting the permissions array separately
module.exports.permissions = permissions;
