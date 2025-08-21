const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const custom_courierController = require("../controllers/custom_courier");
const {
  validateCreateCustomCourier,
  validateUpdateCustomCourier,
  validateReturnCustomCourier,
} = require("../middlewares/custom_courier");


const permissions = [
  {
    api: "custom-courier",
    endpoint: "/api/custom-courier",
    method: "POST",
    handler: "Create custom-courier",
  },
  {
    api: "custom-courier",
    endpoint: "/api/custom-courier/return",
    method: "POST",
    handler: "Return custom-courier Product",
  },
  {
    api: "custom-courier",
    endpoint: "/api/custom-courier/:id",
    method: "GET",
    handler: "List Single custom-courier",
  },
  {
    api: "custom-courier",
    endpoint: "/api/custom-courier",
    method: "GET",
    handler: "List custom-couriers",
  },
  {
    api: "custom-courier",
    endpoint: "/api/custom-courier/:id",
    method: "PUT",
    handler: "Update custom-courier",
  },
  {
    api: "custom-courier",
    endpoint: "/api/custom-courier/:id",
    method: "DELETE",
    handler: "Delete custom-courier",
  },

];

// Define routes for the "Custom_courier" resource
module.exports = (app) => {
  router.post("/", [StoreRBAC], validateCreateCustomCourier, custom_courierController.create);
  router.post("/return", [StoreRBAC], validateReturnCustomCourier, custom_courierController.productReturn);
  router.get("/", [StoreRBAC], custom_courierController.find);
  router.get("/:id", [StoreRBAC], custom_courierController.findOne);
  router.put(
    "/:id",
    [StoreRBAC],
    validateUpdateCustomCourier,
    custom_courierController.update
  );
  router.delete("/:id", [StoreRBAC], custom_courierController.delete);
  app.use("/api/custom-courier", router);
};

module.exports.permissions = permissions