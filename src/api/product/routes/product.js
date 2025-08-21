const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const productController = require("../controllers/product");
const Joi = require("../middlewares/product");
const multer = require("multer");
const upload = multer();

const permissions = [
  {
    api: "products",
    endpoint: "/api/products",
    method: "POST",
    handler: "Create Product",
  },
  {
    api: "products",
    endpoint: "/api/products",
    method: "GET",
    handler: "List Products",
  },
  {
    api: "products",
    endpoint: "/api/products/create-pdf/:id",
    method: "GET",
    handler: "Create PDF for Product",
  },
  {
    api: "products",
    endpoint: "/api/products/:id",
    method: "GET",
    handler: "Find Product",
  },
  {
    api: "products",
    endpoint: "/api/products/:id",
    method: "PUT",
    handler: "Update Product",
  },
  {
    api: "products",
    endpoint: "/api/products/:id",
    method: "DELETE",
    handler: "Delete Product",
  },
  {
    api: "products",
    endpoint: "/api/search/products",
    method: "GET",
    handler: "Search Products",
  },
  {
    api: "products",
    endpoint: "/api/products/filter/price",
    method: "GET",
    handler: "Filter Products by Price",
  },
  {
    api: "products",
    endpoint: "/api/products/:n/random",
    method: "GET",
    handler: "Find N Random Products",
  },
  {
    api: "products",
    endpoint: "/api/products/:n/random/category/:id",
    method: "GET",
    handler: "Find N Random Products in Category",
  },
  {
    api: "products",
    endpoint: "/api/products/:n/trending",
    method: "GET",
    handler: "Find Trending Products",
  },
  {
    api: "products",
    endpoint: "/api/products/:n/trending",
    method: "GET",
    handler: "Find Top Selling Products",
  },
  {
    api: "products",
    endpoint: "/api/products/export",
    method: "POST",
    handler: "Export Products",
  },
  {
    api: "products",
    endpoint: "/api/products/import",
    method: "POST",
    handler: "Import Products",
  },
  {
    api: "products",
    endpoint: "/api/products/simple-data",
    method: "GET",
    handler: "Get product's id and name",
  },
  {
    api: "products",
    endpoint: "/api/products/:id/collection/:cId",
    method: "PUT",
    handler: "Remove product collection",
  },
];

module.exports = (app) => {
  router.post("/products", [Joi.validateCreateBody], productController.create);
  router.post("/products/selected", productController.findByIds);
  router.get("/products", productController.find);
  router.put(
    "/products/:id/collection/:cId",
    productController.removeCollection
  );
  router.get("/products/simple-data", productController.simpleData);
  router.get("/products/stats", productController.stats);
  router.get("/products/reviews-list", productController.productsByReview);
  router.post("/products/:id/share", productController.shareProduct);
  router.post(
    "/products/import/shopify",
    [Joi.importFromShopify],
    productController.importFromShopify
  );
  router.post("/products/export", productController.exportToExcel);

  router.post(
    "/products/import",
    upload.single("file"),
    productController.importFromExcel
  );

  router.get("/products/create-pdf/:id", productController.catalouge);
  router.get("/products/:id", productController.findOne);
  router.put(
    "/products/:id",
    [Joi.validateUpdateBody],
    productController.update
  );
  router.delete("/products/:id", [StoreRBAC], productController.delete);
  router.get("/search/products", [], productController.search);
  router.get(
    "/products/filter/price",
    [Joi.filterValidator],
    productController.findByPrice
  );
  router.get("/products/:n/random", productController.findNRandom);
  router.get("/products/:n/trending", productController.findNTrending);
  router.get("/products/:n/selling", productController.findNSelling);
  router.get(
    "/products/:n/random/category/:id",
    productController.findNRandomInCategory
  );

  router.post("/products/info", productController.productInfo);
  app.use("/api", router);
};

module.exports.permissions = permissions;
