const app = require("../../server");

require("../api/activity_log/routes/activity_log")(app);
require("../api/address/routes/address")(app);
require("../api/address/routes/pickupAddress")(app);
require("../api/admin/routes/admin")(app);
require("../api/banner/routes/banner")(app);
require("../api/banner/routes/store_banner")(app);
require("../api/bulk_pricing/routes/bulk_pricing")(app);
require("../api/campaign/routes/campaign")(app);
require("../api/cart/routes/cart")(app);
require("../api/category/routes/category")(app);
require("../api/collection/routes/collection")(app);
require("../api/collection_static/routes/collection_static")(app);
require("../api/custom_courier/routes/custom_courier")(app);
require("../api/free_plan/routes/free_plan")(app);
// require("../api/subscription/routes/subscription")(app);
require("../api/global/routes/global")(app);
require("../api/global_brand/routes/global_brand")(app);
require("../api/store_global_brand/routes/global_brand")(app);
require("../api/group/routes/group")(app);
require("../api/lead/routes/lead")(app);
require("../api/order/routes/order")(app);
require("../api/order_variant/routes/order_variant")(app);
require("../api/payment_log/routes/payment_log")(app);
require("../api/permission/routes/permission")(app);
require("../api/plan/routes/plan")(app);
require("../api/plan_metrics/routes/plan_metrics")(app);
require("../api/product/routes/product")(app);
require("../api/product_metrics/routes/product_metrics")(app);
require("../api/privacy_policy/routes/privacy_policy")(app);
require("../api/role/routes/role")(app);
require("../api/role/routes/store_role")(app);
require("../api/server_subscription/routes/server_subscription")(app);
require("../api/ship_rocket_order/routes/ship_rocket_order")(app);
require("../api/ship_rocket_orderitem/routes/ship_rocket_orderitem")(app);
require("../api/store_global/routes/store_global")(app);
require("../api/store_payment_log/routes/store_payment_log")(app);
require("../api/store_plan/routes/store_plan")(app);
require("../api/store_policy/routes/store_policy")(app);
require("../api/store_setting/routes/store_setting")(app);
require("../api/store_subscription/routes/store_subscription")(app);
require("../api/store_support_ticket/routes/store_support_ticket")(app);
require("../api/store_user/routes/store_user")(app);
require("../api/sub_category/routes/sub_category")(app);
require("../api/support_ticket/routes/support_ticket")(app);
require("../api/tag/routes/tag")(app);
require("../api/transaction/routes/transaction")(app);
require("../api/store_transaction/routes/store_transaction")(app);
require("../api/tutorial/routes/tutorial")(app);
require("../api/upload/routes/upload")(app);
require("../api/user/routes/user")(app);
require("../api/variant/routes/variant")(app);
require("../api/wallet/routes/wallet")(app);
require("../api/ship_rocket_order/routes/ship_rocket_order")(app);
require("../api/ship_rocket_orderitem/routes/ship_rocket_orderitem")(app);
require("../api/ship_rocket_return/routes/ship_rocket_return")(app);
require("../api/notification/routes/notification")(app);
require("../api/store_lead/routes/store_lead")(app);
require("../api/permission/routes/store_permission")(app);
require("../api/store_activity_log/routes/store_activity_log")(app);
require("../api/tenant_metric/routes/tenant_metric")(app);
require("../api/product_policy/routes/product_policy")(app);
require("../api/promotional_message/routes/promotional_message")(app);
require("../api/testimonial/routes/testimonial")(app);
require("../api/story/routes/story")(app);
require("../api/return_order/routes/return_order")(app);
require("../api/product_review/routes/product_review")(app);
require("../api/marquee/routes/marquee")(app);
require("../api/free_plan/routes/store_free_plan")(app);
require("../api/coupon/routes/coupon")(app);

// product booking system implementation
require("../api/product_booking/routes/productBooking")(app);
// const fs = require("fs");
// const path = require("path");

// let routes = [];
// async function registerRoutes(name) {
//     const apiDirectory = path.resolve("./src/api")
//     const apiFolders = await fs.readdirSync(apiDirectory)
//     //console.log(apiFolders)
//     let folders = [];
//     apiFolders.map((item) => {
//         folders.push(path.join(apiDirectory, item, "routes"))
//     })
//     for (const folder of folders) {
//         const files = fs.readdirSync(folder)
//         //console.log(folder)
//         for (const file of files) {
//             // //console.log(folder.concat(file))
//             // //console.log(folder)
//             const pathh = ".." + folder.split("src")[1].concat(`\\`, file)
//             //console.log(pathh.replaceAll("\\", "/"))
//             const module = require(pathh.replaceAll("\\", "/"))
//             routes.push(module)
//         }
//     }
//     // //console.log(routes)
// }
// registerRoutes()
