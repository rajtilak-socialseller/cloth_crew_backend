require("dotenv").config();
const app = require("./server");
const express = require("express");
const databaseMiddleware = require("./src/middlewares/database");
const morgan = require("morgan");
const cors = require("cors");
const syntaxErrorhandler = require("./src/middlewares/syntaxErrorhandler");
const notFoundHandler = require("./src/middlewares/notFoundHandler");
const instance_starter = require("./src/utils/instance_starter")();
const path = require("path");
const initializSocket = require("./src/utils/socket");
const { createServer } = require("http");
const server = createServer(app);
initializSocket(server);
app.use(morgan("dev"));
app.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(syntaxErrorhandler);
app.use(databaseMiddleware);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "clothscrew app runnig",
  });
});

app.use("/public", express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cors({ origin: "*" }));
// adding routes
require("./src/utils/routes");
require("./src/api/product_booking/controllers/cronJobs");
app.use(notFoundHandler);
// Start the server
const PORT = process.env.PORT || 4500;
server.listen(PORT);
