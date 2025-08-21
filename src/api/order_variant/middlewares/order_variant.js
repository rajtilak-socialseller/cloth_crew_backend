module.exports = {
  async validateRequest(req, res, next) {
    try {
      // //console.log("entered in validate request");
      const sequelize = req.db;
      const { VariantId, quantity } = req.body;

      const variant = await sequelize.models.Variant.findByPk(VariantId);

      // //console.log(variant.quantity);

      if (!variant || variant.quantity < quantity) {
        return res.status(400).send({
          message: "Variant quantity is insufficient.",
        });
      }

      if (quantity <= 0) {
        return res.status(400).send({
          message: "Requested quantity must be greater than 0.",
        });
      }

      next();
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Internal Server Error",
      });
    }
  },
};
