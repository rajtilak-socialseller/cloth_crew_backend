const dbCache = require("../../../utils/dbCache");
const { Sequelize, where } = require("sequelize");
const createDB = require("../services/createDB");
const relation = require("../../../utils/relation");
const jwt = require("../../../services/jwt");
const { hash, compare } = require("../../../services/bcrypt");
const { Op } = require("sequelize");
const { tokenError, errorResponse, } = require("../../../services/errorResponse");
const { getPagination, getMeta } = require("../../../services/pagination");
const orderBy = require("../../../services/orderBy");
const { OAuth2Client } = require("google-auth-library");
const dbConnection = require("../../../utils/dbConnection");
const GOOGLE_CLIENT_ID = "855848332125-ha16ukjhnji5b2rtlpergsl66koc75j6.apps.googleusercontent.com";
const client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: "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",
  redirectUri: "http://localhost:4500/api/users/auth/google",
});

const apiGenerator = require("../../../utils/apiGenerator");
const roles = require("../../../constants/store_user");
const { getDate } = require("../../../services/date");
const personalToken = require("../services/personalToken");
const { tenant_metric_fields } = require("../../../constants/tenant_metric");
const tenantMetric = require("../../../services/tenantMetric");
const dbConfig = require("../../../../config/db.config");
const getRoleId = require("../../../services/getRoleId");
const createSubs = require("../services/createSubs");
const dataInserter = require("../../../utils/dataInserter");
const storeUrlGenerator = require("../../../services/storeUrlGenerator");
const { storeCreateNotify, subscriptionExpireNotify } = require("../../../services/notification");
const excelExport = require("../../../services/excelExport");
const store_types = require("../../../constants/store_types");
const { publishPhoneNumbers } = require("../../../utils/redisQueue");

