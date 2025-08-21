// Controller function to create a new role
const { getPagination, getMeta } = require("../../../services/pagination");

const { errorResponse } = require("../../../services/errorResponse");
const role = require("../../../constants/role");
const { Op } = require("sequelize");

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const { name, description, permissions } = req.body;
    const capName = () => name.replace(/^./, (match) => match.toUpperCase());
    let CaptName = capName();
    const role = await sequelize.models.Role.findOrCreate({
      where: { name: CaptName },
      defaults: { description },
    });

    if (permissions.length > 0) {
      for (const item of permissions) {
        const [found, created] = await sequelize.models.Role_permission.findOrCreate({
          where: { PermissionId: item, RoleId: role[0].id },
          defaults: { RoleId: role[0].id, PermissionId: item },
        });
      }
    }
    return res.status(200).send({ data: role[0] });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(error);
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
// Controller function to get all roles
exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const roles = await sequelize.models.Role.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: [["name", "asc"]],
    });

    const meta = await getMeta(pagination, roles.count);

    return res.status(200).send({ data: roles.rows, meta });
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

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.findOne = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const role = await sequelize.models.Role.findByPk(id, {
      include: ["permissions"],
    });


    if (role) {
      const { id, name, description, createdAt, updatedAt, permissions } = role
      const allPermissions = permissions
      allPermissions
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
      return res.status(200).send({ data: { id, name, description, createdAt, updatedAt, permissions: groupedArray } });
    } else {
      return res.status(404).send(
        errorResponse({
          status: 404,
          message: "Role not found!",
          details: "role id seems to be invalid",
        })
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
      })
    );
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const { name, description, permissions, delete_permissions } = req.body;
    const capName = () => name.replace(/^./, (match) => match.toUpperCase());
    const findRole = await sequelize.models.Role.findByPk(id);

    if (!findRole) {
      return res
        .status(400)
        .send(errorResponse({ message: "Invalid Role ID" }));
    }
    let roleData = role.find((r) => r.name === findRole.name);
    if (roleData) {
      return res.status(400).send(errorResponse({ message: "You can not update this role" }))
    }
    await findRole.update({ name: capName(), description }, { where: { id }, });

    if (permissions.length > 0) {
      for (const item of permissions) {
        const [found, created] = await sequelize.models.Role_permission.findOrCreate({
          where: { PermissionId: item, RoleId: id },
          defaults: { RoleId: id, PermissionId: item },
        });
      }
    }
    if (delete_permissions.length > 0) {
      await sequelize.models.Role_permission.destroy({
        where: {
          [Op.and]: [{ PermissionId: { [Op.in]: [...delete_permissions] } }, { RoleId: id }]
        }
      })
    }

    return res.status(200).send({ message: "Role Updated successfully!" });
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

exports.delete = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const findRole = await sequelize.models.Role.findByPk(id);
    if (!findRole) {
      return res
        .status(400)
        .send(errorResponse({ status: 400, message: "Invalid  ID" }));
    }
    let roleData = role.find((r) => r.name === findRole.name);
    if (roleData) {
      return res
        .status(400)
        .send(errorResponse({ message: "You can not delete this role" }));
    }
    await findRole.destroy({
      where: { id },
      transaction: t
    });
    await sequelize.models.Role_permission.destroy({
      where: { RoleId: id },
      transaction: t
    })
    await t.commit();
    return res.status(200).send({ message: `Role ${id} Deleted!!` });
  } catch (error) {
    await t.rollback();
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};
