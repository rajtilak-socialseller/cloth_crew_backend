const createActivityLog = require("../../../services/createActivityLog");
const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse } = require("../../../services/errorResponse");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const { name, url } = req.body;

    const group = await sequelize.models.Group.create({ name, url });

    const groupActivityLog = await createActivityLog.createActivityLog(req, res, "NEW_GROUP_ADDED", "New group created successfully!");

    return res.status(201).send({
      message: "Group created successfully!",
      data: group,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server error",
      details: "Failed to create a group",
    });
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);

    const groups = await sequelize.models.Group.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
    });

    const meta = await getMeta(pagination, groups.count);

    return res.status(200).send({ data: groups.rows, meta });
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

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const group = await sequelize.models.Group.findByPk(id);

    if (!group) {
      return errorResponse(res, {
        status: 404,
        message: "Group not found",
        details: "The specified group does not exist",
      });
    }

    return res.status(200).send({ data: group });
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server error",
      details: "Failed to fetch group",
    });
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const group = await sequelize.models.Group.findByPk(id);

    if (!group) {
      return errorResponse(res, {
        status: 404,
        message: "Group not found",
        details: "The specified group does not exist",
      });
    }

    await group.update(req.body);

    return res.status(200).send({
      message: "Group updated successfully!",
      data: group,
    });
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server error",
      details: "Failed to update group",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const group = await sequelize.models.Group.findByPk(id);

    if (!group) {
      return errorResponse(res, {
        status: 404,
        message: "Group not found",
        details: "The specified group does not exist",
      });
    }

    await group.destroy();

    return res.status(200).send({ message: "Group deleted successfully!" });
  } catch (error) {
    console.log(error);
    return errorResponse(res, {
      status: 500,
      message: "Internal server error",
      details: "Failed to delete group",
    });
  }
};
