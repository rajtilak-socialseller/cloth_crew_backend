const { createActivityLog } = require("../../../services/createActivityLog");
const { getPagination, getMeta } = require("../../../services/pagination");
const { errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");

exports.create = async (req, res) => {
  const t = await req.db.transaction();

  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const tutorial = await sequelize.models.Tutorial.create(req.body);
    const tutorialActivityLog = await createActivityLog({
      sequelize,
      StoreUserId: token.id,
      event: "NEW_TUTORIAL_ADDED",
      transaction: t,
    });
    await t.commit();

    return res.status(200).send({ message: "Tutorial Created Successfully!", data: tutorial });
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

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const [updatedRowsCount, [updatedTutorial]] = await sequelize.models.Tutorial.update(req.body, {
      where: { id: id },
      returning: true,
    });
    if (updatedRowsCount === 0) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }
    return res.status(200).send({
      message: "Tutorial Updated Successfully!",
      data: updatedTutorial,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const Tutorial = sequelize.models.Tutorial;
    const query = req.query;

    const pagination = await getPagination(query.pagination);

    const tutorials = await Tutorial.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      include: ['thumbnail']
    });

    const meta = await getMeta(pagination, tutorials.count);

    return res.status(200).send({ data: tutorials.rows, meta });
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
    const id = req.params.id;
    const tutorial = await sequelize.models.Tutorial.findOne({
      where: { id: id },
    });
    if (!tutorial) {
      return res.status(404).send(errorResponse({ status: 404, message: "File not found!", details: "id seems to be invalid" }));
    }
    return res.status(200).send({ data: tutorial });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const deletedRowCount = await sequelize.models.Tutorial.destroy({
      where: { id: id },
    });
    if (deletedRowCount === 0) {
      return res.status(400).send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }
    return res.status(200).send({ message: "Tutorial Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    }));
  }
};
