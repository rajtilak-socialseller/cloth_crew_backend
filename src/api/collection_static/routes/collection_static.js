const router = require("express").Router();
const collectionStaticController = require("../controllers/collection_static");
const { validateCreateRequest, validateUpdateRequest } = require("../middlewares/collection_static");

const permissions = [
  {
    api: "collection-static",
    endpoint: "/api/collection-static",
    method: "POST",
    handler: "Create collection-static",
  },
  {
    api: "collection-static",
    endpoint: "/api/collection-static",
    method: "GET",
    handler: "List collection-static",
  },
  {
    api: "collection-static",
    endpoint: "/api/collection-static/:id",
    method: "GET",
    handler: "List Single collection-static",
  },
  {
    api: "collection-static",
    endpoint: "/api/collection-static/:id",
    method: "PUT",
    handler: "Update collection-static",
  },
  {
    api: "collection-static",
    endpoint: "/api/collection-static/:id",
    method: "DELETE",
    handler: "Delete collection-static",
  },
  {
    api: "collection-static",
    endpoint: "/api/collection-static/:id/products",
    method: "GET",
    handler: "List collection-static's products",
  },

];

module.exports = (app) => {
  router.post("/", validateCreateRequest, collectionStaticController.create);
  router.get("/", collectionStaticController.find);
  router.get("/:id", collectionStaticController.findOne);
  router.put("/:id", validateUpdateRequest, collectionStaticController.update);
  router.delete("/:id", collectionStaticController.delete);
  router.get("/:id/products", collectionStaticController.getProducts);

  app.use("/api/collection-static", router);
};
module.exports.permissions = permissions