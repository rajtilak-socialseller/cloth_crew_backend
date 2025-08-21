const router = require("express").Router();
const RBAC = require("../../../middlewares/RBAC");
const token_id_verify = require("../middlewares/jwt_id_verify");
const { create, find, findOne, update, login, getMe, search, googleAuth, dashboard, supportTickets, changeStatus, validationCheker, findMyAccount, exportToExcel, preRegistration, sendExpiredMessage, } = require("../controllers/user");
const {
  createBody,
  updateBody,
  validateLoginBody,
} = require("../middlewares/user");
const blockReservedUsernames = require("../../../middlewares/blockReservedUsernames");

const permissions = [
  {
    api: "users",
    endpoint: "/api/users",
    method: "POST",
    handler: "Onboard Client",
  },
  {
    api: "users",
    endpoint: "/api/users",
    method: "GET",
    handler: "List All Clients",
  },
  {
    api: "users",
    endpoint: "/api/users/:id",
    method: "GET",
    handler: "List Single Client",
  },
  {
    api: "users",
    endpoint: "/api/users/me",
    method: "GET",
    handler: "List User Details",
  },
  {
    api: "users",
    endpoint: "/api/users/:id",
    method: "PUT",
    handler: "Update Client",
  },
  // {
  //   api: "users",
  //   endpoint: "/api/users/:id",
  //   method: "DELETE",
  //   handler: "Delete Client",
  // },
  {
    api: "users",
    endpoint: "/api/users/search",
    method: "GET",
    handler: "Search Clients",
  },
  {
    api: "users",
    endpoint: "/api/users/dashboard",
    method: "GET",
    handler: "User's Dashboard",
  },
  {
    api: "users",
    endpoint: "/api/users/:id/support-tickets",
    method: "GET",
    handler: "List User's Support Tickets",
  },
  {
    api: "users",
    endpoint: "/api/users/:id/status",
    method: "PUT",
    handler: "Change Store's Status",
  },
  {
    api: "users",
    endpoint: "/api/users/login",
    method: "POST",
    handler: "User Login",
  },
];

module.exports = (app) => {
  router.post("/users", [createBody, blockReservedUsernames], create);
  router.post("/users/preregister", preRegistration);
  router.post("/users/send-expired-message", sendExpiredMessage);
  router.get("/users", [RBAC], find);
  router.get("/users/:id/support-tickets", [RBAC], supportTickets);
  router.get("/users/me", getMe);
  router.get("/users/search", [RBAC], search);
  router.get("/users/find-store", [], findMyAccount);
  router.get("/users/validation/check", [], validationCheker);
  router.get("/users/dashboard", [RBAC], dashboard);
  router.get("/users/:id", [RBAC], findOne);
  router.put("/users/:id", [RBAC, updateBody], update);
  router.put("/users/:id/status", [RBAC], changeStatus);
  // router.delete("/users/:id", [RBAC], destroy);
  router.post("/users/login", [validateLoginBody], login);
  router.post("/users/export", [RBAC], exportToExcel);
  router.get("/users/auth/google", googleAuth);
  app.use("/api", router);
};
module.exports.permissions = permissions;
