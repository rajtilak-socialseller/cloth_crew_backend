// Controller function to create a new post

const { Op } = require("sequelize");
const app = require("../../../../server");
const { getPagination, getMeta } = require("../../../services/pagination");
const apiGenerator = require("../../../utils/apiGenerator");
const generator = require("../services/generator");
const permissions = require("../../../constants/permissions");


/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
// const errorResponse = require("."); // Replace with the actual path

exports.generateLists = async (req, res) => {
  try {
    const sequelize = req.db;

    const permissions = await sequelize.models.Permission.findAll({ raw: true })
    for (const item of permissions) {
      await sequelize.models.Role_permission.create({ RoleId: 1, PermissionId: item.id })
    }



    return res.status(200).send({ message: "Permission Generated Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const { RoleId, PermissionId } = req.body;
    const lists = [];

    for (const permission of PermissionId) {
      const [found, created] = await sequelize.models.Role_permission.findOrCreate({
        where: { PermissionId: permission, RoleId },
        defaults: { RoleId, PermissionId: permission },
      });
      lists.push([found, created]);
    }

    return res.status(200).send(lists);

    // const permission = await sequelize.models.Role_permission.create(req.body);
    // return res.status(200).send({ data: permission, message: "Permission Created Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
// Controller function to get all posts
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;

    const allPermissions = await sequelize.models.Permission.findAll({
      include: ["roles"],
      where: {
        api: {
          [Op.in]: (req.subdomain === null ? permissions.Super_Admin : permissions.Admin)
        }
      }

    });

    const groupedData = allPermissions.reduce((grouped, item) => {
      const api = item.api;
      if (!grouped[api]) {
        grouped[api] = [];
      }

      grouped[api].push(item);
      return grouped;
    }, {});

    const groupedArray = Object.entries(groupedData).map(([api, items]) => ({
      api,
      items,
    }));
    groupedArray.sort((a, b) => a.api.localeCompare(b.api));

    return res.status(200).send({ data: groupedArray });
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
exports.staffPermission = async (req, res) => {
  try {

    const sequelize = req.db;

    const allPermissions = await sequelize.models.Permission.findAll({
      where: { api: { [Op.in]: permissions.Staff } },
      include: ["roles"],
    });
    const groupedData = allPermissions.reduce((grouped, item) => {
      const api = item.api;
      if (!grouped[api.Staff]) {
        grouped[api] = [];
      }
      grouped[api].push(item);
      return grouped;
    }, {});

    const groupedArray = Object.entries(groupedData).map(([api, items]) => ({
      api,
      items,
    }));

    groupedArray.sort((a, b) => a.api.localeCompare(b.api));
    return res.status(200).send({ data: groupedArray });
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
    const permission = await sequelize.models.Permission.findByPk(id, {
      include: "roles",
    });

    if (permission) {
      return res.status(200).send({ data: permission });
    } else {
      return res.status(404).send(errorResponse({ error: "Permission not found" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const [updatedRowsCount] = await sequelize.models.Permission.update(req.body, { where: { id } });

    if (updatedRowsCount > 0) {
      return res.status(200).send({ message: "Permission updated successfully!" });
    } else {
      return res.status(404).send(errorResponse({ error: "Permission not found" }));
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const deletedRowCount = await sequelize.models.Permission.destroy({
      where: { id },
    });

    if (deletedRowCount > 0) {
      return res.status(200).send({ message: "Permission deleted successfully!" });
    } else {
      return res.status(404).send(errorResponse({ error: "Permission not found" }));
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
