
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Define the Post model using the provided Sequelize instance
    const ProductTag = sequelize.define("ProductTag", {

    });

    return ProductTag;
};
