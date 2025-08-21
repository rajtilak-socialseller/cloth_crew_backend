// src/api/post/postRoutes.js
const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const support_ticketController = require("../controllers/support_ticket");
const {
    validateRequest,
    validateUpdateRequest,
} = require("../middlewares/support_ticket");

// Define routes for the "Post" resource
const permissions = [
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets",
        method: "POST",
        handler: "Create Support Ticket",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets",
        method: "GET",
        handler: "List All Support Ticket",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets/:id",
        method: "GET",
        handler: "List Single Support Ticket",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets/:id",
        method: "PUT",
        handler: "Update Support Ticket",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets/:id/:status",
        method: "PUT",
        handler: "Change Support Ticket Status",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets/:id",
        method: "DELETE",
        handler: "Delete Support Ticket",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets/stats",
        method: "GET",
        handler: "GET Support Tickets Stats",
    },
    {
        api: "support-tickets",
        endpoint: "/api/support-tickets/export",
        method: "GET",
        handler: "Export Support Tickets To Excel",
    },
];
module.exports = (app) => {
    router.post("/", [validateRequest], support_ticketController.create);
    router.get("/", [RBAC], support_ticketController.find);
    router.get("/stats", [RBAC], support_ticketController.stats);
    router.get("/export", [], support_ticketController.exportToExcel);
    router.get("/:id", [RBAC], support_ticketController.findOne);
    router.put("/:id", [RBAC], [validateUpdateRequest], support_ticketController.update);
    router.put("/:id/:status", [RBAC], support_ticketController.changeStatus);
    router.delete("/:id", [RBAC], support_ticketController.delete);
    app.use("/api/support-tickets", router);
};

module.exports.permissions = permissions;
