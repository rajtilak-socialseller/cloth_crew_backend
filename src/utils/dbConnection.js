const { Sequelize } = require("sequelize");
const { getConfigs } = require("./getConnectionConfig"); // Import the function you created earlier
const dbCache = require("./dbCache");
const relation = require("./relation");
const mainDbRelation = require("./mainDbRelation");
const dbConfig = require("../../config/db.config");
const apiGenerator = require("./apiGenerator");

module.exports = async () => {
  if (dbCache.get("common_commerce") !== undefined) {
    const sequelize = dbCache.get("common_commerce");
    return sequelize;
  } else {
    const db = {};
    const sequelize = new Sequelize(dbConfig);
    db.sequelize = await relation(sequelize);
    dbCache.set("common_commerce", db.sequelize);
    // await db.sequelize.sync({ alter: true });
    apiGenerator(db.sequelize); // only for development
    return db.sequelize;
  }
};
