const { Sequelize } = require("sequelize");

module.exports = {
  dialect: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "root",
  database: "cc_db",
  // password: "root",
  // database: "testing",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 100000,
  },
  logging: false,
};
