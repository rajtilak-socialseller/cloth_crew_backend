// src/api/post/postRoutes.js
const router = require("express").Router();
const couponController = require("../controllers/coupon");

// Define routes for the "Post" resource
module.exports = (app) => {
  router.post("/", couponController.create);
  router.get("/", couponController.find);
  router.get("/:id", couponController.findOne);
  router.put("/:id", couponController.update);
  router.delete("/:id", couponController.delete);
  app.use("/api/coupons", router);
};
