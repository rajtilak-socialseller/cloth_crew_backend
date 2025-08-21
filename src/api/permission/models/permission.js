// relations for shared db 
const { DataTypes, Sequelize } = require('sequelize');
/**
 * 
 * @param {import("sequelize").Sequelize} sequelize 
 * @returns 
 */
module.exports = (sequelize) => {
  const Permission = sequelize.define("Permission", {
    api: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true
    },
    method: {
      type: DataTypes.ENUM("GET", "POST", "PUT", "DELETE", "PATCH"),
    },
    handler: { type: DataTypes.STRING, }
  }, {
    indexes: [{
      unique: true,
      fields: ["api", "method", "endpoint", "handler"]
    }],
  });
  return Permission
}
