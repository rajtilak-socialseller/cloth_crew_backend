const { errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const body = req.body;

    const Ship_rocket_return = await sequelize.models.Ship_rocket_return.create(body);

    return res.status(200).send(Ship_rocket_return);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);

    const Ship_rocket_returns = await sequelize.models.Ship_rocket_return.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
    });

    const meta = await getMeta(pagination, Ship_rocket_returns.count);

    return res.status(200).send({ data: Ship_rocket_returns.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const Ship_rocket_return = await sequelize.models.Ship_rocket_return.findOne({
      where: { id },
    });

    if (Ship_rocket_return) {
      return res.status(200).send({ data: Ship_rocket_return });
    } else {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order Return ID",
        })
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const getShip_rocket_return = await sequelize.models.Ship_rocket_return.findByPk(id);

    if (!getShip_rocket_return) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order Return ID",
        })
      );
    }

    const Ship_rocket_return = await sequelize.models.Ship_rocket_return.update(req.body, {
      where: { id },
      returning: true,
    });

    return res.status(200).send({
      message: "Ship_rocket_return Updated",
      data: Ship_rocket_return[1][0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;

    const getShip_rocket_return = await sequelize.models.Ship_rocket_return.findByPk(id);

    if (getShip_rocket_return) {
      const Ship_rocket_return = await sequelize.models.Ship_rocket_return.destroy({
        where: { id },
      });

      return res.status(200).send({
        status: 201,
        message: "Ship_rocket_return Deleted Successfully",
      });
    } else {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order Return ID",
        })
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};
