const { requestError, errorResponse, tokenError } = require("../../../services/errorResponse");
const jwt = require("../../../services/jwt");
// const cart = require("../models/cart");
const { handleVariantsTotalPrice } = require("../services/cart");

exports.addToCart = async (req, res) => {
  try {
    const sequelize = req.db;
    const { VariantId, quantity } = req.body;

    const token = jwt.verify(req);
    if (token.error) return res.status(401).send(tokenError(token))
    let findCart = await sequelize.models.Cart.findOne({ where: { StoreUserId: token.id } });
    if (findCart === null) {
      findCart = await sequelize.models.Cart.create({ totalPrice: 0, StoreUserId: token.id });
    }

    const CartVariant = await sequelize.models.CartVariant.findOne({
      where: {
        VariantId: VariantId,
        CartId: findCart.id,
      },
    });

    if (CartVariant) {
      CartVariant.increment({ quantity: quantity });
      await CartVariant.save();
    } else {
      await sequelize.models.CartVariant.create({
        VariantId: VariantId,
        CartId: findCart.id,
        quantity: quantity,
      });
    }

    const variant = await sequelize.models.Variant.findByPk(VariantId);
    findCart.increment({ totalPrice: variant.price * quantity });
    await findCart.save();
    return res.status(200).send({ message: "Variants added to cart successfully." });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

exports.consumerCart = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    if (token.error) return res.status(401).send(tokenError(token))
    const userCart = await sequelize.models.Cart.findOne({
      where: { StoreUserId: token.id },
      include: { model: sequelize.models.Variant, include: ["thumbnail"] }
    })

    console.log(userCart)

    if (!userCart) {
      return res.status(404).send({
        message: `No cart variants found for user with id=${token.id}`,
      });
    }
``
    // // Calculate total price
    // let totalPrice = 0;
    // // for (const variant of userCart) {
    // //   totalPrice += variant.CartVariant.quantity * variant.price;
    // // }

    return res.status(200).send({
      data: userCart
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: "Internal Server Error",
    });
  }
};

exports.emptyCart = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);

    // const store_user = await sequelize.models.Store_user.findByPk(token.id, { include: "cart" });
    const findCart = await sequelize.models.Cart.findOne({ where: { StoreUserId: token.id } });

    if (findCart === null) {
      const cart = await sequelize.models.Cart.create({
        totalPrice: 0,
        StoreUserId: token.id,
      });
      return res.status(200).send({ message: "Your cart is empty now!" });
    }

    const destroyCart = await sequelize.models.CartVariant.destroy({
      where: { CartId: findCart.id },
    });

    await findCart.update({ totalPrice: 0 });
    return res.status(200).send({ message: "Your cart is empty now!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(errorResponse({ status: 500, message: "Internal Server Error" }));
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const sequelize = req.db;
    const { id } = req.params;
    const token = jwt.verify(req);
    const cart = await sequelize.models.Cart.findOne({ where: { StoreUserId: token.id } });

    if (!cart) {
      return res.status(404).send(errorResponse({ status: 400, message: "Invalid variant id" }));
    }

    const cartVariant = await sequelize.models.CartVariant.findOne({
      where: {
        VariantId: id,
        CartId: cart.id,
      },
      include: [sequelize.models.Variant],
    });

    if (!cartVariant) {
      return res.status(404).send({
        message: `Variant with id ${id} not found in the cart.`,
      });
    }

    const totalPriceReduction = cartVariant.Variant.price * cartVariant.quantity;

    await cartVariant.destroy();

    cart.totalPrice -= totalPriceReduction ?? 0;
    await cart.save();

    return res.status(200).send({
      message: `Variant with id ${id} deleted from the cart successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
