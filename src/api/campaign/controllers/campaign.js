const { default: axios } = require("axios");
const { activity_event } = require("../../../constants/activity_log");
const { createActivityLog } = require("../../../services/createActivityLog");
const { errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { IntraktNotify } = require("../../../services/notification");
const { getPagination, getMeta } = require("../../../services/pagination");
const campaign = require("../services/campaign");

/**
 * Controller function to create a new campaign
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const body = req.body;

    const { notification_title, notification_body, NotificationImageId, web_notification,
      app_notification, type } = body
    const image = await sequelize.models.Media.findByPk(NotificationImageId, { raw: true })
    if (!image) {
      return res.status(400).send(errorResponse({ message: "Invalid Image ID" }))
    }

    let image_url = image.url
    const Createcampaign = await sequelize.models.Campaign.create({ ...req.body, image_url: image_url }, { transaction: t });
    // await campaign({
    //   title: notification_title,
    //   body: notification_body,
    //   app_notification,
    //   web_notification,
    //   imageUrl: image_url,
    //   // imageUrl: "https://media.macphun.com/img/uploads/customer/how-to/608/15542038745ca344e267fb80.28757312.jpg?q=85&w=1340",
    //   targetType: "topic",
    //   topic: "test_topic"
    // })

    const users = await sequelize.models.Store_user.findAll({
      attributes: ["phone"],
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Consumer" }, attributes: []
        }]
    })
    const phoneNumbers = JSON.parse(JSON.stringify(users)).map((item) => item.phone)
    console.log(phoneNumbers)
    let interakt_data;
    const global = await sequelize.models.Store_global.findOne();
    if (type === "PRODUCT") {
      const entity = await sequelize.models.Product.findByPk(body.data, { include: ["thumbnail", "variants"] })
      interakt_data = {
        containsImage: true,
        hasButton: false,
        // template: "product_added",
        phoneNumber: phoneNumbers,
        body: [notification_body],
        buttonValues: { 0: [`${global.store_link}/${type.toLowerCase()}/${body?.data?.trim()}`] },
        image: image_url
      };
    }

    IntraktNotify(interakt_data, sequelize, "CAMPAIGN")

    const notification = await sequelize.models.Notification.create({
      title: notification_title,
      desctiption: notification_body,
      type: type,
      isRead: false,
      data: null,
    }, { transaction: t })
    await createActivityLog({ event: activity_event.NEW_CAMPAIGN_ADDED, sequelize, StoreUserId: token.id, transaction: t })
    await t.commit();
    return res.status(200).send({ message: "Campaign Created Successfully!", data: Createcampaign });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send(errorResponse({ message: "Failed to create a campaign", status: 500 }));
  }
};

/**
 * Controller function to update an existing campaign
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const [updatedRowsCount, updatedCampaign] = await sequelize.models.Campaign.update(req.body, {
      where: { id: id },
      returning: true,
    });
    if (updatedRowsCount === 0) {
      return res.status(404).send(errorResponse({ status: 400, message: "Campaign not found" }));
    }
    return res.status(200).send({
      message: "Campaign Updated Successfully!",
      data: updatedCampaign[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to update the campaign" }));
  }
};

/**
 * Controller function to find all campaigns
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const campaigns = await sequelize.models.Campaign.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const meta = await getMeta(pagination, campaigns.count);
    return res.status(200).send({ data: campaigns.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ message: "Failed to fetch campaigns", status: 500 }));
  }
};

/**
 * Controller function to find a single campaign by its ID
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const campaignId = req.params.id;
    const campaign = await sequelize.models.Campaign.findOne({
      where: { id: campaignId },
    });
    if (!campaign) {
      return res.status(404).send(errorResponse({ status: 400, message: "Campaign not found" }));
    }
    return res.status(200).send({ data: campaign });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ message: "Failed to fetch the campaign", status: 500 }));
  }
};

/**
 * Controller function to delete a campaign by its ID
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const campaignId = req.params.id;
    const deletedRowCount = await sequelize.models.Campaign.destroy({
      where: { id: campaignId },
    });
    if (deletedRowCount === 0) {
      return res.status(404).send(errorResponse({ message: "Campaign not found" }));
    }
    return res.status(200).send({ message: "Campaign Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ message: "Failed to delete the campaign", status: 500 }));
  }
};
