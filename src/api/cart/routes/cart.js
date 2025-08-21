const express = require("express");
const router = express.Router();

const cartsController = require("../controllers/cart");
const { validateAddToCart } = require("../middlewares/cart");


const permissions = [
  {
    api: "cart",
    endpoint: "/api/cart/add",
    method: "POST",
    handler: "Add To Cart",
  },
  {
    api: "cart",
    endpoint: "/api/cart/me",
    method: "GET",
    handler: "List Consumer cart",
  },
  {
    api: "cart",
    endpoint: "/api/cart/empty",
    method: "DELETE",
    handler: "Empty cart",
  },
  {
    api: "cart",
    endpoint: "/api/cart/remove/:id",
    method: "DELETE",
    handler: "Remove Item From Cart",
  },
];

module.exports = (app) => {

  router.post("/add", validateAddToCart, cartsController.addToCart);
  router.get("/me", cartsController.consumerCart);
  router.delete("/empty", cartsController.emptyCart);
  router.delete("/remove/:id", cartsController.deleteVariant);
  app.use("/api/cart", router);
};
module.exports.permissions = permissions
