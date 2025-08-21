const dbCache = require("../../../utils/dbCache");
const { Sequelize, where } = require("sequelize");
const jwt = require("../../../services/jwt");
const { hash, compare } = require("../../../services/bcrypt");
const { Op } = require("sequelize");
const {
  tokenError,
  errorResponse,
} = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");
const { request, response } = require("express");
const getRoleId = require("../../../services/getRoleId");
const { adminActivityLog } = require("../../../services/createActivityLog");
const { activity_event } = require("../../../constants/activity_log");
const role = require("../../../constants/role");
const { getDate } = require("../../../services/date");
const permissions = require("../../../constants/permissions");
const dbConnection = require("../../../utils/dbConnection");
const { generateOrderId } = require("../../order/services/orderId");

module.exports = {
  async create(req, res) {
    const t = await req.db.transaction();
    try {
      const sequelize = req.db;
      const { username, email, password } = req.body;

      const findUser = await sequelize.models.User.findOne({
        where: {
          [Op.or]: [{ username }, { email }],
        },
      });
      if (findUser) {
        const matching_value = Object.entries(findUser.dataValues).find(
          ([key, value]) => value === email || value === username
        );
        return res.status(400).send(
          errorResponse({
            message: `User Already Exists with the ${matching_value[0]} ${matching_value[1]}`,
          })
        );
      }
      // encrypting password
      const hashedPassword = await hash(password);
      // creating user
      const createAdmin = await sequelize.models.User.create({
        username: username,
        email: email,
        password: hashedPassword,
        // RoleId: await getRoleId("Super_Admin", sequelize),
        RoleId: 1
      }, { transaction: t });

      await adminActivityLog({ sequelize, event: activity_event.ADMIN_REGISTERD, transaction: t, UserId: createAdmin.id })
      await t.commit();
      return res.status(200).send({
        message: "Admin created successfully!",
        data: createAdmin,
      });
    } catch (error) {
      console.log(error);
      await t.rollback();
      return res.status(500).send(
        errorResponse({
          status: 500,
          message: "some internal server error occured!",
        })
      );
    }
  },
  async dashboard(req, res) {
    try {
      const sequelize = req.db;
      const today = new Date(Date.now()).toISOString();

      const server_subscriptions = await sequelize.models.Server_subscription.update({ status: "EXPIRED" }, {
        where: { valid_to: { [Op.lt]: today }, is_paid: true, status: 'ACTIVE', },
      })

      const [active_stores, expired_stores, suspended_stores, staffs, subscriptions, plans, roles, transactions, revenue, leads, resellers] = await Promise.all([

        /// active stores
        sequelize.models.User.count({
          where: { is_active: true },
          include: [{
            model: sequelize.models.Role,
            as: "role",
            where: { name: "Admin" },
          },
            // {
            //   model: sequelize.models.Server_subscription, as: "subscriptions",
            //   where: { is_paid: true, status: "ACTIVE", valid_to: { [Op.gte]: getDate() } },
            // }
          ]
        }),

        ///expired stores
        sequelize.models.User.count({
          distinct: true,
          include: [
            {
              model: sequelize.models.Role, as: "role", where: { name: "Admin" }
            },
            {
              model: sequelize.models.Server_subscription, as: "subscriptions",
              where: { is_paid: true, status: "EXPIRED", valid_to: { [Op.lte]: getDate() } },
              order: [["id", "asc"]],
            }],
        }),
        /// suspended stores
        sequelize.models.User.count({
          where: { is_active: false },
          distinct: true,
          include: [
            {
              model: sequelize.models.Role, as: "role", where: { name: "Admin" }
            },
            // {
            //   model: sequelize.models.Server_subscription, as: "subscriptions",
            //   where: { is_paid: true, status: "EXPIRED", valid_to: { [Op.lte]: getDate() } },
            //   order: [["id", "asc"]],
            // }
          ],
        }),
        // total stafss
        sequelize.models.User.count({
          include: {
            model: sequelize.models.Role,
            as: "role",
            where: { name: "Staff" },
          },
        }),
        // total subscription
        sequelize.models.Server_subscription.count({
          where: { is_paid: true, amount: { [Op.gt]: 0 } },
        }),
        /// plan count
        sequelize.models.Plan.count(),
        /// roles count
        sequelize.models.Role.count(),
        /// transactions count
        sequelize.models.Transaction.count(),
        /// revenue 
        sequelize.models.Server_subscription.sum("amount", { where: { is_paid: true } }),
        /// lead count 
        sequelize.models.Lead.count(),
        /// total resellers
        sequelize.models.Tenant_metric.sum("total_users")
      ]);




      return res.status(200).send({
        active_stores,
        expired_stores,
        suspended_stores,
        transactions,
        staffs,
        subscriptions,
        plans,
        roles,
        revenue: revenue === null ? 0 : revenue,
        leads,
        resellers
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(
        errorResponse({
          status: 500,
          message: "Some Internal server error occured!",
        })
      );
    }
  },
  async adminStaffMe(req, res) {
    try {
      const sequelize = req.db;
      const models = sequelize.models;
      const token = jwt.verify(req)
      if (token.error) {
        return res.status(401).send(errorResponse({ message: "Invalid Token Passed", status: 401 }))
      }
      const user = await models.User.findByPk(token.id, {
        attributes: ["id"],
        include: [
          {
            model: models.Role,
            as: "role",
            where: { name: { [Op.in]: ["Super_Admin", "Staff"] } },
            attributes: ["name"],

          },
        ],
      });

      if (!user) {
        return res.status(400).send(errorResponse({ message: "Invalid Id" }))
      }

      let userData;
      let allPermissions
      if (user.role.name === "Staff") {
        const findUser = await sequelize.models.User.findByPk(token.id, {
          attributes: ["id", "username", "email"],
          include: [
            {
              model: models.Role,
              as: "role",
              attributes: ["name"],
            },
            {
              model: models.Permission,
              as: "permissions",
              where: { api: { [Op.in]: permissions.Staff } }
            },
          ],
        })

        const { id, username, email, permissions } = findUser

        userData = {
          id, username, email
        }
        allPermissions = permissions

      } else {
        const findUser = await sequelize.models.User.findByPk(token.id, {
          attributes: ["id", "username", "email"],
          include: [
            {
              model: models.Role,
              as: "role",
              attributes: ["name"],
              include: [
                {
                  model: models.Permission,
                  as: "permissions",
                  where: { api: { [Op.in]: permissions.Super_Admin } }
                },
              ],
            },
          ],
        })

        const { id, username, email, } = findUser
        //
        userData = {
          id, username, email
        }
        allPermissions = findUser.role.permissions
      }

      const groupedData = allPermissions.reduce((grouped, item) => {
        const api = item.api;
        if (!grouped[api]) {
          grouped[api] = [];
        }
        grouped[api].push(item);
        return grouped;
      }, {});

      const groupedArray = Object.entries(groupedData).map(([api, items]) => ({
        api,
        items,
      }));

      groupedArray.sort((a, b) => a.api.localeCompare(b.api));

      let data = { user: userData, permissions: groupedArray }
      return res.status(200).send({ data })

    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: error.message }));
    }
  },
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const sequelize = req.db;
      const findUser = await sequelize.models.User.findOne({
        where: { email },
        attributes: {
          exclude: ["port", "database", "host", "db_username", "subdomain", "razorpay_account_id", "is_active", "store_type",]
        },
        include: ["role"],
      });
      if (!findUser || findUser.role.name !== "Super_Admin") {
        return res.status(400).send(errorResponse({ message: "Invalid Admin Credentials!" }));
      }

      const isMatched = await compare(password, findUser.password);
      if (!isMatched) {
        return res.status(400).send(errorResponse({ message: "Invalid Admin Credentials!" }));
      }

      const token = jwt.issue({ id: findUser.id });

      delete findUser.password;

      await sequelize.models.Server_subscription.update(
        { status: "EXPIRED" },
        {
          where: {
            [Op.and]: [
              { status: "ACTIVE" },
              {
                valid_to: {
                  [Op.lt]: getDate(),
                },
              },
            ],
          },
        }
      );

      // const allUsers = await sequelize.models.User.findAll({
      //   // limit: 100,
      //   include: [
      //     {
      //       model: sequelize.models.Role,
      //       as: 'role',
      //       where: { name: 'Admin' },
      //       attributes: ['name'],
      //     },
      //     {
      //       model: sequelize.models.Server_subscription,
      //       as: 'subscriptions',
      //     }
      //   ],
      // });


      // const today = new Date();
      // const subscriptions = allUsers.filter(user => !user.subscriptions.length).map(user => {
      //   const validFrom = user.createdAt;
      //   const validTo = new Date(validFrom);
      //   validTo.setDate(validTo.getDate() + 30);

      //   const status = today > validTo ? 'EXPIRED' : 'ACTIVE';

      //   return {
      //     UserId: user.id,
      //     amount: 100,  // Set your desired amount
      //     order_id: generateOrderId("ORD"),  // Generate or set your order ID
      //     payment_id: generateOrderId("PAY"),  // Generate or set your payment ID
      //     purchaseType: 'CASH',  // Set your desired purchase type
      //     valid_from: validFrom,
      //     valid_to: validTo,
      //     is_paid: true,  // Set payment status
      //     status: status
      //   };
      // });

      // // Step 3: Insert the subscription entries into the database
      // await sequelize.models.Server_subscription.bulkCreate(subscriptions);

      return res.status(200).send({
        data: {
          jwt: token,
          user: findUser,
        },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },
  async clientDasboard(req, res) {
    try {
      const { email } = req.body;
      const sequelize = req.db;
      const findUser = await sequelize.models.User.findOne({
        where: { email },
        include: ["role"],
        raw: true,
      });
      if (!findUser || findUser.role.name !== "Admin") {
        return res.status(400).send(errorResponse({ message: "Invalid Admin Credentials!" }));
      }
      const tenant_sequelize = await dbConnection(findUser.subdomain)
      const storeUser = await tenant_sequelize.models.Store_user.findOne({
        where: { email: email },
        raw: true,
        attributes: { exclude: ["password"] }
      })
      if (!storeUser) {
        return res.status(400).send(errorResponse({ message: `No store found!`, details: `No store found of ${findUser.subdomain}` }))
      }

      const token = jwt.issue({ id: storeUser.id });

      res.setHeader
      return res.status(200).send({
        data: {
          jwt: token,
          user: storeUser,
        },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },
  async stafflogin(req, res) {
    try {
      const { email, password } = req.body;
      const sequelize = req.db;
      const findUser = await sequelize.models.User.findOne({
        where: { email },
        attributes: ["id", "username", "email", "RoleId", "password"],
        include: ["role", "permissions"],
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
      const { id,
        username,
        email: userEmail,
        role } = findUser

      const permissions = findUser.permissions
      //
      const groupedData = permissions.reduce((grouped, item) => {
        const api = item.api;

        if (!grouped[api]) {
          grouped[api] = [];
        }
        grouped[api].push(item);

        return grouped;
      }, {});

      // Convert the grouped object back to an array
      const groupedArray = Object.entries(groupedData).map(([api, items]) => ({
        api,
        items,
      }));

      groupedArray.sort((a, b) => a.api.localeCompare(b.api));
      //

      return res.status(200).send({
        data: {
          jwt: token,
          user: { id, username, email: userEmail, role },
          permissions: groupedArray
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(errorResponse({ status: 500, message: error.message, }));
    }
  },
  async staffRegister(req, res) {
    const transaction = await req.db.transaction();
    try {
      //get details from body
      const sequelize = req.db;
      const { username, password, email, permissions } = req.body;

      //check if any user exists with username or email
      const user = await sequelize.models.User.findOne({
        where: { [Op.or]: [{ username: username }, { email }] },
      });

      if (user) {
        const matching_value = Object.entries(user.dataValues).find(
          ([key, value]) => value === username || value === email
        );
        return res.status(400).send(
          errorResponse({
            message: `User Already Exists with the ${matching_value[0]} ${matching_value[1]}`,
          })
        );
      }

      const hashedPassword = await hash(password);
      const staff_role_id = await getRoleId("Staff", sequelize);
      const registerStaff = await sequelize.models.User.create(
        {
          username,
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
            await sequelize.models.User_permission.findOrCreate({
              where: {
                PermissionId: it,
                UserId: registerStaff.id,
              },
              defaults: { PermissionId: it, UserId: registerStaff.id },
              transaction: transaction,
            });
        }
      }
      await adminActivityLog({ sequelize, event: activity_event.STAFF_REGISTERD, transaction: transaction, UserId: registerStaff.id })
      await transaction.commit();
      return res.status(200).send({ data: { username, email, role: "Staff" } });
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      return res.status(500).send(errorResponse({ status: 500, message: error.message, }));
    }
  },
  async staffListings(req = request, res = response) {
    try {
      const sequelize = req.db;
      const models = sequelize.models;
      const order = orderBy(req.query);
      const pagination = await getPagination(req.query.pagination);
      const users = await models.User.findAndCountAll({
        order: order,
        limit: pagination.limit,
        offset: pagination.offset,
        attributes: ["id", "username", "email"],
        include: [
          {
            model: models.Role,
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
      return res.status(500).send(errorResponse({ status: 500, message: error.message, }));
    }
  },
  async findOne(req = request, res = response) {
    try {
      const sequelize = req.db;
      const models = sequelize.models;
      const id = req.params.id
      const order = orderBy(req.query);
      const users = await models.User.findByPk(id, {
        order: order,
        attributes: ["id", "username", "email"],
        include: [
          {
            model: models.Role,
            as: "role",
            where: { name: { [Op.in]: ["Super_Admin", "Staff"] } },
            attributes: ["name"],
          },
          {
            model: models.Permission,
            as: "permissions",
            attributes: ["id", "api", "endpoint", "method", "handler",],
          },

        ],
      });
      return res.status(200).send({ data: users });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: error.message }));
    }
  },
  async updateStaff(req, res) {
    const t = await req.db.transaction();
    try {
      const sequelize = req.db;
      const id = req.params.id;

      const { username, email, permissions, delete_permissions } = req.body;
      const staff = await sequelize.models.User.findByPk(id, {
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
            status: 404, details: "staff id seems to be invalid"
          })
        );
      }
      await staff.update({ username, email }, { where: { id: id }, transaction: t })
      //delete staff
      if (permissions.length > 0) {
        for (const it of permissions) {
          const registerUserPermissions =
            await sequelize.models.User_permission.findOrCreate({
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
        await sequelize.models.User_permission.destroy({
          where: {
            PermissionId: { [Op.in]: [...delete_permissions] },
            UserId: staff.id,
          },
        }, {
          transaction: t,
        })
      }
      await t.commit();
      return res.status(200).send({ message: "Staff Undated Successfully!" });
    } catch (err) {
      await t.rollback()
      console.log(err);
      return res.status(500).send(errorResponse({ message: err }));
    }
  },
  async updateAdmin(req, res) {
    const t = await req.db.transaction();
    try {
      const sequelize = req.db;
      const id = req.params.id;

      const { username, email, permissions, delete_permissions } = req.body;
      const Admin = await sequelize.models.User.findByPk(id, {
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
            status: 404, details: "Admin id seems to be invalid"
          })
        );
      }
      await Admin.update({ username, email }, { where: { id: id }, transaction: t })
      await t.commit();
      return res.status(200).send({ message: "Admin Undated Successfully!" });
    } catch (err) {
      await t.rollback()
      console.log(err);
      return res.status(500).send(errorResponse({ message: err.message, status: 500 }));
    }
  },
  async deleteStaff(req, res) {
    try {
      const sequelize = req.db;
      const id = req.params.id;
      //get staff
      const staff = await sequelize.models.User.findByPk(id, {
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
  },
  async search(req, res) {
    try {
      const sequelize = req.db;
      const query = req.query;
      const qs = query.qs;
      const pagination = await getPagination(query.pagination);
      const order = orderBy(query);
      const users = await sequelize.models.User.findAndCountAll({
        offset: pagination.offset,
        limit: pagination.limit,
        order: order,
        attributes: {
          exclude: ["password", "port", "database", "host", "db_username"],
        },
        where: {
          [Op.or]: [
            {
              username: { [Op.iLike]: `%${qs}%` },
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
  },
};