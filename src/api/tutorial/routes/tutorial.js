const express = require("express");
const router = express.Router();
const tutorialController = require("../controllers/tutorial");
const { validateCreateTutorial, validateUpdateTutorial } = require("../middlewares/tutorial");
const StoreRABC = require("../../../middlewares/StoreRBAC");

const permissions = [
  {
    api: "tutorial",
    endpoint: "/api/tutorial",
    method: "POST",
    handler: "Create Tutorial",
  },
  {
    api: "tutorial",
    endpoint: "/api/tutorial",
    method: "GET",
    handler: "List Tutorials",
  },
  {
    api: "tutorial",
    endpoint: "/api/tutorial/:id",
    method: "GET",
    handler: "Find One Tutorial",
  },
  {
    api: "tutorial",
    endpoint: "/api/tutorial/:id",
    method: "PUT",
    handler: "Update Tutorial",
  },
  {
    api: "tutorial",
    endpoint: "/api/tutorial/:id",
    method: "DELETE",
    handler: "Delete Tutorial",
  },
];

module.exports = (app) => {
  router.post("/", [StoreRABC, validateCreateTutorial], tutorialController.create);
  router.put("/:id", [StoreRABC, validateUpdateTutorial], tutorialController.update);
  router.get("/", tutorialController.find);
  router.get("/:id", tutorialController.findOne);
  router.delete("/:id", tutorialController.delete);

  app.use("/api/tutorial", router);
};

module.exports.permissions = permissions;
