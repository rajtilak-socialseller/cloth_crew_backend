const jwt = require("../services/jwt");
const dbCache = require("../utils/dbCache");
const { errorResponse, tokenError } = require("../services/errorResponse");
const { Op } = require("sequelize");

module.exports = async (req, res, next) => {
  try {
    const sequelize = req.db;
    let endpoint = req.api;
    let params = req.params;
    endpoint = Object.entries(params).reduce((str, [key, value]) => str.replace(new RegExp(value, "g"), `:${key}`), endpoint);

    const Permission = await sequelize.models.Permission.findOne({
      where: [{ endpoint }, { method: req.method }],
    });
    if (!Permission) {
      return res.status(403).send(
        errorResponse({
          status: 403,
          name: "ForbiddenError",
          message: "Forbidden",
          details: "No permission to access this route",
        })
      );
    }

    const parts = req.hostname.split(".");
    let subdomain = parts[0];
    let role;

    if (req.headers.authorization) {
      const token = jwt.verify(req);
      if (token.error) {
        return res.status(401).send(tokenError(token));
      }

      const user = await sequelize.models.Store_user.findByPk(token.id);
      // //console.log(user);
      if (!user || user.RoleId === null) {
        return res.status(400).send(
          errorResponse({
            message: "Invalid Data!",
            details: "Invalid payload data found in the token!",
          })
        );
      }

      role = user.RoleId;
    } else {
      const getrole = await sequelize.models.Role.findOne({
        where: { name: "Public" },
      });
      role = getrole?.id;
      return res.status(403).send(
        errorResponse({
          status: 403,
          name: "ForbiddenError",
          message: "Forbidden",
          details: "You don't have permission to access this route",
        })
      );
    }

    const Role_permission = await sequelize.models.Role_permission.findOne({
      where: { [Op.and]: [{ PermissionId: Permission.id }, { RoleId: role }] },
    });

    if (Role_permission) {
      return await next();
    } else {
      return res.status(403).send(
        errorResponse({
          status: 403,
          name: "ForbiddenError",
          message: "Forbidden",
          details: "You don't have permission to access this route",
        })
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
