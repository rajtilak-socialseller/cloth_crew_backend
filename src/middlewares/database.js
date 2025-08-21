const createDbConnection = require("../utils/dbConnection");

module.exports = async (req, res, next) => {

  const sequelize = await createDbConnection();
  req.db = sequelize;
  let api = req.url.split("?")[0];
  req.api = api;
  next();
};
