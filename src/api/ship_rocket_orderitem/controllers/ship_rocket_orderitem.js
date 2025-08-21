const { errorResponse } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const body = req.body;

    const Ship_rocket_orderitem = await sequelize.models.Ship_rocket_orderitem.create(body);

    return res.status(200).send(Ship_rocket_orderitem);
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

    const Ship_rocket_orderitems = await sequelize.models.Ship_rocket_orderitem.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
    });

    const meta = await getMeta(pagination, Ship_rocket_orderitems.count);

    return res.status(200).send({ data: Ship_rocket_orderitems.rows, meta });
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

    const Ship_rocket_orderitem = await sequelize.models.Ship_rocket_orderitem.findOne({
      where: { id },
    });

    if (Ship_rocket_orderitem) {
      return res.status(200).send({ data: Ship_rocket_orderitem });
    } else {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order Item ID",
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

    const getShip_rocket_orderitem = await sequelize.models.Ship_rocket_orderitem.findByPk(id);

    if (!getShip_rocket_orderitem) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order Item ID",
        })
      );
    }

    const Ship_rocket_orderitem = await sequelize.models.Ship_rocket_orderitem.update(req.body, {
      where: { id },
      returning: true,
    });

    return res.status(200).send({
      message: "Ship_rocket_orderitem Updated",
      data: Ship_rocket_orderitem[1][0],
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

    const getShip_rocket_orderitem = await sequelize.models.Ship_rocket_orderitem.findByPk(id);

    if (getShip_rocket_orderitem) {
      const Ship_rocket_orderitem = await sequelize.models.Ship_rocket_orderitem.destroy({
        where: { id },
      });

      return res.status(200).send({
        status: 201,
        message: "Ship_rocket_orderitem Deleted Successfully",
      });
    } else {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Invalid Ship Rocket Order Item ID",
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
