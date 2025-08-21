// src/api/post/postRoutes.js
const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const queryValidator = require("../../../middlewares/queryValidator");
const categoryController = require("../controllers/category");
const { validateCreateRequest, validateUpdateRequest, } = require("../middlewares/category");

// Define routes for the "Post" resource


const permissions = [
  {
    api: "category",
    endpoint: "/api/categories",
    method: "POST",
    handler: "Create category",
  },
  {
    api: "category",
    endpoint: "/api/categories",
    method: "GET",
    handler: "List categories",
  },
  {
    api: "category",
    endpoint: "/api/categories/:id",
    method: "GET",
    handler: "List Single category",
  },
  {
    api: "category",
    endpoint: "/api/categories/:id",
    method: "PUT",
    handler: "Update category",
  },
  {
    api: "category",
    endpoint: "/api/categories/:id",
    method: "DELETE",
    handler: "Delete category",
  },
  {
    api: "category",
    endpoint: "/api/categories/:id/products",
    method: "GET",
    handler: "List Category's products",
  },
  {
    api: "category",
    endpoint: "/api/categories/:id/products/search",
    method: "GET",
    handler: "Search Category's products",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC, validateCreateRequest], categoryController.create);
  router.get("/", categoryController.find);
  router.get("/:id", categoryController.findOne);
  router.put("/:id", [StoreRBAC, validateUpdateRequest], categoryController.update);
  router.delete("/:id", [StoreRBAC], categoryController.delete);
  router.get("/:id/products", categoryController.getProducts);
  router.get("/:id/products/search", [queryValidator.search], categoryController.searchInCategory);
  app.use("/api/categories", router);
};
module.exports.permissions = permissions