const path = require("path");
const sharp = require("sharp");
const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse } = require("../../../services/errorResponse");


const getVideoInfo = require("../services/getVideoInfo");
const aws_s3_uploader = require("../../../services/aws_s3");
// Controller function to create a new post
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    // return res.status(200).send({ files: req.uploadedFiles })
    if (!req.files || req.files.length === 0) {
      return res.status(500).send({ error: "No files uploaded" });
    } else {
      const sequelize = req.db;
      const uploadPromises = req.files.map(async (file) => {
        let mediaObject;
        // if (file.mimetype.startsWith("image")) {
        //   const imageInfo = await sharp(file.path).metadata();
        //   const formatTypes = [
        //     {
        //       name: "small",
        //       width: 500,
        //       height: 500,
        //     },
        //     {
        //       name: "thumbnail",
        //       width: 200,
        //       height: 200,
        //     },
        //   ];

        //   let formats = {};

        //   for (let index = 0; index < formatTypes.length; index++) {
        //     const formatElement = formatTypes[index];
        //     const element = formatElement;
        //     const fileName = `${element.name}_${file.filename}`;
        //     const filePath = path.join("public/uploads", fileName);
        //     const resizedFile = await sharp(file.path).resize(element.width, element.height).toFile(filePath);
        //     const prefix = "/"


        //     const frmtsObject = {
        //       name: element.name + "_" + file.filename,
        //       url: prefix + filePath.split("\\").join("/"),
        //       size: resizedFile.size / 1024,
        //       width: element.width,
        //       height: element.height,
        //       type: element.name,
        //     };
        //     formats[element.name] = frmtsObject;
        //   }

        //   const filePath = file.path.split("\\").join("/");
        //   const prefix = "/"

        //   mediaObject = {
        //     name: file.filename,
        //     path: "",
        //     url: prefix + filePath,
        //     size: file.size,
        //     width: imageInfo.width,
        //     height: imageInfo.height,
        //     formats: formats,
        //   };
        // } else if (file.mimetype.startsWith("video")) {
        //   const videoInfo = await getVideoInfo(file.path);

        //   const filePath = file.path.split("\\").join("/");
        //   const prefix = "/";
        //   //console.log(filePath.split("/")[-1])
        //   mediaObject = {
        //     name: file.filename,
        //     path: "",
        //     url: `/api/uploads/${file.filename}/stream`,
        //     size: file.size,
        //     type: "video",
        //     width: videoInfo.resolution.width,
        //     height: videoInfo.resolution.height,
        //     duration: videoInfo.duration,
        //   };
        // } else {
        //   return res.status(500).send({ error: "Unsupported file type" });
        // }
        const fileURL = await aws_s3_uploader(file)
        const mediaEntity = await sequelize.models.Media.create({ name: file.originalname, url: fileURL });
        return mediaEntity;
      });

      const uploadedMedia = await Promise.all(uploadPromises);
      return res.status(200).send(uploadedMedia);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      error: error.message,
    });
  }
};


/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
// Controller function to get all posts
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const pagination = await getPagination(req.query.pagination);
    const files = await sequelize.models.Media.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });
    const meta = await getMeta(pagination, files.count);
    return res.status(200).send({ data: files.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const upload = await sequelize.models.Media.findByPk(id);
    if (upload) {
      return res.status(200).send(upload);
    } else {
      return res.status(404).send(errorResponse({ status: 404, message: "File not found!", details: "id seems to be invalid" }));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const upload = await sequelize.models.Media.findByPk(id);
    if (upload) {
      const update = await sequelize.models.Media.update(req.body);
      return res.status(200).send({ data: update });
    } else {
      return res.status(404).send(errorResponse({ status: 404, message: "File not found!", details: "id seems to be invalid" }));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const upload = await sequelize.models.Media.findByPk(id);
    if (upload) {
      const destroy = await sequelize.models.Media.destroy({
        where: { id: id },
      });
      return res.status(200).send({ message: "File Deleted Successfully" });
    } else {
      return res.status(404).send(errorResponse({ status: 404, message: "File not found!", details: "id seems to be invalid" }));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
}

exports.streamVideo = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const { filename } = req.params;
    const videoPath = path.join(process.cwd(), 'public', 'uploads', filename);
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;

    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.set('Content-Type', 'video/mp4');
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);

  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
