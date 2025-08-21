const router = require("express").Router();
const groupController = require("../controllers/group");
const { validateRequest } = require("../middlewares/group");
const StoreRABC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "groups",
    endpoint: "/api/groups",
    method: "POST",
    handler: "Create Group",
  },
  {
    api: "groups",
    endpoint: "/api/groups",
    method: "GET",
    handler: "List Groups",
  },
  {
    api: "groups",
    endpoint: "/api/groups/:id",
    method: "GET",
    handler: "Find Group",
  },
  {
    api: "groups",
    endpoint: "/api/groups/:id",
    method: "PUT",
    handler: "Update Group",
  },
  {
    api: "groups",
    endpoint: "/api/groups/:id",
    method: "DELETE",
    handler: "Delete Group",
  },
];

module.exports = (app) => {
  router.post("/", validateRequest, groupController.create);
  router.get("/", groupController.find);
  router.get("/:id", groupController.findOne);
  router.put("/:id", validateRequest, groupController.update);
  router.delete("/:id", groupController.delete);
  app.use("/api/groups", router);
};

module.exports.permissions = permissions;
