const express = require("express");
const router = express.Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const subCategoryController = require("../controllers/sub_category");
const { validateCreateRequest, validateUpdateRequest } = require("../middlewares/sub_category");

const permissions = [
  {
    api: "sub-categories",
    endpoint: "/api/sub-categories",
    method: "POST",
    handler: "Create Sub-Category",
  },
  {
    api: "sub-categories",
    endpoint: "/api/sub-categories/:id",
    method: "PUT",
    handler: "Update Sub-Category",
  },
  {
    api: "sub-categories",
    endpoint: "/api/sub-categories",
    method: "GET",
    handler: "Get Sub-Categories",
  },
  {
    api: "sub-categories",
    endpoint: "/api/sub-categories/:id",
    method: "GET",
    handler: "Get Sub-Category by ID",
  },
  {
    api: "sub-categories",
    endpoint: "/api/sub-categories/:id",
    method: "DELETE",
    handler: "Remove Sub-Category",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateCreateRequest], subCategoryController.create);
  router.put("/:id", [StoreRBAC, validateUpdateRequest], subCategoryController.update);
  router.get("/", [], subCategoryController.find);
  router.get("/:id", [], subCategoryController.findOne);
  router.get("/:id/products", [], subCategoryController.getProducts);
  router.delete("/:id", [StoreRBAC], subCategoryController.delete);

  app.use("/api/sub-categories", router);
};

module.exports.permissions = permissions;
