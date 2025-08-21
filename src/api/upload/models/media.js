const { DataTypes } = require("sequelize");
// const Format = require('./format')

module.exports = (sequelize) => {
  // Define the Post model using the provided Sequelize instance
  const Media = sequelize.define("Media", {
    name: {
      type: DataTypes.STRING,
      require: true,
    },
    path: {
      type: DataTypes.STRING,
    },
    url: {
      type: DataTypes.STRING,
      require: true,
    },
    width: {
      type: DataTypes.INTEGER,
      require: true,
    },
    height: {
      type: DataTypes.INTEGER,
      require: true,
    },
    size: {
      type: DataTypes.DECIMAL,
      require: true,
    },
    formats: {
      type: DataTypes.JSONB,
    },
  });

  return Media;
};
