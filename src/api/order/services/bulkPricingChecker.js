module.exports = async function checkBulkPricing({
  user,
  variants,
  variants_details,
  // body,
  user_recent_sub,
}) {
  //check which product variant has bulkPricing
  //if have ==> the calculate amount with that bulk_pricing
  //else calculate pricing as you were doing before
  //   

  //check if user's plan supports the payment_mode
  var totalAmount = 0;
  var variantsPrice = {};
  for (const [i, it] of variants_details.entries()) {
    //check plan

    //check bulk_pricing exists / not
    let maxBulkPricingQty = it.bulk_pricings.reduce((maxTo, currentObj) => {
      return Math.max(maxTo, currentObj.to);
    }, -Infinity);
    let minBulkPricingQty = it.bulk_pricings.reduce((maxTo, currentObj) => {
      return Math.min(maxTo, currentObj.from);
    }, +Infinity);

    if (it.bulk_pricings.length > 0) {

      //check if user is preimum and plan's premiumPricing is true
      if (user.isPremium === true && user_recent_sub.plan.premium_pricing === true) {


        for (const bp of it.bulk_pricings) {
          if (variants[i].quantity >= bp.from && variants[i].quantity < bp.to) {

            totalAmount += parseFloat(variants[i].quantity) * (parseFloat(bp.premiumPrice) || parseFloat(bp.price));
            variantsPrice[it.id] = parseFloat(variants[i].quantity) * parseFloat(it.price);
          }


          if (variants[i].quantity > maxBulkPricingQty) {
            let maxToObj = it.bulk_pricings[0];

            for (let i = 0; i < it.bulk_pricings.length; i++) {
              if (it.bulk_pricings[i].to > maxToObj.to) {
                maxToObj = it.bulk_pricings[i];
              }
            }
            totalAmount += parseFloat(variants[i].quantity) * (parseFloat(maxToObj.premiumPrice) || parseFloat(maxToObj.price));
            variantsPrice[it.id] = parseInt(variants[i].quantity) * parseFloat(maxToObj.price);
          } else if (variants[i].quantity < minBulkPricingQty) {
            totalAmount += parseFloat(variants[i].quantity) * (parseFloat(maxToObj.premiumPrice) || parseFloat(maxToObj.price));
            variantsPrice[it.id] = parseInt(variants[i].quantity) * parseFloat(it.price);
          }
        }
      } else {
        for (const bp of it.bulk_pricings) {
          if (variants[i].quantity >= bp.from && variants[i].quantity < bp.to) {

            totalAmount += parseFloat(variants[i].quantity) * parseFloat(bp.price);
            variantsPrice[it.id] = parseFloat(variants[i].quantity) * parseFloat(it.price);
          }
          if (variants[i].quantity > maxBulkPricingQty) {
            let maxToObj = it.bulk_pricings[0];
            for (let i = 0; i < it.bulk_pricings.length; i++) {
              if (it.bulk_pricings[i].to > maxToObj.to) {
                maxToObj = it.bulk_pricings[i];
              }
            }
            totalAmount += parseFloat(variants[i].quantity) * parseFloat(maxToObj.price);
            variantsPrice[it.id] = parseInt(variants[i].quantity) * parseFloat(maxToObj.price);
          } else if (variants[i].quantity < minBulkPricingQty) {
            totalAmount += parseFloat(variants[i].quantity) * parseFloat(it.price);
            variantsPrice[it.id] = parseInt(variants[i].quantity) * parseFloat(it.price);
          }
        }
        // return { totalAmount, variantsPrice };
      }
    } else {

      if (user.isPremium === true && user_recent_sub.plan.premium_pricing === true) {
        //console.log("is premium")
        //console.log(it.premium_price)
        totalAmount += parseFloat(variants[i].quantity) * (parseFloat(it.premium_price) || parseFloat(it.price));
        variantsPrice[it.id] = parseInt(variants[i].quantity) * parseFloat(it.premium_price) || parseFloat(it.price);
      } else {
        totalAmount += parseFloat(variants[i].quantity) * parseFloat(it.price);
        variantsPrice[it.id] = parseInt(variants[i].quantity) * parseFloat(it.price);
      }
    }
  }
  return { totalAmount, variantsPrice };
};
