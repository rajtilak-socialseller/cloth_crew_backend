
const { DataTypes } = require('sequelize');
/**
 * 
 * @param {import("sequelize").Sequelize} sequelize 
 * @returns 
 */
module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Banner = sequelize.define("Banner", {
    action: {
      type: DataTypes.ENUM(["COLLECTION", "LINK", "PRODUCT"]),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM("HEADER", "SEPARATOR"),
      defaultValue: "HEADER"
    },
    data: {
      type: DataTypes.STRING
    }
  });
  return Banner;
};
