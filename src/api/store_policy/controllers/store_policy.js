// controllers/StorePolicyController.js

const { errorResponse } = require("../../../services/errorResponse");

/**
 * Controller function to create/update the default page content
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const getStorePolicy = await sequelize.models.Store_policy.findOne();

    if (getStorePolicy) {
      const updateStorePolicy = await sequelize.models.Store_policy.update(req.body, {
        where: { id: getStorePolicy.id },
        returning: true,
      });

      return res.status(200).send({
        message: "Store Plicy updated",
        data: updateStorePolicy[1][0],
      });
    } else {
      const StorePolicy = await sequelize.models.Store_policy.create(req.body);
      return res.status(200).send({
        message: "Store Plicy Created Successfully",
        data: StorePolicy,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ message: "Internal Server Error", status: 500 }));
  }
};

exports.get = async (req, res) => {
  try {
    const sequelize = req.db;
    const attributes = ["about_us", "terms_and_conditions", "privacy_policy", "refund_and_cancellation", "ship_and_delivery", "contact_us",]
    const tag = req.query.tag;
    if (tag && !attributes.includes(tag)) return res.status(400).send(errorResponse({ message: `invalid tag passed select on from ${attributes}` }))
    const StorePolicy = await sequelize.models.Store_policy.findOne({
      attributes: (tag ? [tag] : null)
    });
    return res.status(200).send({ data: StorePolicy });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ message: "Internal Server Error", status: 500 }));
  }
};
