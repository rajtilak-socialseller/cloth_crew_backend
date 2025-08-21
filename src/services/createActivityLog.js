const { event_description } = require("../constants/activity_log");

module.exports = {
  async createActivityLog({ sequelize, StoreUserId, event, transaction }) {
    try {
      //console.log("entering createActivityLog");
      //console.log(StoreUserId, event);
      const activity_log = await sequelize.models.Activity_log.create(
        {
          event,
          StoreUserId,
          description: event_description[event],
        },
        { transaction: transaction }
      );
    } catch (error) {
      console.log(error);
      return { error };
    }
  },
  async adminActivityLog({ sequelize, UserId, event, transaction }) {
    try {
      //console.log("entering createActivityLog");
      //console.log(UserId, event);
      // const activity_log = await sequelize.models.Activity_log.create(
      //   {
      //     event,
      //     UserId,
      //     description: event_description[event],
      //   },
      //   { transaction: transaction }
      // );
      return true;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }
}
