const dbCache = require("./dbCache");
const product = require("../api/product/models/product");
const variant = require("../api/variant/models/variant");
const media = require("../api/upload/models/media");
const category = require("../api/category/models/category");
const tag = require("../api/tag/models/tag");
const productTag = require("../api/tag/models/productTag");
const banner = require("../api/banner/models/banner");
const lead = require("../api/store_lead/models/store_lead");
const privacy_policy = require("../api/privacy_policy/models/privacy_policy");
const cart = require("../api/cart/models/cart");
const cart_variant = require("../api/cart/models/cartVariant");
const campaign = require("../api/campaign/models/campaign");
const tutorial = require("../api/tutorial/models/tutorial");
const bulkPricing = require("../api/bulk_pricing/models/bulk_pricing");
const collection = require("../api/collection/models/collection");
const collection_static = require("../api/collection_static/models/collection_static");
const product_metrics = require("../api/product_metrics/models/product_metrics");
const sub_category = require("../api/sub_category/models/sub_category");
const store_policy = require("../api/store_policy/models/store_policy");
const store_setting = require("../api/store_setting/models/store_setting");
const group = require("../api/group/models/group");
const store_user = require("../api/store_user/models/store_user");
const address = require("../api/address/models/address");
const order = require("../api/order/models/order");
const order_variant = require("../api/order_variant/models/order_variant");
const payment_log = require("../api/payment_log/models/payment_log");
const custom_courier = require("../api/custom_courier/models/custom_courier");
const wallet = require("../api/wallet/models/wallet");
const role = require("../api/role/models/role");
const permission = require("../api/permission/models/permission");
const role_permission = require("../api/permission/models/role_permission");
const activity_log = require("../api/store_activity_log/models/store_activity_log");
const transaction = require("../api/store_transaction/models/store_transaction");
const store_plan = require("../api/store_plan/models/store_plan");
const store_subscription = require("../api/store_subscription/models/store_subscription");
const store_global = require("../api/store_global/models/store_global");
const store_payment_log = require("../api/store_payment_log/models/store_payment_log");
const store_support_ticket = require("../api/store_support_ticket/models/store_support_ticket");
const store_server_subscription = require("../api/server_subscription/models/store_server_subscription");
const ship_rocket_order = require("../api/ship_rocket_order/models/ship_rocket_order");
const ship_rocket_orderitem = require("../api/ship_rocket_orderitem/models/ship_rocket_orderitem");
const ship_rocket_return = require("../api/ship_rocket_return/models/ship_rocket_return");
const order_status_tracker = require("../api/order_status_tracker/models/order_status_tracker");
const notification = require("../api/notification/models/notification");
const payout_log = require("../api/payout_log/models/payout_log");
const store_global_brand = require("../api/store_global_brand/models/global_brand");
const product_policy = require("../api/product_policy/models/product_policy");
const promitional_message = require("../api/promotional_message/models/promotional_message");
const testimonial = require("../api/testimonial/models/testimonial");
const story = require("../api/story/models/story");
const return_order = require("../api/return_order/models/return_order");
const product_review = require("../api/product_review/models/product_review");
const marquee = require("../api/marquee/models/marquee");
const free_plan = require("../api/free_plan/models/free_plan");
const coupon = require("../api/coupon/models/coupon");

const bookings = require("../api/product_booking/models/productBooking");
const pickupAddress = require("../api/address/models/pickupAddress");

