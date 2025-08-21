const express = require("express");
const router = express.Router();
const RBAC = require("../../../middlewares/RBAC");
const tagController = require("../controllers/tag");
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const { validateRequest } = require("../middlewares/tag");

const permissions = [
  {
    api: "tags",
    endpoint: "/api/tags",
    method: "POST",
    handler: "Create Tag",
  },
  {
    api: "tags",
    endpoint: "/api/tags",
    method: "GET",
    handler: "List Tags",
  },
  {
    api: "tags",
    endpoint: "/api/tags/search",
    method: "GET",
    handler: "Search Tags",
  },
  {
    api: "tags",
    endpoint: "/api/tags/:id",
    method: "GET",
    handler: "Find One Tag",
  },
  {
    api: "tags",
    endpoint: "/api/tags/:id",
    method: "PUT",
    handler: "Update Tag",
  },
  {
    api: "tags",
    endpoint: "/api/tags/:id",
    method: "DELETE",
    handler: "Delete Tag",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateRequest], tagController.create);
  router.get("/", tagController.find);
  router.get("/search", tagController.search);
  router.get("/:id", tagController.findOne);
  router.put("/:id", [StoreRBAC], tagController.update);
  router.delete("/:id", tagController.delete);
  app.use("/api/tags", router);
};

module.exports.permissions = permissions;
