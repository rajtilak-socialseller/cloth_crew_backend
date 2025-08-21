module.exports = async (role, sequelize) => {
  const role_data = await sequelize.models.Role.findOne({
    where: { name: role },
    attributes: ["id"],
  });
  return role_data.id;
};
