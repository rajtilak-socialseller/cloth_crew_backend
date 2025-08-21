exports.handleVariantsTotalPrice = async (cartVariants, sequelize) => {
  const result = await Promise.all(
    cartVariants.map(async (cartVariant) => {
      const variant = await sequelize.models.Variant.findByPk(
        cartVariant.VariantId
      );
      return {
        quantity: cartVariant.quantity,
        variant,
        totalPrice: variant.price * cartVariant.quantity,
      };
    })
  );
  return result;
};
