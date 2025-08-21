const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collection");
const { validateCreateCollection, validateUpdateCollection, } = require("../middlewares/collection");
const StoreRABC = require("../../../middlewares/StoreRBAC");
const queryValidator = require("../../../middlewares/queryValidator");


const permissions = [
  {
    api: "collection",
    endpoint: "/api/collections",
    method: "POST",
    handler: "Create collection",
  },
  {
    api: "collection",
    endpoint: "/api/collections",
    method: "GET",
    handler: "List collections",
  },
  {
    api: "collection",
    endpoint: "/api/collections/:id",
    method: "GET",
    handler: "List Single collection",
  },
  {
    api: "collection",
    endpoint: "/api/collections/:id",
    method: "PUT",
    handler: "Update collection",
  },
  {
    api: "collection",
    endpoint: "/api/collections/:id",
    method: "DELETE",
    handler: "Delete collection",
  },
  {
    api: "collection",
    endpoint: "/api/collections/:id/products",
    method: "GET",
    handler: "List collection's products",
  },
  {
    api: "collection",
    endpoint: "/api/collections/:id/products/search",
    method: "GET",
    handler: "Search collection's products",
  },
];


router.post("/", [StoreRABC, validateCreateCollection], collectionController.create);
router.put("/:id", [StoreRABC, validateUpdateCollection], collectionController.update);
router.get("/", collectionController.find);
router.get("/:id", collectionController.findOne);
router.delete("/:id", [StoreRABC,], collectionController.delete);
router.get("/:id/products", collectionController.getProductsByCollection);
router.get("/:id/products/search", [queryValidator.search], collectionController.searchProductsInCollection);

module.exports = (app) => {
  app.use("/api/collections", router);
};

module.exports.permissions = permissions
