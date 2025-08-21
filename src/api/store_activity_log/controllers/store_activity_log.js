const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse } = require("../../../services/errorResponse");
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const activity_log = await sequelize.models.Activity_log.create(req.body);
    return res.status(200).send({
      message: "Activity Log Created Successfully!",
      data: activity_log,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Some error occured while creating activity log" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination)
    const logs = await sequelize.models.Activity_log.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: [["id", "desc"]]
    });
    const meta = await getMeta(pagination, logs.count)
    return res.status(200).send({ data: logs.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const log = await sequelize.models.Activity_log.findOne({
      where: { id: id },
    });
    if (!log) {
      return res.status(404).send(errorResponse({ message: "Invalid Activity Log ID" }));
    }
    return res.status(200).send({ data: log });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to fetch the activity log" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const [updatedRowsCount, updatedLog] =
      await sequelize.models.Activity_log.update(req.body, {
        where: { id: id },
        returning: true,
      });
    if (updatedRowsCount === 0) {
      return res.status(404).send(errorResponse({ status: 400, message: "Invalid Activity Log Id", details: "Invalid id to fetch activity log" }));
    }
    return res.status(200).send({
      message: "Activity Log Updated Successfully!",
      data: updatedLog[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "some internal server error occured" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const deletedRowCount = await sequelize.models.Activity_log.destroy({
      where: { id: id },
    });
    if (deletedRowCount === 0) {
      return res.status(404).send(errorResponse({ message: "Invalid Id To delete", details: "activity log id is invalid" }));
    }
    return res.status(200).send({ message: "Activity Log Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Failed to delete the activity log" }));
  }
};
