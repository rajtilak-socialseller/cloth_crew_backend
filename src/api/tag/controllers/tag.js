
const { Sequelize, UnknownConstraintError, Op } = require("sequelize");
const { errorResponse } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");
const blukTag = require("../../product/services/blukTag");


exports.create = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const createdTags = blukTag({ sequelize, tags: req.body.tags, ProductId: req.body.ProductId, transaction: t })
    await t.commit();
    return res.status(200).send({ data: createdTags });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.createMany = async (req, res) => {
  try {
    const sequelize = req.db;
    const tag = await sequelize.models.Tag.create(req.body);
    return res.status(200).send({ data: tag });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const tags = await sequelize.models.Tag.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
    });
    const meta = await getMeta(pagination, tags.count);
    return res.status(200).send({ data: tags.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const tag = await sequelize.models.Tag.findOne({ where: { id } });
    if (!tag) return res.status(400).send(errorResponse({ message: "Invalid Tag ID" }));
    return res.status(200).send({ data: tag });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};


exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const [gettag] = await sequelize.models.Tag.findByPk(id);

    if (!gettag) return res.status(400).send(errorResponse({ message: "Invalid Tag ID" }));
    const tag = await sequelize.models.Tag.update(req.body, {
      where: { id },
      returning: true,
    });
    return res.status(200).send({ message: "Tag Updated!", data: tag[1][0] });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const gettag = await sequelize.models.Tag.findByPk(id);

    if (!gettag) return res.status(400).send(errorResponse({ message: "Invalid ID" }));
    await sequelize.models.Tag.destroy({ where: { id } });
    return res.status(200).send({ message: `Tag with id ${id} deleted successfully!` });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.search = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const tags = await sequelize.models.Tag.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      where: { name: { [Op.iLike]: `%${qs}%` } },
    });
    const meta = await getMeta(pagination, tags.count);
    return res.status(200).send({ data: tags.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
