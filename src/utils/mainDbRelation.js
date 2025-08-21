const user = require("../api/user/models/user");
const role = require("../api/role/models/role");
const permission = require("../api/permission/models/permission");
const role_permission = require("../api/permission/models/role_permission");
const plan = require("../api/plan/models/plan");
const server_subscription = require("../api/server_subscription/models/server_subscription");
const global = require("../api/global/models/global");
const payment_log = require("../api/payment_log/models/payment_log");
const support_ticket = require("../api/support_ticket/models/support_ticket");
const cart = require("../api/cart/models/cart");
const global_brand = require("../api/global_brand/models/global_brand");
const store_setting = require("../api/store_setting/models/store_setting");
const free_plan = require("../api/free_plan/models/free_plan");
const plan_metrics = require("../api/plan_metrics/models/plan_metrics");
const tenant_metric = require("../api/tenant_metric/models/tenant_metric");
const activity_log = require("../api/activity_log/models/activity_log");
const transaction = require("../api/transaction/models/transaction");
const upload = require("../api/upload/models/media");
const lead = require("../api/lead/models/lead");
const banner = require("../api/banner/models/banner");
const registration = require("../api/user/models/registration.js")
module.exports = async (sequelize) => {
  const db = {};
  db.sequelize = sequelize;
  db.Permission = permission(sequelize);
  db.Role = role(sequelize);
  db.User = user(sequelize);
  db.Role_permission = role_permission(sequelize);
  db.Server_subscription = server_subscription(sequelize);
  db.Global = global(sequelize);
  db.Payment_log = payment_log(sequelize);
  db.Plan = plan(sequelize);
  db.Cart = cart(sequelize);
  db.Support_ticket = support_ticket(sequelize);
  db.Global_brand = global_brand(sequelize);
  db.Store_setting = store_setting(sequelize);
  db.Free_plan = free_plan(sequelize);
  db.Activity_log = activity_log(sequelize);
  db.Plan_metrics = plan_metrics(sequelize);
  db.Tenant_metric = tenant_metric(sequelize);
  db.Transaction = transaction(sequelize);
  db.Media = upload(sequelize);
  db.Lead = lead(sequelize)
  db.Banner = banner(sequelize)
  db.Registration = registration(sequelize)
  // User -> Role
  db.Role.hasMany(db.User, { foreignKey: "RoleId", as: "users" });
  db.User.belongsTo(db.Role, { foreignKey: "RoleId", as: "role" });
  db.Global.belongsTo(db.Media, { foreignKey: "LogoId", as: "logo" });
  // Support Ticket -> User
  db.Support_ticket.belongsTo(db.User, { foreignKey: "UserId", as: "user" });
  // Role -> Permission
  db.Role.belongsToMany(db.Permission, {
    as: "permissions",
    through: db.Role_permission,
  });
  db.Permission.belongsToMany(db.Role, {
    as: "roles",
    through: db.Role_permission,
  });
  // User -> Subscription
  db.User.hasMany(db.Server_subscription, {
    foreignKey: "UserId",
    as: "subscriptions",
  });
  db.Server_subscription.belongsTo(db.User, {
    foreignKey: "UserId",
    as: "user",
  });
  // // Plan -> Subscription
  db.Plan.hasMany(db.Server_subscription, {
    foreignKey: "PlanId",
    as: "subscriptions",
  });
  db.Server_subscription.belongsTo(db.Plan, {
    foreignKey: "PlanId",
    as: "plan",
  });

  // User -> Activity_log
  db.User.hasMany(db.Activity_log, {
    foreignKey: "UserId",
    as: "activity_logs",
  });
  db.User.hasMany(db.Lead, {
    foreignKey: "AssignedTo",
    as: "leads",
  });
  db.Lead.belongsTo(db.User, { foreignKey: "AssignedTo", as: "assigned_to" });

  db.Activity_log.belongsTo(db.User, { foreignKey: "UserId", as: "user" });

  db.Plan_metrics.belongsTo(db.Plan, { foreignKey: "PlanId", as: "plan" });
  db.Plan.hasOne(db.Plan_metrics, { foreignKey: "PlanId", as: "plan_metrics" });

  db.Tenant_metric.belongsTo(db.User, { foreignKey: "UserId", as: "user" });

  db.User.hasOne(db.Tenant_metric, {
    foreignKey: "UserId",
    as: "tenant_metric",
  });

  db.User.hasMany(db.Transaction, { foreignKey: "UserId", as: "transaction" });
  db.Transaction.belongsTo(db.User, { foreignKey: "UserId", as: "user" });

  db.Payment_log.belongsTo(db.User, {
    foreignKey: "UserId",
    as: "user",
  });

  db.Permission.belongsToMany(db.User, { through: "User_permission", as: "users" });
  db.User.belongsToMany(db.Permission, { through: "User_permission", as: "permissions" });

  db.Banner.belongsTo(db.Media, { foreignKey: "MobileThumbnailId", as: "mobile_thumbnail" })
  db.Banner.belongsTo(db.Media, { foreignKey: "DesktopThumbnailId", as: "desktop_thumbnail" })

  db.Global_brand.belongsTo(db.Media, { foreignKey: "LogoIdDark", as: "logo_dark" })
  db.Global_brand.belongsTo(db.Media, { foreignKey: "LogoIdLight", as: "logo_light" })
  db.Global_brand.belongsTo(db.Media, { foreignKey: "FavIconId", as: "favicon" })

  return db.sequelize;
};
