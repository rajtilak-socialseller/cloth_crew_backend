const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/upload");
// const upload = require("../../../services/fileUploader");
const { fileFormat } = require("../middlewares/upload");
const multer = require('multer');
const aws_s3_uploader = require("../../../services/aws_s3");
const upload = multer({
  limits: {
    fileSize: 100 * 1024 * 1024
  }
})
const permissions = [
  {
    api: "uploads",
    endpoint: "/api/uploads",
    method: "POST",
    handler: "Create Upload",
  },
  {
    api: "uploads",
    endpoint: "/api/uploads",
    method: "GET",
    handler: "List Uploads",
  },
  {
    api: "uploads",
    endpoint: "/api/uploads/:id",
    method: "GET",
    handler: "Find One Upload",
  },
  {
    api: "uploads",
    endpoint: "/api/uploads/:id",
    method: "PUT",
    handler: "Update Upload",
  },
  {
    api: "uploads",
    endpoint: "/api/uploads/:id",
    method: "DELETE",
    handler: "Delete Upload",
  },
  {
    api: "uploads",
    endpoint: "/api/uploads/:name/stream",
    method: "GET",
    handler: "Stream Video",
  },
];

module.exports = (app) => {
  router.post("/", [upload.array("file", 10)], uploadController.create);
  router.get("/", uploadController.find);
  router.get("/:filename/stream", uploadController.streamVideo);
  router.get("/:id", uploadController.findOne);
  router.put("/:id", [fileFormat], uploadController.update);
  router.delete("/:id", uploadController.delete);
  app.use("/api/uploads", router);
};

module.exports.permissions = permissions;
