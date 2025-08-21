// src/api/post/postRoutes.js
const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const bannerController = require("../controllers/banner");
const { validateRequest } = require("../middlewares/banner");

// Define routes for the "Post" resource

const permissions = [
  {
    api: "banners",
    endpoint: "/api/banners",
    method: "POST",
    handler: "Create Banner",
  },
  {
    api: "banners",
    endpoint: "/api/banners",
    method: "GET",
    handler: "List Banners",
  },
  {
    api: "banners",
    endpoint: "/api/banners/:id",
    method: "GET",
    handler: "List Single Banners",
  },
  {
    api: "banners",
    endpoint: "/api/banners/:id",
    method: "PUT",
    handler: "Update Banners",
  },
  {
    api: "banners",
    endpoint: "/api/banners/:id",
    method: "DELETE",
    handler: "Delete Banners",
  },
];
module.exports = (app) => {
  router.post("/", [RBAC, validateRequest], bannerController.create);
  router.get("/", bannerController.find);
  router.get("/:id", bannerController.findOne);
  router.put("/:id", bannerController.update);
  router.delete("/:id", bannerController.destroy);
  app.use("/api/banners", router);
};
module.exports.permissions = permissions;
