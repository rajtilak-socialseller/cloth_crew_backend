// src/api/post/postRoutes.js
const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const bannerController = require("../controllers/banner");
const { validateRequest } = require("../middlewares/banner");

// Define routes for the "Post" resource

const permissions = [
  {
    api: "store-banners",
    endpoint: "/api/store-banners",
    method: "POST",
    handler: "Create Store Banner",
  },
  {
    api: "store-banners",
    endpoint: "/api/store-banners",
    method: "GET",
    handler: "List Store Banners",
  },
  {
    api: "store-banners",
    endpoint: "/api/store-banners/:id",
    method: "GET",
    handler: "List Single Store Banners",
  },
  {
    api: "store-banners",
    endpoint: "/api/store-banners/:id",
    method: "PUT",
    handler: "Update Store Banners",
  },
  {
    api: "store-banners",
    endpoint: "/api/store-banners/:id",
    method: "DELETE",
    handler: "Delete Store Banners",
  },
];
module.exports = (app) => {
  router.post("/", [validateRequest], bannerController.create);
  router.get("/", bannerController.find);
  router.get("/:id", bannerController.findOne);
  router.put("/:id", bannerController.update);
  router.delete("/:id", bannerController.destroy);
  app.use("/api/store-banners", router);
};
module.exports.permissions = permissions;
