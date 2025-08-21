// routes/selfPickup.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/pickupAddress");

module.exports = router;

module.exports = (app) => {
  router.get("/get-self-pickup", controller.getAllSelfPickups);
  router.post("/self-pickup", controller.createSelfPickup);
  app.use("/api/pickup-address", router);
};