module.exports = {

  async create(req, res) {
    const t = await req.db.transaction();
    var ins_t;
    const dbConn = new Sequelize(dbConfig);
    try {
      const sequelize = req.db;
      //console.log("After Inititalizeing Seq");
      let { email, password, subdomain, store_type } = req.body;
      const username = req.body.username.toLowerCase();
      const findUser = await sequelize.models.User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email },
            { subdomain },
            { database: username },
          ],
        },
      });

      if (findUser) {
        const matching_value = Object.entries(findUser.dataValues).find(
          ([key, value]) => value === email || value === username || value === subdomain
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
      const personal_token = personalToken({
        tenant_name: subdomain,
        username: username,
      });

      const admin_role_id = await getRoleId("Admin", sequelize);
      const createUser = await sequelize.models.User.create(
        {
          username: username,
          email: email,
          password: password,
          port: 5432,
          database: username,
          host: "localhost",
          db_username: username,
          subdomain: subdomain,
          store_type: store_type,
          personal_token: personal_token,
          RoleId: admin_role_id,
          phone: req.body.calling_number,
          country_code: req.body.country_code
        },
        {
          raw: true,
          transaction: t
        }
      );

      //create Tenant_metric
      await sequelize.models.Tenant_metric.create({ UserId: createUser.id, total_site_visits: 0 }, { transaction: t });

      // creating user db
      var resultDB = await createDB({
        connection: dbConn,
        username,
        password,
      });
      if (!resultDB) {
        await t.rollback();
        return res.status(500).send({
          error: {
            status: 500,
            name: "Server Error",
            message: "DB not created",
            details: "",
          },
        });
      }
      // creating sequelize instance on the basis of user details
      const tenantConfig = {
        dialect: dbConfig.dialect,
        host: "localhost",
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: username,
        pool: dbConfig.pool,
        logging: dbConfig.logging,
      };
      // db to store instance
      const db = {};

      // if (resultDB) {
      try {
        const instance_sequelize = new Sequelize(tenantConfig);
        db.instance_sequelize = await relation(instance_sequelize);
        dbCache.set(subdomain, db.instance_sequelize);

        ins_t = await db.instance_sequelize.transaction(); // to use transaction
        await db.instance_sequelize.sync({ alter: true });
        await tenantMetric({
          subdomain,
          field_name: tenant_metric_fields.total_users,
        });

        const permissionIds = await apiGenerator(db.instance_sequelize);

        let roles_data = Object.values(roles);
        const storeUserRoles = await db.instance_sequelize.models.Role.bulkCreate(roles_data, {
          transaction: ins_t,
        });

        let admin_role_id = storeUserRoles.find((r) => r.dataValues.name.toLowerCase() === "admin").dataValues.id;

        const storeUser = await db.instance_sequelize.models.Store_user.create({
          name: username,
          email: email,
          password: hashedPassword,
          RoleId: admin_role_id,
          phone: req.body.calling_number,
          country_code: req.body.country_code,
          raw: true
        }, { transaction: ins_t });


        // alloting serversubscription  to user 
        await createSubs({ sequelize, PlanId: req.body.PlanId, store_sequelize: db.instance_sequelize, StoreUserId: storeUser.id, transaction: t, UserId: createUser.dataValues.id, store_transaction: ins_t })
        const RolePermissionArray = permissionIds.map((item) => {
          return { RoleId: admin_role_id, PermissionId: item }
        })

        await db.instance_sequelize.models.Role_permission.bulkCreate(RolePermissionArray, { transaction: ins_t })
        await dataInserter({ sequelize: instance_sequelize, body: req.body, personal_token: personal_token, transaction: ins_t })
        const data = {
          containsImage: true,
          hasButton: true,
          template: "store_create",
          phoneNumber: req.body.whatsapp_number,
          body: [subdomain],
          image: "https://mtt-s3.s3.ap-south-1.amazonaws.com/WhatsApp%20Image%202024-07-09%20at%203.54.46%20PM.jpeg",
          buttonValues: { 0: [`https://${subdomain}.socialseller.in`], 1: [`https://${subdomain}.dashboard.socialseller.in`] }
        };
        storeCreateNotify(data, req.body.country_code)
        await Promise.all([t.commit(), ins_t.commit()]);
        return res.status(200).send({
          message: {
            status: 200,
            name: "User Created!",
            message: "Congratulations! your account has been created",
            details: "",
            links: storeUrlGenerator(subdomain)
          },
        });
      } catch (err) {
        console.log(err);
        await dbConn.query(`DROP DATABASE ${req.body.username}`);
        await dbConn.query(`DROP USER ${req.body.username}`);
        const rollback = await Promise.all([t.rollback(), ins_t.rollback()]);

        return res.status(500).send({
          error: {
            status: 500,
            name: "Internal Server Error!",
            message:
              "Some error occurred While Creating Store! Please Retry Again",
            details: "",
          },
        });
      }
    } catch (error) {
      //console.log(error)
      return res.status(500).send({
        message:
          "some error occured while creating the account , all the steps are rollbacked , please start creating again",
      });
    }
  },

  async find(req, res) {
    try {
      const sequelize = req.db;
      const query = req.query;
      const pagination = await getPagination(query.pagination);
      const order = orderBy(query);
      const metric = Object.keys(query.orderBy)[0] === "hcr" ? true : false;
      const whereClause = {};
      let subsCluase = {};
      if (query.storeType && store_types.includes(query.storeType)) {
        whereClause.store_type = query.storeType;
      }
      if (query.status) {
        whereClause.is_active = (query.status === "ACTIVE" ? true : false)
      }
      if (query.domain) {
        whereClause.customDomain = (query.domain === "Custom" ? true : false)
      }
      if (query.subscription) {
        subsCluase = (query.subscription === "ACTIVE" ? {
          model: sequelize.models.Server_subscription,
          as: "subscriptions",
          where: {
            status: "ACTIVE"
          },
          required: true
        } : {
          model: sequelize.models.Server_subscription,
          as: "subscriptions",
          where: {
            status: "EXPIRED"
          },
          required: true
        })
      }

      console.log(metric)

      const users = await sequelize.models.User.findAndCountAll({
        distinct: true,
        offset: pagination.offset,
        limit: pagination.limit,
        where: whereClause,
        order: (metric ? [[{ model: sequelize.models.Tenant_metric, as: "tenant_metric" }, 'total_site_visits', 'DESC']] : order),
        attributes: {
          exclude: ["password", "port", "database", "host", "db_username"],
        },
        include: [
          {
            model: sequelize.models.Role,
            as: "role",
            where: { name: "Admin" },
            attributes: ["name"],
          },
          {
            model: sequelize.models.Tenant_metric,
            as: "tenant_metric",
          },
          ...(query.subscription ? [subsCluase] : [
            {
              model: sequelize.models.Server_subscription,
              as: "subscriptions",
              order: ["id", "desc"]
            }
          ]),
        ],
        subQuery: false,
      });
      const meta = await getMeta(pagination, users.count);
      return res.status(200).send({ data: users.rows, meta });
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
  },

  async findOne(req, res) {
    try {
      const sequelize = req.db;
      const { id } = req.params;
      const user = await sequelize.models.User.findByPk(id, {
        attributes: {
          exclude: ["password", "port", "database", "host", "db_username"],
        },
        include: [
          {
            model: sequelize.models.Server_subscription, as: "subscriptions",
            where: { is_paid: true, status: "ACTIVE" },
            order: [["id", "asc"]],
            attributes: ["amount", "purchaseType", "valid_to", "is_paid", "status", "PlanId",],
            limit: 1
          },
          'tenant_metric'
        ]
      });
      if (user) {
        return res.status(200).send({ data: user });
      } else {
        return res.status(404).send(
          errorResponse({
            status: 404,
            message: "User Not Found!",
            details: "User Id seems to be invalid please do check",
          })
        );
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },

  async update(req, res) {
    const t = await req.db.transaction();
    try {
      const sequelize = req.db;
      const body = req.body;
      const { id } = req.params;
      const getUser = await sequelize.models.User.findByPk(id, { raw: true });
      if (!getUser)
        return res.status(404).send(
          errorResponse({
            status: 404,
            message: "User not found!",
            details: "User id seems to be invalid!",
          })
        );
      // const update store_type on store global 
      const [rows_count, [user]] = await sequelize.models.User.update(body, {
        where: { id },
        transaction: t,
        returning: true, raw: true
      });
      const connection = await dbConnection(getUser.subdomain)
      const inst = await connection.transaction();
      if (body.store_type) {
        const store_global = await connection.models.Store_setting.findOne({
          raw: true
        });
        await connection.models.Store_setting.update({
          store_type: req.body.store_type
        }, {
          where: { id: store_global.id },
          transaction: inst
        })
      }
      if (body.hasOwnProperty("PlanId") && body.PlanId) {

        const storeUser = await connection.models.Store_user.findOne({
          where: {
            email: req.body.email,
          },
          raw: true
        });

        await createSubs({ sequelize, PlanId: body.PlanId, store_sequelize: connection, store_transaction: inst, StoreUserId: storeUser.id, transaction: t, UserId: getUser.id })
      }
      await t.commit()
      await inst.commit()
      return res.status(200).send({ message: "User Updated Successfull!", });
    } catch (error) {
      console.log(error);
      await t.rollback()
      await inst.rollback()
      return res.status(500).send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
    }
  },

  async delete(req, res) {
    try {
      const sequelize = req.db;
      const { id } = req.params;
      const getUser = await sequelize.models.User.findByPk(id);
      if (!getUser)
        return res.status(400).send(
          errorResponse({
            status: 404,
            message: "User not found!",
            details: "User id seems to be invalid!",
          })
        );
      const user = await sequelize.models.User.destroy({ where: { id } });
      return res.status(200).send({ message: "User Delete Successully!" });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const sequelize = req.db;
      const findUser = await sequelize.models.User.findOne({
        where: { email },
        attributes: {
          exclude: ["port", "database", "host", "db_username"],
        },
        raw: true
      });
      if (!findUser) {
        return res
          .status(400)
          .send(errorResponse({ message: "Invalid User Credentials!" }));
      }
      const isMatched = await compare(password, findUser.password);
      if (!isMatched) {
        return res
          .status(400)
          .send(errorResponse({ message: "Invalid User Credentials!" }));
      }
      const token = jwt.issue({ id: findUser.id });

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

  async googleAuth(req, res) {
    try {
      // //console.log({ verified: verifyGoogleToken(req.body.credential) });
      //console.log("inside signp");
      //console.log(req.query);
      const query = req.query;

      const { tokens } = await client.getToken(query.code);
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const sequelize = dbCache.get("main_instance");
      const payload = ticket.getPayload();

      if (payload.email_verified) {
        const isUserExists = await sequelize.models.User.findOne({
          where: { email: payload.email },
        });
        //console.log(isUserExists);
        if (isUserExists) {
          const token = jwt.issue({ id: isUserExists.id });
          return res
            .status(200)
            .redirect(`http://localhost:3000/welcome?jwt=${token}`);
        } else {
          dbCache.set(payload.email, payload, "300");
          return res
            .status(200)
            .redirect(`http://localhost:3000/signup?key=${payload.email}`);
        }
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },

  async getMe(req, res) {
    try {
      const sequelize = req.db;
      const token = jwt.verify(req);
      if (token.error) {
        return res.status(401).send(tokenError(token));
      }
      const findUser = await sequelize.models.User.findByPk(token.id, {
        attributes: {
          exclude: ["password", "port", "database", "host", "db_username"],
        },
        include: [
          {
            model: sequelize.models.Server_subscription,
            as: "subscriptions",
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
          },
        ],
      });

      // for development only without rbac
      if (!findUser) {
        return res.status(400).send(
          errorResponse({
            message: "Invalid Data!",
            details: "Invalid payload data found in token!",
          })
        );
      }

      if (findUser.subscriptions.length > 0) {
        for (const subscription of findUser.subscriptions) {
          await sequelize.models.Subscription.update(
            { status: "EXPIRED" },
            { where: { id: subscription.id } }
          );
        }
      }

      return res.status(200).send({ data: findUser });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },

  async supportTickets(req, res) {
    try {
      const sequelize = req.db;
      const id = req.params.id;

      const query = await req.query;
      const pagination = await getPagination(query.pagination);
      const support_tickets =
        await sequelize.models.Support_ticket.findAndCountAll({
          where: { UserId: id },
          offset: pagination.offset,
          limit: pagination.limit,
        });
      const meta = await getMeta(pagination, support_tickets.count);

      return res.status(200).send({ data: support_tickets.rows, meta });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error", details: error.message }));
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
            {
              subdomain: { [Op.iLike]: `%${qs}%` },
            },
            {
              phone: { [Op.iLike]: `%${qs}%` },
            },
          ],
        },
        include: [
          {
            model: sequelize.models.Role,
            as: "role",
            where: { name: "Admin" },
            attributes: ["name"],
          },
          "tenant_metric",
          {
            model: sequelize.models.Server_subscription,
            as: "subscriptions",
            order: ["id", "desc"]
          }
        ]
      });
      const meta = await getMeta(pagination, users.count);
      return res.status(200).send({ data: users.rows, meta });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },

  async dashboard(req, res) {
    try {
      const token = jwt.verify(req);
      const mainDB = req.db;
      const user = await mainDB.models.User.findByPk(token.id);
      if (!user.subdomain) {
        return res.status(
          errorResponse({
            message: "You do not have any registered subdomain",
            status: 404,
          })
        );
      }
      const sequelize = await dbConnection(user.subdomain);
      const [products, leads, tags] = await Promise.all([
        sequelize.models.Product.count(),
        sequelize.models.Lead.count(),
        sequelize.models.Tag.count(),
      ]);

      return res.status(200).send({ products, leads, tags });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .send(errorResponse({ status: 500, message: "Internal server Error" }));
    }
  },

  async changeStatus(req, res) {
    try {
      const sequelize = req.db;
      const query = req.query;
      const { id } = req.params;
      if (!query.hasOwnProperty("active") || !["true", "false"].includes(query.active.toLowerCase())
      ) {
        return res.status(400).send(
          errorResponse({
            message: "Invalid query params",
            details: "Please select one from true or false with query active",
          })
        );
      }
      const user = await sequelize.models.User.findByPk(id);
      if (!user) {
        return res.status(400).send(
          errorResponse({
            message: "Tenant Not Found",
            details: "Tenant Id seems to be invalid",
          })
        );
      }
      const [rows_count, [updateUser]] = await sequelize.models.User.update({
        is_active: query.active.toLowerCase(),
      },
        {
          where: { id },
          returning: true,
        });
      return res.status(200).send({
        message: `Tenant with id ${id} and name ${user.subdomain} has been ${query.active == "true" ? "Activated" : "Inactivated"
          }`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
    }
  },

  async validationCheker(req, res) {
    try {
      const sequelize = req.db;
      const query = req.query;
      const whereClause = {};
      if (query.hasOwnProperty("subdomain")) {
        whereClause.subdomain = query.subdomain;
      }
      if (query.hasOwnProperty("phone")) {
        whereClause.phone = query.phone;
      }
      if (query.hasOwnProperty("username")) {
        whereClause.username = query.username;
      }
      if (query.hasOwnProperty("email")) {
        whereClause.email = query.email;
      }
      const isSubDomainExists = await sequelize.models.User.findOne({ where: whereClause })
      if (isSubDomainExists) {
        return res.status(409).send(errorResponse({
          status: 409,
          message: `${Object.keys(query)[0]} already exists`,
        }))
      }
      return res.status(200).send({ status: 200, message: `${Object.keys(query)[0]} available` })
    } catch (error) {
      console.log(error);
      return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
    }
  },

  async findMyAccount(req, res) {
    try {
      const sequelize = req.db;

      const isAccountExists = await sequelize.models.User.findOne({ where: { email: req.query.email } })
      if (!isAccountExists) {
        return res.status(409).send(errorResponse({
          status: 400,
          message: "No store found associated with provided email",
        }))
      }
      const links = storeUrlGenerator(isAccountExists.subdomain)
      return res.status(200).send({ status: 200, message: "Store found", links })
    } catch (error) {
      console.log(error);
      return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
    }
  },

  async exportToExcel(req, res) {
    try {
      const sequelize = req.db;
      const query = req.query;
      const body = req.body;
      const whereClause = {};
      if (body.items.length && Array.isArray(body.items)) {
        whereClause.id = { [Op.in]: body.items }
      }

      const role = await sequelize.models.Role.findOne({ where: { name: "Admin" } })
      const users = await sequelize.models.User.findAll({
        where: { ...whereClause, RoleId: role.id },
        attributes: ["username", "phone", "email", "subdomain", "store_type", "createdAt"],
        order: [[{ model: sequelize.models.Tenant_metric, as: "tenant_metric" }, 'total_site_visits', 'DESC']],
        include: ["tenant_metric"],
        raw: true
      });
      if (!users.length) {
        return res.status(400).send({ message: `No data found for last ${query.days}` })
      }

      const excelFile = await excelExport(users)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="output.xlsx"')
      return res.status(200).send(excelFile);
    } catch (error) {
      //console.log(error)
      return res.status(500).send(errorResponse({ status: 500, message: error.message, details: error }))
    }
  },

  async preRegistration(req, res) {
    try {
      const sequelize = req.db;
      const email = req.body.email;
      if (!email) {
        return res.status(400).send(errorResponse({ message: "invalid data", details: "please send email in req.body" }))
      }
      const isUserExists = await sequelize.models.Registration.findOne({ where: { email: email } })
      let data
      if (!isUserExists) {
        data = await sequelize.models.Registration.create(req.body)
      } else {
        data = await sequelize.models.Registration.update(req.body, { where: { email: email } })

      }
      return res.status(200).send({ data })
    } catch (error) {
      console.log(error);
      return res.status(500).send(errorResponse({ message: error.message, status: 500 }));
    }
  },

  async sendExpiredMessage(req, res) {
    try {
      const sequelize = req.db;


      const users = await sequelize.models.User.findAll({
        attributes: ["phone", "username", "subdomain"],
        include: [
          {
            model: sequelize.models.Role,
            as: "role",
            where: { name: "Admin" },
            attributes: ["name"],
          },
          {
            model: sequelize.models.Server_subscription,
            as: "subscriptions",
            where: {
              status: "ACTIVE"
            },
            attributes: ["status"]
            // required: true
          }
        ],
      });
      const filteredUsers = users.filter((user) => user.phone !== null)

      publishPhoneNumbers(filteredUsers)
      return res.status(200).send({ data: "message sent", filteredUsers });
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
  },
};
