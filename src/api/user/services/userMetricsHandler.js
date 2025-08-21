module.exports = async ({ sequelize, userId, field_name, transaction }) => {
  try {
    const UserMetrics = sequelize.models.User_metrics.findOne({
      where: { UserId: userId },
    });

    if (UserMetrics) {
      await UserMetrics.update(
        {
          [field_name]: UserMetrics[field_name] + 1,
          last_login_date: new Date(),
        },
        {
          where: { UserId: userId },
        },
        { transaction: transaction }
      );
    } else {
      await UserMetrics.create(
        {
          UserId: userId,
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