module.exports = async (sequelize) => {
  const db = {};
  db.sequelize = sequelize;
  db.Activity_log = activity_log(sequelize);
  db.Address = address(sequelize);
  db.PickupAddress = pickupAddress(sequelize);
  db.Banner = banner(sequelize);
  db.Media = media(sequelize);
  db.Variant = variant(sequelize);
  db.Bulk_pricing = bulkPricing(sequelize);
  db.Campaign = campaign(sequelize);
  db.Cart = cart(sequelize);
  db.CartVariant = cart_variant(sequelize);
  db.Category = category(sequelize);
  db.Collection = collection(sequelize);
  db.Collection_static = collection_static(sequelize);
  db.Custom_courier = custom_courier(sequelize);
  db.Group = group(sequelize);
  db.Lead = lead(sequelize);
  db.Order = order(sequelize);
  db.Order_variant = order_variant(sequelize);
  db.Order_Status_Tracker = order_status_tracker(sequelize);
  db.Payment_log = payment_log(sequelize);
  db.Permission = permission(sequelize);
  db.Privacy_policy = privacy_policy(sequelize);
  db.Product = product(sequelize);
  db.Product_metrics = product_metrics(sequelize);
  db.ProductTag = productTag(sequelize);
  db.Role = role(sequelize);
  db.Role_permission = role_permission(sequelize);
  db.Ship_rocket_order = ship_rocket_order(sequelize);
  db.Ship_rocket_return = ship_rocket_return(sequelize);
  db.Ship_rocket_orderitem = ship_rocket_orderitem(sequelize);
  db.Store_global = store_global(sequelize);
  db.Store_payment_log = store_payment_log(sequelize);
  db.Store_plan = store_plan(sequelize);
  db.Store_policy = store_policy(sequelize);
  db.Store_server_subscription = store_server_subscription(sequelize);
  db.Store_setting = store_setting(sequelize);
  db.Store_support_ticket = store_support_ticket(sequelize);
  db.Store_subscription = store_subscription(sequelize);
  db.Store_user = store_user(sequelize);
  db.Sub_category = sub_category(sequelize);
  db.Tag = tag(sequelize);
  db.Transaction = transaction(sequelize);
  db.Tutorial = tutorial(sequelize);
  db.Wallet = wallet(sequelize);
  db.Notification = notification(sequelize);
  db.Payout_log = payout_log(sequelize);
  db.Global_brand = store_global_brand(sequelize);
  db.Product_policies = product_policy(sequelize);
  db.Promitional_message = promitional_message(sequelize);
  db.Testimonial = testimonial(sequelize);
  db.Story = story(sequelize);
  db.Return_order = return_order(sequelize);
  db.Product_review = product_review(sequelize);
  db.Marquee = marquee(sequelize);
  db.Free_plan = free_plan(sequelize);
  db.Coupon = coupon(sequelize);
  db.Booking = bookings(sequelize);
  // #################### Product , Variant , Tag , Bulk Pricing and Collection and Collection_static Association #################
  db.Product.hasMany(db.Variant, { foreignKey: "ProductId", as: "variants" });
  db.Variant.belongsTo(db.Product, { foreignKey: "ProductId", as: "product" });
  db.Tag.belongsToMany(db.Product, { as: "products", through: db.ProductTag });
  db.Product.belongsToMany(db.Tag, { as: "tags", through: db.ProductTag });
  db.Variant.hasMany(db.Bulk_pricing, {
    foreignKey: "VariantId",
    as: "bulk_pricings",
  });
  db.Bulk_pricing.belongsTo(db.Variant, {
    foreignKey: "VariantId",
    as: "variants",
  });
  db.Collection_static.hasMany(db.Product, {
    foreignKey: "CollectionStaticId",
    as: "products",
  });
  db.Product.belongsTo(db.Collection_static, {
    foreignKey: "CollectionStaticId",
    as: "collection_static",
  });
  db.Collection.belongsToMany(db.Product, {
    as: "products",
    through: "CollectionProduct",
  });
  db.Product.belongsToMany(db.Collection, {
    as: "collections",
    through: "CollectionProduct",
  });

  // ########## produt reviews #############
  db.Product.hasMany(db.Product_review, {
    foreignKey: "ProductId",
    as: "product_reviews",
  });
  db.Product_review.belongsTo(db.Product, {
    foreignKey: "ProductId",
    as: "product",
  });
  db.Product_review.belongsToMany(db.Media, {
    through: "Product_review_gallery",
    as: "gallery",
  });
  db.Media.belongsToMany(db.Product_review, {
    through: "Product_review_gallery",
    as: "product_review",
  });
  db.Store_user.hasMany(db.Product_review, {
    foreignKey: "StoreUserId",
    as: "product_reviews",
  });
  db.Product_review.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "user",
  });
  db.Product_review.belongsTo(db.Media, {
    foreignKey: "AvatarId",
    as: "avatar",
  });

  db.Lead.belongsTo(db.Product, { foreignKey: "ProductId", as: "product" });
  db.Product.hasMany(db.Lead, { foreignKey: "ProductId", as: "leads" });
  // #################### Product , Category and Sub Category Association #################
  db.Category.hasMany(db.Product, { foreignKey: "CategoryId", as: "products" });
  db.Product.belongsTo(db.Category, {
    foreignKey: "CategoryId",
    as: "category",
  });
  db.Category.hasMany(db.Sub_category, {
    foreignKey: "CategoryId",
    as: "subCategories",
  });
  db.Sub_category.belongsTo(db.Category, {
    foreignKey: "CategoryId",
    as: "category",
  });
  db.Sub_category.hasMany(db.Product, {
    foreignKey: "SubCategoryId",
    as: "products",
  });
  db.Product.belongsTo(db.Sub_category, {
    foreignKey: "SubCategoryId",
    as: "sub_category",
  });

  // ################ Cart , Cartvariant and variant Association ###############
  db.Cart.belongsToMany(db.Variant, { through: "CartVariant" });
  db.Variant.belongsToMany(db.Cart, { through: "CartVariant" });
  db.CartVariant.belongsTo(db.Cart);
  db.CartVariant.belongsTo(db.Variant);
  db.Store_user.belongsTo(db.Cart, { foreignKey: "CartId", as: "cart" });
  db.Cart.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "store_user",
  });
  // #################### Store User , Store Plan and store subscription Association #################

  db.Store_user.hasMany(db.Store_subscription, {
    foreignKey: "StoreUserId",
    as: "subscriptions",
  });
  db.Store_subscription.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "store_user",
  });
  db.Store_plan.hasMany(db.Store_subscription, {
    foreignKey: "PlanId",
    as: "subscriptions",
  });
  db.Store_subscription.belongsTo(db.Store_plan, {
    foreignKey: "PlanId",
    as: "plan",
  });

  // ##################  Store support Ticket ################
  db.Store_support_ticket.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "store_user",
  });

  // ################ User , Role and  Permission ##############
  db.Role.hasMany(db.Store_user, { foreignKey: "RoleId", as: "users_store" });
  db.Store_user.belongsTo(db.Role, { foreignKey: "RoleId", as: "role" });
  db.Role.belongsToMany(db.Permission, {
    as: "permissions",
    through: db.Role_permission,
  });
  db.Permission.belongsToMany(db.Role, {
    as: "roles",
    through: db.Role_permission,
  });

  // ################ Media Association ###############
  db.Category.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });
  db.Sub_category.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });
  db.Product.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });
  db.Variant.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });

  db.Product.belongsToMany(db.Media, {
    foreignKey: "ProductId",
    through: "Product_gallery",
    as: "gallery",
  });
  db.Media.belongsToMany(db.Product, {
    foreignKey: "MediaId",
    through: "Product_gallery",
  });

  db.Variant.belongsToMany(db.Media, {
    foreignKey: "VariantId",
    through: "Variant_gallery",
    as: "gallery",
  });
  db.Media.belongsToMany(db.Variant, {
    foreignKey: "MediaId",
    through: "Variant_gallery",
  });

  db.Tutorial.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });
  db.Collection.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });
  db.Media.belongsToMany(db.Custom_courier, {
    through: "Courier_media_link",
    foreignKey: "MediaId",
    as: "custom_couriers",
  });

  // ################ Lead Association ###############
  db.Lead.belongsTo(db.Store_user, {
    foreignKey: "AssignedTo",
    as: "assigned_to",
  });
  db.Store_user.hasMany(db.Lead, { foreignKey: "AssignedTo", as: "leads" });
  db.Lead.belongsTo(db.Store_user, { foreignKey: "StoreUserId", as: "user" });

  // ################ Store User and Media ############################
  db.Store_user.belongsTo(db.Media, { foreignKey: "AvatarId", as: "avatar" });
  // ################ Store User and Address Association ###############
  db.Store_user.hasMany(db.Address, {
    foreignKey: "StoreUserId",
    as: "addresses",
  });
  db.Address.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "store_user",
  });
  db.Order.belongsTo(db.Address, { foreignKey: "AddressId", as: "address" });

  // ################### Product and Product Metrics ##################
  db.Product_metrics.belongsTo(db.Product, {
    foreignKey: "ProductId",
    as: "product",
  });
  db.Product.hasOne(db.Product_metrics, {
    foreignKey: "ProductId",
    as: "product_metrics",
  });

  // ################### Store Server Subscription and Store User##################

  // ############## testimonials ###############
  db.Testimonial.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "user",
  });
  db.Testimonial.belongsTo(db.Media, { foreignKey: "VideoId", as: "video" });
  db.Testimonial.belongsTo(db.Media, {
    foreignKey: "ThumbnailId",
    as: "thumbnail",
  });

  //############# story and products
  db.Story.belongsTo(db.Media, { foreignKey: "VideoId", as: "video" });
  db.Story.belongsToMany(db.Product, {
    as: "products",
    through: "StoryProduct",
  });
  db.Product.belongsToMany(db.Story, {
    as: "stories",
    through: "StoryProduct",
  });
  db.Story.belongsTo(db.Media, { foreignKey: "ThumbialId", as: "thumbnail" });
  // ##################### store user order order variant and wallet association ###############
  db.Store_user.hasOne(db.Order);
  db.Order.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "store_user",
  });
  db.Order_variant.belongsTo(db.Variant, {
    foreignKey: "VariantId",
    as: "variant",
  });

  db.Order_variant.hasMany(db.Order_Status_Tracker, {
    foreignKey: "OrderVariantId",
    as: "status_tracker",
  });
  db.Order_Status_Tracker.belongsTo(db.Order_variant, {
    foreignKey: "OrderVariantId",
    as: "order_variant",
  });

  db.Order.hasMany(db.Order_variant, {
    foreignKey: "OrderId",
    as: "orderVariants",
  });
  db.Order_variant.belongsTo(db.Order, { foreignKey: "OrderId", as: "order" });
  db.Store_user.hasMany(db.Wallet, {
    foreignKey: "StoreUserId",
    as: "wallets",
  });
  db.Wallet.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "store_user",
  });
  db.Store_user.hasMany(db.Payout_log, {
    foreignKey: "StoreUserId",
    as: "payout_logs",
  });
  //########### Activity Log and Transaction Association ##################
  db.Store_user.hasMany(db.Activity_log, {
    foreignKey: "StoreUserId",
    as: "activity_logs",
  });
  db.Activity_log.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "user",
  });
  db.Transaction.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "user",
  });

  // ############### ShipRocket Associations ###########
  db.Ship_rocket_order.hasMany(db.Ship_rocket_orderitem, {
    foreignKey: "ShipRocketOrderId",
    as: "orderItems",
  });
  db.Ship_rocket_orderitem.belongsTo(db.Ship_rocket_order, {
    foreignKey: "ShipRocketOrderId",
    as: "shipRocketOrder",
  });
  db.Order_variant.belongsTo(db.Ship_rocket_orderitem, {
    foreignKey: "ShipRocketOrderItemId",
    as: "shipRocketOrderItem",
  });
  db.Ship_rocket_orderitem.belongsTo(db.Order_variant, {
    foreignKey: "OrderVariantId",
    as: "orderVariant",
  });
  db.Ship_rocket_orderitem.belongsTo(db.Ship_rocket_return, {
    foreignKey: "ShipRocketReturnId",
    as: "shipRocketReturn",
  });
  db.Ship_rocket_return.hasMany(db.Ship_rocket_orderitem);

  // ############### Custom Courier Associations ###########
  db.Custom_courier.belongsToMany(db.Media, {
    through: "Courier_media_link",
    foreignKey: "CustomCourierId",
    as: "media",
  });
  db.Custom_courier.belongsTo(db.Order_variant, {
    foreignKey: "OrderVariantId",
    as: "order_variant",
  });
  db.Order_variant.belongsTo(db.Custom_courier, {
    foreignKey: "CustomCourierId",
    as: "custom_couriers",
  });

  db.Global_brand.belongsTo(db.Media, {
    foreignKey: "LogoIdDark",
    as: "logo_dark",
  });
  db.Global_brand.belongsTo(db.Media, {
    foreignKey: "LogoIdLight",
    as: "logo_light",
  });
  db.Global_brand.belongsTo(db.Media, {
    foreignKey: "FavIconId",
    as: "favicon",
  });

  db.Banner.belongsTo(db.Media, {
    foreignKey: "MobileThumbnailId",
    as: "mobile_thumbnail",
  });
  db.Banner.belongsTo(db.Media, {
    foreignKey: "DesktopThumbnailId",
    as: "desktop_thumbnail",
  });

  //############# return order and media
  db.Return_order.belongsTo(db.Media, { foreignKey: "ImageId", as: "image" });
  db.Return_order.belongsTo(db.Store_user, {
    foreignKey: "StoreUserId",
    as: "user",
  });
  db.Store_user.hasMany(db.Return_order, {
    foreignKey: "StoreUserId",
    as: "return_orders",
  });
  db.Return_order.belongsTo(db.Order_variant, {
    foreignKey: "OrderVariantId",
    as: "order_variant",
  });

  db.Marquee.belongsTo(db.Media, { foreignKey: "ImageId", as: "image" });

  db.Coupon.belongsTo(db.Collection, {
    foreignKey: "CollectionId",
    as: "collection",
  });
  db.Collection.hasMany(db.Coupon, {
    foreignKey: "CollectionId",
    as: "coupons",
  });
  db.Coupon.belongsTo(db.Media, {
    foreignKey: "MediaId",
    as: "image",
  });

  db.Product.hasMany(db.Coupon, { foreignKey: "ProductId", as: "coupons" });
  db.Collection.belongsTo(db.Product, {
    foreignKey: "ProductId",
    as: "product",
  });

  //  A User can have many Bookings
  db.Store_user.hasMany(db.Booking, {
    foreignKey: "userId",
    as: "store_user",
  });

  // A Booking belongs to a User
  db.Booking.belongsTo(db.Store_user, {
    foreignKey: "userId",
    as: "store_user",
  });

  // A Product can have many Bookings
  db.Product.hasMany(db.Booking, {
    foreignKey: "productId",
    as: "product",
  });

  // A Booking belongs to a Product
  db.Booking.belongsTo(db.Product, {
    foreignKey: "productId",
    as: "product",
  });

  db.Variant.hasMany(db.Booking, {
    foreignKey: "variantId",
    as: "variant",
  });

  db.Booking.belongsTo(db.Variant, {
    foreignKey: "variantId",
    as: "variant",
  });

  // db.Coupon.belongsToMany(db.Product, {
  //   foreignKey: "CouponId",
  //   through: "CouponProduct",
  // });
  // db.Product.belongsToMany(db.Coupon, {
  //   foreignKey: "ProductId",
  //   through: "CouponProduct",
  //   as: "product_coupons"
  // });
  return db.sequelize;
};
