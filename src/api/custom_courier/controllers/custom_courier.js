const { order_status } = require("../../../constants/order");
const { errorResponse } = require("../../../services/errorResponse");
const orderTracker = require("../../../services/orderTracker");
const { getPagination, getMeta } = require("../../../services/pagination");

exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;

    const customCourier = await sequelize.models.Custom_courier.create(req.body);

    if (req.body.images && req.body.images.length) {
      const imageIds = req.body.images;

      const orderImages = imageIds.map((imageId) => ({
        CustomCourierId: customCourier.id,
        MediaId: imageId,
      }));

      const customCourierLinks = await sequelize.models.Courier_media_link.bulkCreate(orderImages, { transaction: t });
    }

    await sequelize.models.Order_variant.update(
      { status: order_status.intransit, CustomCourierId: customCourier.id },
      { where: { id: req.body.OrderVariantId }, transaction: t }
    );
    await orderTracker({
      sequelize,
      order_variant_ids: [req.body.OrderVariantId],
      status: order_status.intransit,
      transaction: t,
    });

    await t.commit();

    return res.status(200).send({
      message: "Customer Courier Created Successfully!",
      data: customCourier,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some Internal server error occurred!",
      })
    );
  }
};

exports.productReturn = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;

    await sequelize.models.Order_variant.update(
      { status: order_status.return_request },
      { where: { id: req.body.OrderVariantId } }
    );
    await orderTracker({
      sequelize,
      order_variant_ids: [req.body.OrderVariantId],
      status: order_status.return_request,
      transaction: t,
    });

    await t.commit();

    return res.status(200).send({
      message: "Return Order Created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some Internal server error occurred!",
      })
    );
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const customCourierId = req.params.id;
    const [updatedRowsCount, updatedCustomCourier] =
      await sequelize.models.Custom_courier.update(req.body, {
        where: { id: customCourierId },
        returning: true,
      });
    if (updatedRowsCount === 0) {
      return res.status(404).send(errorResponse({ message: "Custom courier ID" }));
    }
    return res.status(200).send({
      message: "Customer Courier Updated Successfully!",
      data: updatedCustomCourier[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
      status: 500,
      message: "Some Internal server error occured! ",
    }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;

    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const customCouriers = await sequelize.models.Custom_courier.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const meta = await getMeta(pagination, customCouriers.count);
    return res.status(200).send({ data: customCouriers.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const customCourierId = req.params.id;
    const customCourier = await sequelize.models.Custom_courier.findOne({
      where: { id: customCourierId },
    });
    if (!customCourier) {
      return res.status(404).send(errorResponse({ message: "Invalid ID find custom courier" }));
    }
    return res.status(200).send({ data: customCourier });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const customCourierId = req.params.id;
    const deletedRowCount = await sequelize.models.Custom_courier.destroy({
      where: { id: customCourierId },
    });
    if (deletedRowCount === 0) {
      return res.status(404).send(errorResponse({ message: "Invalid ID to delete" }));
    }
    return res.status(200).send({ message: "Custom Courier Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
