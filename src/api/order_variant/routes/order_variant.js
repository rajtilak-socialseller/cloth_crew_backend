const router = require("express").Router();
const StoreRBAC = require("../../../middlewares/StoreRBAC");
const ordersController = require("../controllers/order_variant")

const permissions = [
  {
    api: "order-variants",
    endpoint: "/api/order-variants",
    method: "POST",
    handler: "Create Order Variant",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants",
    method: "GET",
    handler: "List Order Variants",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/store-users",
    method: "GET",
    handler: "List User Order Variants",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/stats",
    method: "GET",
    handler: "Get order variant stats",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/store-users/stats",
    method: "GET",
    handler: "Get Store User order stats",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id",
    method: "GET",
    handler: "Find Order Variant",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/store-users",
    method: "GET",
    handler: "Find User Order Variant",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id",
    method: "PUT",
    handler: "Update Order Variant",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id",
    method: "DELETE",
    handler: "Delete Order Variant",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/variants",
    method: "GET",
    handler: "Find Variants by Order ID",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:orderId/variants/:variantId/return_request",
    method: "PUT",
    handler: "Update Return Status",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/accept",
    method: "PUT",
    handler: "Accept Order",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/track",
    method: "GET",
    handler: "Track Order",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/decline",
    method: "PUT",
    handler: "Decline Order",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/cancel",
    method: "PUT",
    handler: "Cancel Order",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/deliver",
    method: "PUT",
    handler: "Deliver Order",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/return-request",
    method: "PUT",
    handler: "Return Request",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/:id/return-decline",
    method: "PUT",
    handler: "Decline Return",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/return-requests",
    method: "GET",
    handler: "List Return Requests",
  },
  {
    api: "order-variants",
    endpoint: "/api/order-variants/export",
    method: "POST",
    handler: "Export Order Variants To Excel",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRBAC], ordersController.create);
  router.post("/export", ordersController.exportToExcel);
  router.get("/stats", ordersController.stats);
  router.get("/return-requests", ordersController.listReturnRequests);
  router.get("/:id/track", ordersController.trackOrder);
  router.get("/store-users", ordersController.storeUserOrders);
  router.get("/store-users/stats", ordersController.storeUserOrderStats);
  router.get("/", ordersController.find);
  router.get("/:id/store-users", ordersController.findOneStoreUser);
  router.get("/:id", ordersController.findOne);
  router.put("/:id", [StoreRBAC], ordersController.update);
  router.delete("/:id", [StoreRBAC], ordersController.delete);
  router.put("/bulk/accept", ordersController.acceptBulkOrder);
  router.get("/:id/variants", ordersController.findByOrderId);
  router.put("/:id/accept", ordersController.acceptOrder);
  router.put("/:id/decline", ordersController.declineOrder);
  router.put("/:id/cancel", ordersController.cancelOrder);
  router.put("/:id/deliver", ordersController.deliverOrder);
  router.put("/:id/return-request", ordersController.returnRequest);
  router.put("/:id/return-decline", ordersController.declineReturn);
  router.put("/:orderId/variants/:variantId/return_request", [StoreRBAC], ordersController.updateReturnStatus);
  app.use("/api/order-variants", router);
};

module.exports.permissions = permissions;
