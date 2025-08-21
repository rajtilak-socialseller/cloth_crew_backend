const { Sequelize } = require("sequelize");
const app = require("../../server");
const listAPis = require("../api/permission/services/apiLists");
const apiGenerator = require("../api/permission/services/generator");
/**
 * 
 * @param {*} sequelize 
 * @returns {Array} - returns the ids 
 */
module.exports = async (sequelize) => {
  // const permission_list = await listAPis(app);
  let permissionArray = await apiGenerator()


  const permission = await sequelize.models.Permission.bulkCreate(permissionArray, { updateOnDuplicate: ["api", "method", "endpoint", "handler"] })

  return permission.map((item => {
    return item.id
  }))
};

module.exports.staffPermission = async (sequelize, staffPermission = []) => {
  for (const item of staffPermission) {
    await sequelize.models.Staff_permission.findOrCreate({
      where: {
        api: item.api,
        method: item.method,
        endpoint: item.endpoint,
        handler: item.handler,
      },
    });
  }
};
