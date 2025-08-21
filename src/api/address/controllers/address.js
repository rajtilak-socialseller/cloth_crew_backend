const { errorResponse, tokenError } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
const { getPagination, getMeta } = require("../../../services/pagination");

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    //console.log(token);
    const address = await sequelize.models.Address.create({
      ...req.body,
      StoreUserId: token.id
    });
    return res.status(200).send({ message: "Address Created Successfully!", data: address });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some internal server error occured!",
      })
    );
  }
};
const { request } = require("express")
exports.find = async (req = request, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const whereCluase = {};
    if (req.headers.authorization) {
      const token = jwt.verify(req)
      if (token.error) {
        return res.status(402).send(tokenError(token))
      }
      whereCluase.StoreUserId = token.id
    }
    const pagination = await getPagination(query.pagination);
    const addresses = await sequelize.models.Address.findAndCountAll({
      limit: pagination.limit,
      offset: pagination.offset,
      where: whereCluase,
    });
    const meta = await getMeta(pagination, addresses.count);
    return res.status(200).send({ data: addresses.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some internal server error ocured!",
      })
    );
  }
};

exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const address = await sequelize.models.Address.findOne({
      where: { id: id },
    });
    if (!address) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Address Not Found!",
          details: "address id seems to be invalid",
        })
      );
    }
    return res.status(200).send({ data: address });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some internal server error ocured!",
      })
    );
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const updateAddress = await sequelize.models.Address.update(req.body, {
      where: { id: id },
      returning: true,
    });

    return res.status(200).send({
      message: "Address Updated Successfully!",
      data: updateAddress[1][0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some internal server error ocured!",
      })
    );
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const deletedRowCount = await sequelize.models.Address.destroy({
      where: { id: id },
    });
    if (deletedRowCount === 0) {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Address Not Found!",
          details: "address id seems to be invalid",
        })
      );
    }
    return res.status(200).send({ message: "Address Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Some internal server error ocured!",
      })
    );
  }
};

exports.userAddress = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const address = await sequelize.models.Address.findAll({
      where: { StoreUserId: token.id },
    });
    return res.status(200).send({ data: address });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal Server Error" }));
  }
};

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */

exports.search = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs.trim();
    const pagination = await getPagination(query.pagination);

    const address = await sequelize.models.Address.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: orderBy(query),
      where: {
        [Op.or]: [{ name: { [Op.iLike]: `%${qs}%` } }, { phone: { [Op.iLike]: `%${qs}%` } }],
      },
    });

    const meta = await getMeta(pagination, address.count);
    return res.status(200).send({ data: address.rows, meta });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
