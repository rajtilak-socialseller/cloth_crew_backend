const { DataTypes, } = require('sequelize');
// Create a Sequelize instance for the main database

module.exports = (sequelize) => {
  const Role = sequelize.define("Role", {
    name: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING
    }
  })
  return Role
}
