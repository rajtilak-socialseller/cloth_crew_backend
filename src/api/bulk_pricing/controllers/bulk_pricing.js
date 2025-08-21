const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const bulkPricing = await sequelize.models.Bulk_pricing.create(req.body);
    return res.status(200).send({
      message: "Bulk Pricing Created Successfully!",
      data: bulkPricing,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to create bulk pricing" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const [rowsCount, [updatedPricing]] = await sequelize.models.Bulk_pricing.update(req.body, {
      where: { id: id },
      returning: true,
    });
    if (rowsCount === 0) {
      return res.status(404).send(errorResponse({ message: "Bulk Pricing not found", details: "ID seems to be invalid" }));
    }
    return res.status(200).send({
      message: "Bulk Pricing Updated Successfully!",
      data: updatedPricing,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to update the bulk pricing" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const pricing = await sequelize.models.Bulk_pricing.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
    });
    const meta = await getMeta(pagination, pricing.count);
    return res.status(200).send({ data: pricing.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to fetch bulk pricing" }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const pricing = await sequelize.models.Bulk_pricing.findByPk(id);
    if (!pricing) {
      return res.status(404).send(errorResponse({ status: 500, message: "Bulk Pricing not found" }));
    }
    return res.status(200).send({ data: pricing });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to fetch the bulk pricing" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const deletedRowCount = await sequelize.models.Bulk_pricing.destroy({
      where: { id: id },
    });
    if (deletedRowCount === 0) {
      return res.status(404).send(errorResponse({ message: "Bulk Pricing not found" }));
    }
    return res.status(200).send({ message: "Bulk Pricing Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to delete the bulk pricing" }));
  }
};
