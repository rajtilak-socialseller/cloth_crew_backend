function calculateDiscountedPrice(price, discountType, discountValue) {
    if (discountType === "FLAT") {
        return price - discountValue;
    } else if (discountType === "PERCENTAGE") {
        return price - (price * discountValue) / 100;
    }
}
/**
 * 
 * @param {import("sequelize").Sequelize} sequelize 
 * @param {*} variantsPrice 
 * @param {*} variants 
 */
module.exports = async (sequelize, variantsPrice, variants) => {
    let totalAmount = 0;
    for (const item of variants) {
        if (item.coupon_code) {
            const coupon = await sequelize.models.Coupon.findOne({ where: { coupon_code: item.coupon_code } })
            if (coupon) {
                // //console.log(coupon)
                const discountedPrice = calculateDiscountedPrice(
                    variantsPrice[item.VariantId],
                    coupon.discount_type,
                    coupon.discount_value
                );
                variantsPrice[item.VariantId] = discountedPrice;
                totalAmount = totalAmount + discountedPrice;
            }
        }
        else {
            variantsPrice[item.VariantId] = variantsPrice[item.VariantId];
            totalAmount = totalAmount + variantsPrice[item.VariantId];
        }
    }

    return { totalAmount, variantsPrice };
};
