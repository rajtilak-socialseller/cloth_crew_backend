const jwt = require("../services/jwt");
const dbCache = require("../utils/dbCache");
const { errorResponse } = require("../services/errorResponse");
const { Op } = require("sequelize");

module.exports = async (req, res, next) => {
  try {
    const sequelize = await dbCache.get("main_instance");
    let endpoint = req.api;
    let params = req.params;
    endpoint = Object.entries(params).reduce(
      (str, [key, value]) => str.replace(new RegExp(value, "g"), `:${key}`),
      endpoint
    );

    // +++
    let user, role;
    if (req.headers.authorization) {
      const token = jwt.verify(req);
      if (token.error) return res.status(400).send({ error: token.error });
      user = await sequelize.models.User.findOne({
        where: { id: token.id },
        include: [{ model: sequelize.models.Role, as: "role" }],
      });

      if (!user || !user.role) {
        return res.status(403).send(
          errorResponse({
            status: 403,
            name: "ForbiddenError",
            message: "Forbidden",
            details: "You don't have permission to access this route",
          })
        );
      }

      role = user.role;
    } else {
      const getrole = await sequelize.models.Role.findOne({
        where: { name: "Public" },
      });
      role = getrole;

    }
    // +++

    if (user?.role?.name === "Staff") {
      // //console.log("Role Is Staff - RBAC")
      const Permission = await sequelize.models.Permission.findOne({
        where: [{ endpoint }, { method: req.method }],
      });


      if (!Permission) {
        return res.status(403).send(
          errorResponse({
            status: 403,
            name: "ForbiddenError",
            message: "Forbidden",
            details: "You don't have permission to access this route",
          })
        );
      }

      const User_permission = await sequelize.models.User_permission.findOne({
        where: {
          [Op.and]: [
            // { PermissionId: permission.id }
            , { UserId: user.id }, { PermissionId: Permission.id }]
        },
      });

      if (User_permission) {
        return next()
      } else {
        return res.status(403).send(
          errorResponse({
            status: 403,
            // name: "ForbiddenError",
            message: "Forbidden",
            details: "You don't have permission to access this route",
          })
        );
      }

    } else {
      //console.log("Role Is NOT Staff - RBAC")
      //console.log(endpoint, req.method)
      const Permission = await sequelize.models.Permission.findOne({
        where: [{ endpoint }, { method: req.method }],
      });


      // //console.log(Permission)

      if (!Permission) {
        return res.status(403).send(
          errorResponse({
            status: 403,
            // name: "ForbiddenError",
            message: "Forbidden",
            details: "You don't have permission to access this route",
          })
        );
      }

      const Role_permission = await sequelize.models.Role_permission.findOne({
        where: { [Op.and]: [{ PermissionId: Permission.id }, { RoleId: role.id }] },
      });

      if (Role_permission) {
        return await next()
      } else {
        return res.status(403).send(
          errorResponse({
            status: 403,
            // name: "ForbiddenError",
            message: "Forbidden",
            details: "You don't have permission to access this route",
          })
        );
      }
    }
  } catch (error) {
    //console.log(error.message);
    return res.status(500).send(error);
  }
};
