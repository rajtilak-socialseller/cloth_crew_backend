const dbConnection = require("../utils/dbConnection");

module.exports = async ({ subdomain, field_name }) => {
  const sequelize = await dbConnection(null);
  try {
    const Tenant = await sequelize.models.User.findOne({
      where: { subdomain },
      include: ['tenant_metric'],
    });

    if (Tenant.tenant_metric !== null) {
      await sequelize.models.Tenant_metric.increment({ [field_name]: 1 }, { where: { UserId: Tenant.id } })
    } else {
      await sequelize.models.Tenant_metric.create({
        [field_name]: 1,
        UserId: Tenant.id
      })
    }

  } catch (error) {
    console.log(error);
  }
};