const express = require("express");
const router = express.Router();
const supportTicketController = require("../controllers/store_support_ticket");
const { validateRequest, validateUpdateRequest } = require("../middlewares/store_support_ticket");

const permissions = [
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets",
    method: "POST",
    handler: "Create Store Support Ticket",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/store-user",
    method: "GET",
    handler: "User Tickets",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/store-user/:id",
    method: "GET",
    handler: "User Single Ticket",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets",
    method: "GET",
    handler: "Find Store Support Tickets",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/:id",
    method: "GET",
    handler: "Find One Store Support Ticket",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/:id",
    method: "PUT",
    handler: "Update Store Support Ticket",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/:id/:status",
    method: "PUT",
    handler: "Change Status of Store Support Ticket",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/:id",
    method: "DELETE",
    handler: "Delete Store Support Ticket",
  },
  {
    api: "store-support-tickets",
    endpoint: "/api/store-support-tickets/export",
    method: "GET",
    handler: "Export Store Support Ticket To excel",
  },
];

module.exports = (app) => {
  router.post("/", [validateRequest], supportTicketController.create);
  router.get("/store-user", supportTicketController.userTickets);
  router.get("/export", supportTicketController.exportToExcel);
  router.get("/store-user/:id", supportTicketController.userSingleTicket);
  router.get("/", supportTicketController.find);
  router.get("/:id", supportTicketController.findOne);
  router.put("/:id", [validateUpdateRequest], supportTicketController.update);
  router.put("/:id/:status", supportTicketController.changeStatus);
  router.delete("/:id", supportTicketController.delete);
  app.use("/api/store-support-tickets", router);
};

module.exports.permissions = permissions;
