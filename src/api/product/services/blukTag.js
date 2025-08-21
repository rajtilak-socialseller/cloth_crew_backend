module.exports = async ({ sequelize, tags, ProductId, transaction }) => {
  //console.log(tags)
  //console.log(tags.map((item) => item))
  const createdTags = await Promise.all(
    tags.map((tag) => {
      return sequelize.models.Tag.findOrCreate({
        where: { name: tag.toLowerCase() },
        transaction: transaction,
      });
    })
  );
  const tagsToCreate = [];
  const resultIds = createdTags.map((item) => {
    tagsToCreate.push({ TagId: item[0].id, ProductId });
  });

  const ProductTag = await sequelize.models.ProductTag.bulkCreate(
    tagsToCreate,
    { transaction: transaction }
  );
  return ProductTag;
};
