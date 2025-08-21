const listEndpoints = require("express-list-endpoints");
module.exports = async (app) => {
  try {
    const endPoints = listEndpoints(app);
    const lists = [];

    endPoints.forEach((item) => {
      item.methods.forEach((method) => {
        lists.push({
          api: item.path.split("/")[2], // Extract the first word after '/api/'
          method: method, // Use each method separately
          endpoint: item.path, // Use the whole path as the endpoint
        });
      });
    });

    return lists;
  } catch (error) {
    console.log(error);
    return error;
  }
};
