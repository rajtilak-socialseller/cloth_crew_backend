module.exports = async ({ sequelize, UserId, field_name, transaction }) => {
  try {
    const UserMetrics = sequelize.models.User_metric.findOne({
      where: { UserId: UserId },
    });

    if (UserMetrics) {
      await UserMetrics.update(
        {
          [field_name]: UserMetrics[field_name] + 1,
          last_login_date: new Date(),
        },
        { where: { UserId: UserId } },
        { transaction: transaction }
      );
    } else {
      await UserMetrics.create(
        {
          UserId: UserId,
          [field_name]: 1,
          registration_date: new Date(),
          last_login_date: new Date(),
        },
        { transaction: transaction }
      );
    }
  } catch (error) {
    //console.log("Error updating user_metrics:", error);
    throw error;
  }
};
