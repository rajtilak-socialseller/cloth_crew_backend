const { DataTypes } = require("sequelize");
const user = require("../../user/models/user");
/**
 * 
 * @param {import("sequelize").Sequelize} sequelize 
 * @returns 
 */
module.exports = (sequelize) => {
  const Tenant_metric = sequelize.define("Tenant_metric", {
    total_spendings: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
    total_products: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_users: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_orders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_leads: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_transaction: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_disk_usage: {
      type: DataTypes.DECIMAL,
      defaultValue: 0,
    },
    total_site_visits: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    UserId: {
      type: DataTypes.INTEGER,
      references: {
        model: sequelize.models.User,
        key: "id"
      }
    }
  }, {
    indexes: [{
      fields: ["UserId"],
      unique: true
    }]
  });

  return Tenant_metric;
};
