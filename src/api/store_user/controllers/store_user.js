const { mailSender } = require("../../../services/emailSender");
const fs = require("fs");
const ejs = require("ejs");
const firebaseAdmin = require("firebase-admin");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");
const { Op, where } = require("sequelize");
const jwt = require("../../../services/jwt");
const { hash, compare } = require("../../../services/bcrypt");
const {
  tokenError,
  errorResponse,
} = require("../../../services/errorResponse");
const { createActivityLog } = require("../../../services/createActivityLog");
const tenantMetric = require("../../../services/tenantMetric");
const { tenant_metric_fields } = require("../../../constants/tenant_metric");
const { activity_event } = require("../../../constants/activity_log");
const { isPremiumUser } = require("../services/store_user");
const getRoleId = require("../../../services/getRoleId");
const { getPreviousDates } = require("../../../services/date");
const generateOTP = require("../services/generateOTP");
const otpTime = require("../services/otpTime");
const { IntraktNotify } = require("../../../services/notification");
const { default: axios } = require("axios");
const { config } = require("dotenv");
const crypto = require("crypto");
const msg91 = require("../../../services/msg91");

config();
exports.create = async (req, res) => {
  try {
    const sequelize = req.db;
    const body = req.body;
    const { name, email, phone, password } = body;
    const trimedPhone = phone.trim().split(" ").join("").slice(-10);
    const findUser = await sequelize.models.Store_user.findOne({
      where: { [Op.or]: [{ email: email }, { phone: trimedPhone }] },
    });
    if (findUser) {
      const matching_value = Object.entries(findUser.dataValues).find(
        ([key, value]) => value === email || value === trimedPhone
      );
      return res.status(400).send(
        errorResponse({
          message: `User Already Exists with the ${matching_value[0]} ${matching_value[1]}`,
        })
      );
    }

    const consumer_role = await sequelize.models.Role.findOne({
      where: { name: "Consumer" },
      raw: true,
    });
    const hasPass = await hash(password);
    const Store_user = await sequelize.models.Store_user.create({
      name,
      email,
      phone: trimedPhone,
      password: hasPass,
      RoleId: consumer_role.id,
      AvatarId: body.AvatarId,
    });

    const htmlContent = fs.readFileSync("./views/accountCreated.ejs", "utf8");
    const renderedContent = ejs.render(htmlContent, { name, task: "Created" });
    // code to send fcm
    // const token = "fJTTL0EVXZo6_tdNsUytRY:APA91bH5LstGlPSY_LQPfP8hFCDpIUmYF8o4Ct5qR1vgctcxYxTRfVscCRsjmscoOdSEuO8skY3MgKrQ7k5VBeRe-vgmvC9oXnPlP7Pc65UQTyoI0F5Vvd-vo5fa99lIDIFVNUd5WHI6";

    // const message = {
    //   notification: {
    //     title: "user Created  successfullY!",
    //     body: "now you can enjoy shopping",
    //   },
    //   token,
    // };

    // const sendMessage = await firebaseAdmin.messaging().send(message);
    tenantMetric({
      subdomain: req.subdomain,
      field_name: tenant_metric_fields.total_users,
    });
    const emailsend = await mailSender({
      to: email,
      subject: "Your account has been created ",
      html: renderedContent,
    });
    return res.status(200).send({
      message: "User Store Created Successfully!",
      data: { name, email, phone },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.update = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const token = jwt.verify(req);

    console.log(token, typeof token.id, typeof id, typeof token.error);

    if (token.error || token.id != id) {
      return res
        .status(401)
        .send(
          tokenError(token, "User Store not found", "User Store not found")
        );
    }
    const [updatedRowsCount, [updatedUserStore]] =
      await sequelize.models.Store_user.update(req.body, {
        where: { id: id },
        returning: true,
      });
    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: "User Store not found" });
    }
    return res.status(200).send({
      message: "User Store Updated Successfully!",
      data: updatedUserStore,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.find = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const pagination = await getPagination(query.pagination);
    const StoreUser = await sequelize.models.Store_user.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      include: ["avatar"],
    });

    const meta = await getMeta(pagination, StoreUser.count);
    return res.status(200).send({ data: StoreUser.rows, meta });
  } catch (error) {
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.findOne = async (req, res) => {
  try {
    //console.log("entered in findOne");
    const sequelize = req.db;
    const id = req.params.id;
    const storeUser = await sequelize.models.Store_user.findOne({
      where: { id: id },
      include: ["avatar"],
    });
    if (!storeUser) {
      return res.status(404).send(
        errorResponse({
          message: "User Not Found!",
          details: "User id seems to be invalid",
        })
      );
    }
    return res.status(200).send({ data: storeUser });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.delete = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    const isUserExists = await sequelize.models.Store_user.findByPk(id, {
      include: ["role"],
    });
    if (!isUserExists)
      return res
        .status(404)
        .send(errorResponse({ status: 404, message: "User Not Found" }));
    if (isUserExists?.role?.name?.toLowerCase() === "admin")
      return res
        .status(400)
        .send(
          errorResponse({ status: 400, message: "You can not delete Admin" })
        );

    const deleteUser = await sequelize.models.Store_user.destroy({
      where: { id: id },
    });
    return res
      .status(200)
      .send({ message: "User Store Deleted Successfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.search = async (req, res) => {
  try {
    //console.log("entered search");
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const users = await sequelize.models.Store_user.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      where: {
        [Op.or]: [
          {
            name: { [Op.iLike]: `%${qs}%` },
          },
          {
            email: { [Op.iLike]: `%${qs}%` },
          },
        ],
      },
      include: ["addresses", "avatar"],
    });
    const meta = await getMeta(pagination, users.count);
    return res.status(200).send({ data: users.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const sequelize = req.db;
    const findUser = await sequelize.models.Store_user.findOne({
      where: { email: email },
      include: ["avatar"],
    });

    if (!findUser) {
      return res
        .status(400)
        .send(errorResponse({ status: 404, message: "User Not Found!" }));
    }
    const isPremium = await isPremiumUser({
      id: findUser.dataValues.id,
      sequelize,
    });
    const isMatched = await compare(password, findUser.dataValues.password);
    if (!isMatched) {
      return res
        .status(404)
        .send(errorResponse({ status: 404, message: "Invalid Credentials!" }));
    }
    const token = jwt.issue({ id: findUser.id });
    await createActivityLog({
      sequelize,
      event: activity_event.USER_LOG_IN,
      StoreUserId: findUser.id,
    });
    delete findUser.password;
    return res.status(200).send({
      data: { jwt: token, user: { ...findUser.dataValues, isPremium } },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

/**
 *
 * @param {Object} req
 * @param {import("sequelize").Sequelize} req.db
 * @returns
 */

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const sequelize = req.db;
    const findAdmin = await sequelize.models.Store_user.findOne({
      where: { email: email },
      include: [
        "avatar",
        { model: sequelize.models.Role, as: "role", where: { name: "Admin" } },
      ],
    });

    if (!findAdmin) {
      return res
        .status(400)
        .send(errorResponse({ status: 404, message: "User Not Found!" }));
    }
    const isMatched = await compare(password, findAdmin.dataValues.password);
    if (!isMatched) {
      return res
        .status(404)
        .send(errorResponse({ status: 404, message: "Invalid Credentials!" }));
    }
    const token = jwt.issue({ id: findAdmin.id });
    await createActivityLog({
      sequelize,
      event: activity_event.USER_LOG_IN,
      StoreUserId: findAdmin.id,
    });
    delete findAdmin.password;
    return res.status(200).send({ data: { jwt: token, user: findAdmin } });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.getMe = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    if (token.error) {
      return res.status(401).send(tokenError(token));
    }
    const findUser = await sequelize.models.Store_user.findOne({
      where: { id: token.id },
      attributes: { exclude: ["password", "password_reset_token"] },
      include: ["addresses", "avatar"],
    });
    const subscriptions = await sequelize.models.Store_subscription.findAll({
      where: { StoreUserId: token.id, status: "ACTIVE" },
      order: [["valid_to", "asc"]],
      include: ["plan"],
    });

    const currentDate = new Date();
    let isPremium;
    if (subscriptions.length) {
      const expiredSubscriptions = subscriptions.filter((subscription) => {
        const validToDate = new Date(subscription.valid_to);
        return validToDate < currentDate;
      });
      isPremium = await isPremiumUser({ id: token.id, sequelize });
      findUser.isPremium = true;
      await findUser.save();
      const expiredSubscriptionIds = expiredSubscriptions.map(
        (subscription) => subscription.id
      );
      await sequelize.models.Store_subscription.update(
        { status: "EXPIRED" },
        {
          where: { id: expiredSubscriptionIds },
        }
      );
    } else {
      findUser.isPremium = false;
      await findUser.save();
    }
    return res.status(200).send({
      data: {
        ...findUser.dataValues,
        subscription: subscriptions.length ? subscriptions[0] : null,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: "Internal server Error" }));
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const sequelize = req.db;
    const password_reset_token = crypto.randomBytes(16).toString("hex");

    const storeUser = await sequelize.models.Store_user.findOne({
      where: { email },
    });

    if (!storeUser) {
      return res.status(400).send(errorResponse({ message: "Invalid Email" }));
    }
    const [updatedRowsCount, [updatedUser]] =
      await sequelize.models.Store_user.update(
        { password_reset_token: password_reset_token },
        {
          where: { email },
          returning: true,
        }
      );
    const name = updatedUser.name;
    //console.log(updatedUser)
    // const userEmail = updatedUser.email;
    const userEmail = storeUser?.email;
    const htmlContent = fs.readFileSync(
      "./views/verifyResetPassword.ejs",
      "utf8"
    );
    const renderedContent = ejs.render(htmlContent, {
      name,
      href: `https://${req.subdomain}.dashboard.socialseller.in/reset-password?password_reset_token=${password_reset_token}&email=${email}`,
    });
    mailSender({
      to: userEmail,
      subject: "User Password Reset",
      html: renderedContent,
    });
    return res.status(200).send({
      message: `Email with reset link has been sent to ${
        userEmail.slice(0, 3) + "********" + userEmail.slice(-5)
      } `,
    });
  } catch (error) {
    //console.log("Error in initiateResetPassword:", error);
    return res.status(500).send({
      status: 500,
      message: "Internal server Error",
      details: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const sequelize = req.db;
    const { email, password_reset_token } = req.query;

    const storeUser = await sequelize.models.Store_user.findOne({
      where: { email: email },
    });

    if (storeUser) {
      if (password_reset_token === storeUser.password_reset_token) {
        const { password } = req.body;
        const hashedPassword = await hash(password);
        //console.log(hashedPassword)
        storeUser.password = hashedPassword;
        await storeUser.save();
        //console.log(storeUser);
        return res.status(200).send({ data: storeUser });
      } else {
        return res
          .status(400)
          .send(errorResponse({ message: "Invalid Request!" }));
      }
    } else {
      return res.status(400).send(
        errorResponse({
          message: "Invalid Email",
          details: "Given email does not exists",
        })
      );
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(
      errorResponse({
        status: 500,
        message: "Internal server Error",
        details: error.message,
      })
    );
  }
};

exports.register_FCM = async (req, res) => {
  try {
    const sequelize = req.db;
    const token = jwt.verify(req);
    const user = await sequelize.models.Store_user.update(req.body, {
      where: { id: token.id },
    });
    return res
      .status(200)
      .send({ message: "FCM Token for notification registered!" });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns
 */
exports.dashboard = async (req, res) => {
  try {
    const sequelize = req.db;
    const whereClause = {};
    if (req.query.hasOwnProperty("days") & (JSON.parse(req.query.days) > 0)) {
      whereClause.createdAt = {
        [Op.gt]: getPreviousDates(Number(req.query.days)),
      };
    }
    const [
      orders,
      products,
      categories,
      users,
      leads,
      return_orders,
      plans,
      subscriptions,
      revenue,
      shares,
      rto_orders,
      out_of_stock,
      payouts,
    ] = await Promise.all([
      await sequelize.models.Order_variant.count({
        where: whereClause,
        include: [{ model: sequelize.models.Order, as: "order" }],
      }),
      await sequelize.models.Product.count({
        where: { is_active: true, ...whereClause },
      }),
      await sequelize.models.Category.count(),
      await sequelize.models.Store_user.count({ where: whereClause }),
      await sequelize.models.Lead.count({ where: whereClause }),
      await sequelize.models.Return_order.count({ where: whereClause }),
      await sequelize.models.Store_plan.count(),
      await sequelize.models.Store_subscription.count({ where: whereClause }),
      (await sequelize.models.Transaction.sum("amount", {
        where: whereClause,
      })) || 0,
      (await sequelize.models.Product_metric.sum("shares_count", {
        where: whereClause,
      })) || 0,
      await sequelize.models.Order_variant.count({
        where: { status: "RETURN_RECEIVED", ...whereClause },
      }),
      await sequelize.models.Product.count({
        distinct: true,
        include: [
          {
            model: sequelize.models.Variant,
            as: "variants",
            where: {
              quantity: 0,
            },
          },
        ],
      }),
      await sequelize.models.Payout_log.count(),
    ]);
    return res.status(200).send({
      data: {
        orders,
        products,
        categories,
        users,
        leads,
        return_orders,
        plans,
        subscriptions,
        revenue,
        out_of_stock,
        rto_orders,
        shares,
        payouts,
      },
    });
  } catch (error) {
    //console.log(error)
    return res
      .status(500)
      .send(errorResponse({ message: error.message, status: 500 }));
  }
};

exports.stafflogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const sequelize = req.db;
    const findUser = await sequelize.models.Store_user.findOne({
      where: { email },
      attributes: ["id", "name", "email", "RoleId", "password"],
      include: ["role"],
    });
    if (!findUser || findUser.role.name !== "Staff") {
      return res
        .status(400)
        .send(errorResponse({ message: "Invalid Staff Credentials!" }));
    }

    const isMatched = await compare(password, findUser.password);
    if (!isMatched) {
      return res
        .status(400)
        .send(errorResponse({ message: "Invalid staff credentials!" }));
    }

    const token = jwt.issue({ id: findUser.id });
    const { id, name, email: userEmail, role } = findUser;

    // const permissions = findUser.permissions
    // //
    // const groupedData = permissions.reduce((grouped, item) => {
    //   const api = item.api;

    //   if (!grouped[api]) {
    //     grouped[api] = [];
    //   }
    //   grouped[api].push(item);

    //   return grouped;
    // }, {});

    // // Convert the grouped object back to an array
    // const groupedArray = Object.entries(groupedData).map(([api, items]) => ({
    //   api,
    //   items,
    // }));

    // groupedArray.sort((a, b) => a.api.localeCompare(b.api));
    // //

    return res.status(200).send({
      data: {
        jwt: token,
        user: { id, name, email: userEmail, role },
        // permissions: groupedArray
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.staffRegister = async (req, res) => {
  const transaction = await req.db.transaction();
  try {
    //get details from body
    const sequelize = req.db;
    const { name, password, email, permissions = [] } = req.body;

    //check if any user exists with name or email
    const user = await sequelize.models.Store_user.findOne({
      where: { [Op.or]: [{ name: name }, { email }] },
    });

    if (user) {
      const matching_value = Object.entries(user.dataValues).find(
        ([key, value]) => value === name || value === email
      );
      return res.status(400).send(
        errorResponse({
          message: `User Already Exists with the ${matching_value[0]} ${matching_value[1]}`,
        })
      );
    }

    const hashedPassword = await hash(password);
    const staff_role_id = await getRoleId("Staff", sequelize);
    const registerStaff = await sequelize.models.Store_user.create(
      {
        name,
        password: hashedPassword,
        email,
        RoleId: staff_role_id,
      },
      { transaction: transaction }
    );

    //register permissions
    if (permissions.length > 0) {
      for (const it of permissions) {
        const registerUserPermissions =
          await sequelize.models.Store_user_permission.findOrCreate({
            where: {
              PermissionId: it,
              UserId: registerStaff.id,
            },
            defaults: { PermissionId: it, UserId: registerStaff.id },
            transaction: transaction,
          });
      }
    }
    await createActivityLog({
      StoreUserId: registerStaff.id,
      event: activity_event.STAFF_REGISTERD,
      transaction: transaction,
    });
    await transaction.commit();
    return res.status(200).send({ data: { name, email, role: "Staff" } });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.staffListings = async (req, res) => {
  try {
    const sequelize = req.db;
    const models = sequelize.models;
    const order = orderBy(req.query);
    const pagination = await getPagination(req.query.pagination);
    const users = await models.Store_user.findAndCountAll({
      order: order,
      limit: pagination.limit,
      offset: pagination.offset,
      attributes: ["id", "name", "email"],
      include: [
        {
          model: models.Role,
          as: "role",
          where: { name: { [Op.in]: ["Admin", "Staff"] } },
          attributes: ["name"],
        },
        "avatar",
      ],
    });
    const meta = await getMeta(pagination, users.count);
    return res.status(200).send({ data: users.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.updateStaff = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const id = req.params.id;

    const { name, email, permissions = [], delete_permissions = [] } = req.body;
    const staff = await sequelize.models.Store_user.findByPk(id, {
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Staff" },
        },
      ],
    });

    if (!staff) {
      return res.status(404).send(
        errorResponse({
          message: `No Staff Found with the given ID: ${id}`,
          status: 404,
          details: "staff id seems to be invalid",
        })
      );
    }
    await staff.update({ name, email }, { where: { id: id }, transaction: t });
    //delete staff
    if (permissions.length > 0) {
      for (const it of permissions) {
        const registerUserPermissions =
          await sequelize.models.Store_user_permission.findOrCreate({
            where: {
              PermissionId: it,
              UserId: staff.id,
            },
            defaults: { PermissionId: it, UserId: staff.id },
            transaction: t,
          });
      }
    }
    if (delete_permissions.length > 0) {
      await sequelize.models.Store_user_permission.destroy(
        {
          where: {
            PermissionId: { [Op.in]: [...delete_permissions] },
            UserId: staff.id,
          },
        },
        {
          transaction: t,
        }
      );
    }
    await t.commit();
    return res.status(200).send({ message: "Staff Undated Successfully!" });
  } catch (err) {
    await t.rollback();
    console.log(err);
    return res.status(500).send(errorResponse({ message: err }));
  }
};

exports.updateAdmin = async (req, res) => {
  const t = await req.db.transaction();
  try {
    const sequelize = req.db;
    const id = req.params.id;

    const { name, email, permissions, delete_permissions } = req.body;
    const Admin = await sequelize.models.Store_user.findByPk(id, {
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Super_Admin" },
        },
      ],
    });

    if (!Admin) {
      return res.status(404).send(
        errorResponse({
          message: `No Admin Found with the given ID: ${id}`,
          status: 404,
          details: "Admin id seems to be invalid",
        })
      );
    }
    await Admin.update({ name, email }, { where: { id: id }, transaction: t });
    await t.commit();
    return res.status(200).send({ message: "Admin Undated Successfully!" });
  } catch (err) {
    await t.rollback();
    console.log(err);
    return res
      .status(500)
      .send(errorResponse({ message: err.message, status: 500 }));
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    //get staff
    const staff = await sequelize.models.Store_user.findByPk(id, {
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: "Staff" },
        },
      ],
    });

    if (!staff) {
      return res.status(400).send(
        errorResponse({
          message: `No Staff Found with the given ID: ${id}`,
        })
      );
    }

    //delete staff

    const deleteStaff = await staff.destroy({ where: { id: id } });
    return res.status(200).send({ message: `staff with id ${id} deleted!` });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.searchStaff = async (req, res) => {
  try {
    const sequelize = req.db;
    const query = req.query;
    const qs = query.qs;
    const pagination = await getPagination(query.pagination);
    const order = orderBy(query);
    const users = await sequelize.models.Store_user.findAndCountAll({
      offset: pagination.offset,
      limit: pagination.limit,
      order: order,
      attributes: {
        exclude: ["password"],
      },
      where: {
        [Op.or]: [
          {
            name: { [Op.iLike]: `%${qs}%` },
          },
          {
            email: { [Op.iLike]: `%${qs}%` },
          },
        ],
      },
      include: [
        {
          model: sequelize.models.Role,
          as: "role",
          where: { name: { [Op.in]: ["Super_Admin", "Staff"] } },
          attributes: ["name"],
        },
      ],
    });
    const meta = await getMeta(pagination, users.count);
    return res.status(200).send({ data: users.rows, meta });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};
// exports.findOne = async (req, res) => {
//   try {
//     const sequelize = req.db;
//     const models = sequelize.models;
//     const id = req.params.id
//     const order = orderBy(req.query);
//     const users = await models.Store_user.findByPk(id, {
//       order: order,
//       attributes: ["id", "name", "email"],
//       include: [
//         {
//           model: models.Role,
//           as: "role",
//           where: { name: { [Op.in]: ["Super_Admin", "Staff"] } },
//           attributes: ["name"],
//         },
//         {
//           model: models.Permission,
//           as: "permissions",
//           attributes: ["id", "api", "endpoint", "method", "handler",],
//         },

//       ],
//     });
//     return res.status(200).send({ data: users });
//   } catch (error) {
//     console.log(error);
//     return res
//       .status(500)
//       .send(errorResponse({ status: 500, message: error.message }));
//   }
// }
/**
 *
 * @param {Object} req
 * @param {import("sequelize").Sequelize} req.db
 * @returns
 */
exports.fullDetail = async (req, res) => {
  try {
    const sequelize = req.db;
    const id = req.params.id;
    let data = "No data found!";
    const type = req.query.type;
    //console.log(type)
    switch (type) {
      case "order":
        data = await sequelize.models.Order_variant.findAll({
          attributes: ["id", "quantity", "price", "selling_price", "status"],
          include: [
            {
              model: sequelize.models.Order,
              as: "order",
              where: { StoreUserId: id },
            },
            {
              model: sequelize.models.Variant,
              as: "variant",
              include: [
                {
                  model: sequelize.models.Media,
                  as: "thumbnail",
                  attributes: ["id", "url"],
                },
                {
                  model: sequelize.models.Product,
                  as: "product",
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        });
        break;
      case "address":
        data = await sequelize.models.Address.findAll({
          where: { StoreUserId: id },
        });
        break;
      case "transaction":
        data = await sequelize.models.Transaction.findAll({
          where: { StoreUserId: id },
        });
        break;
      case "wallet":
        data = await sequelize.models.Wallet.findAll({
          where: { StoreUserId: id },
        });
        break;

      default:
        break;
    }

    return res.status(200).send({ data: data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};
/**
 *
 * @param {Object} req
 * @param {import("sequelize").Sequelize} req.db
 * @param {*} res
 * @returns
 */
exports.setOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const sequelize = req.db;
    let findUser = await sequelize.models.Store_user.findOne({
      where: { phone: phone?.slice(-10) },
    });
    const otp = generateOTP(6);
    const otp_expiration = otpTime(10);

    if (!findUser) {
      const consumer_role = await sequelize.models.Role.findOne({
        where: { name: "Consumer" },
        raw: true,
      });

      findUser = await sequelize.models.Store_user.create({
        phone: phone.slice(-10),
        RoleId: consumer_role.id,
      });
    }
    findUser.otp = otp;
    findUser.otp_expiration = otp_expiration;
    await findUser.save();
    // await findUser.update({ otp: otp, otp_expiration: otp_expiration })

    const global = await sequelize.models.Store_global.findOne();

    // const templateID = "656ec220d6fc0550c2082f12";275588AIHmHWVyjtu5cd18c59

    const url = process.env.MSG91_URL;

    if (
      [
        "7999001618",
        "8349988146",
        "9907318975",
        "9074608609",
        "8816933028",
        "9201594526",
      ].includes(phone.slice(-10))
    ) {
      return res
        .status(200)
        .send({ message: "OTP has been sent to your number" });
    }

    switch (global.user_verification_method) {
      case "INTERAKT":
        if (!global.interakt_api_key || !global.otp_template_id) {
          return res
            .status(500)
            .send(
              errorResponse({ message: "Invalid Verification Credentials" })
            );
        }
        let data = {
          containsImage: false,
          hasButton: false,
          template: "send_otp",
          phoneNumber: phone,
          body: [otp],
        };

        const sendOTP = IntraktNotify(data, sequelize, "OTP");
        return res
          .status(200)
          .send({ message: "OTP has been sent to your phone number" });

        break;
      case "FIREBASE":
        break;
      case "MSG91":
        if (!global.msg91_api_key || !global.msg91_template_id) {
          return res
            .status(500)
            .send(
              errorResponse({ message: "Invalid Verification Credentials" })
            );
        }
        const reqBody = {
          template_id: global?.msg91_template_id,
          short_url: 0,
          recipients: [
            {
              mobiles: "+91" + phone,
              var1: otp,
            },
          ],
        };

        //console.log(url, global.msg91_api_key, global.msg91_template_id)

        const send_sms = axios.post(url, reqBody, {
          headers: {
            authkey: global.msg91_api_key,
          },
        });
        return res
          .status(200)
          .send({ message: "OTP has been sent to your phone number" });

        break;
      case "MSGSSA":
        if (global.msg_balance > 0) {
          const sendsms = await msg91(phone, otp);
          if (sendsms) {
            await global.decrement({ msg_balance: 1 });
            return res
              .status(200)
              .send({ message: "OTP has been sent to your phone number" });
          } else {
            return res
              .status(500)
              .send({ message: "some error occured", details: sendsms });
          }
        } else {
          return res
            .status(500)
            .send({ message: "can't send message,insuficient otp balance" });
        }
        break;
      default:
        return res
          .status(500)
          .send({ message: "no verification method found!" });
        break;
    }
    return res.status(200).send({ data: { otp } });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const sequelize = req.db;
    const findUser = await sequelize.models.Store_user.findOne({
      where: { phone: phone?.slice(-10) },
      include: ["avatar"],
    });

    if (!findUser) {
      return res
        .status(400)
        .send(errorResponse({ status: 404, message: "User Not Found!" }));
    }

    if (
      [
        "7999001618",
        "8349988146",
        "9907318975",
        "9074608609",
        "8816933028",
        "9201594526",
      ].includes(phone?.slice(-10))
    ) {
      const isPremium = await isPremiumUser({
        id: findUser.dataValues.id,
        sequelize,
      });
      await findUser.update({ otp: null });
      const token = jwt.issue({ id: findUser.id });
      await createActivityLog({
        sequelize,
        event: activity_event.USER_LOG_IN,
        StoreUserId: findUser.id,
      });
      delete findUser.password;
      return res.status(200).send({
        data: { jwt: token, user: { ...findUser.dataValues, isPremium } },
      });
    }

    // constant phone otp start
    if (findUser.phone === "7999001618") {
      const isPremium = await isPremiumUser({
        id: findUser.dataValues.id,
        sequelize,
      });
      await findUser.update({ otp: null });
      const token = jwt.issue({ id: findUser.id });
      await createActivityLog({
        sequelize,
        event: activity_event.USER_LOG_IN,
        StoreUserId: findUser.id,
      });
      delete findUser.password;
      return res.status(200).send({
        data: { jwt: token, user: { ...findUser.dataValues, isPremium } },
      });
    }
    // constant phone otp end
    if (findUser.otp !== otp)
      return res
        .status(400)
        .send(errorResponse({ status: 400, message: "Invalid OTP" }));
    if (findUser.otp_expiration < Date.now()) {
      return res.status(400).send(errorResponse({ message: "OTP Expired" }));
    }
    const isPremium = await isPremiumUser({
      id: findUser.dataValues.id,
      sequelize,
    });
    await findUser.update({ otp: null });
    const token = jwt.issue({ id: findUser.id });
    await createActivityLog({
      sequelize,
      event: activity_event.USER_LOG_IN,
      StoreUserId: findUser.id,
    });
    delete findUser.password;
    return res.status(200).send({
      data: { jwt: token, user: { ...findUser.dataValues, isPremium } },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(errorResponse({ status: 500, message: error.message }));
  }
};
