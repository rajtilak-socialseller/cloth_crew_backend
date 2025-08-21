const express = require("express");
const router = express.Router();
const storeUserController = require("../controllers/store_user");
const { createUser, updateUser, FCM_registration, validatelogin, forgetPassword, resetPassword, validateSendOTP, validateVerifyOTP } = require("../middlewares/store_user");
const StoreRBCA = require("../../../middlewares/StoreRBAC");
const jwt_id_verify = require("../../user/middlewares/jwt_id_verify");

const permissions = [
  {
    api: "store-users",
    endpoint: "/api/store-users/forget-password",
    method: "PUT",
    handler: "Forget Password",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/reset-password",
    method: "PUT",
    handler: "Reset Password",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users",
    method: "POST",
    handler: "Create Store User",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/:id",
    method: "PUT",
    handler: "Update Store User",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users",
    method: "GET",
    handler: "List Store Users",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/me",
    method: "GET",
    handler: "Get Current Store User",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/search",
    method: "GET",
    handler: "Search Store Users",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/:id",
    method: "GET",
    handler: "Find One Store User",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/:id",
    method: "DELETE",
    handler: "Delete Store User",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/login",
    method: "POST",
    handler: "Login",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/fcm/register",
    method: "POST",
    handler: "Register FCM",
  },
  {
    api: "store-users",
    endpoint: "/api/store-users/dashboard",
    method: "GET",
    handler: "Get Store Dashboard",
  },
];

module.exports = (app) => {
  router.put("/forget-password", [forgetPassword], storeUserController.forgetPassword);
  router.put("/reset-password", [resetPassword], storeUserController.resetPassword);
  router.post("/", [createUser], storeUserController.create);
  router.put("/:id", [updateUser], storeUserController.update);
  router.get("/", [StoreRBCA], storeUserController.find);
  router.get("/me", storeUserController.getMe);
  router.get("/search", [StoreRBCA], storeUserController.search);
  router.get("/:id/full-detail", [], storeUserController.fullDetail);
  router.get("/dashboard", [], storeUserController.dashboard);
  router.get("/:id", [StoreRBCA], storeUserController.findOne);
  router.delete("/:id", [StoreRBCA], storeUserController.delete);
  router.post("/admin/login", [validatelogin], storeUserController.adminLogin);
  router.post("/send-otp", [validateSendOTP], storeUserController.setOTP);
  router.post("/verify-otp", [validateVerifyOTP], storeUserController.verifyOTP);
  router.post("/login", [validatelogin], storeUserController.login);
  router.post("/fcm/register", [FCM_registration], storeUserController.register_FCM);
  router.post("/staff/login", [validatelogin], storeUserController.stafflogin)
  router.post("/staff/register", [createUser], storeUserController.staffRegister)
  router.get("/staff/listing", [], storeUserController.staffListings)
  router.get("/staff/search", [], storeUserController.searchStaff)
  router.put("/staff/:id/update", [updateUser], storeUserController.updateStaff)
  router.delete("/staff/:id/delete", [], storeUserController.deleteStaff)
  app.use("/api/store-users", router);
};

// Exporting the permissions array separately
module.exports.permissions = permissions;
