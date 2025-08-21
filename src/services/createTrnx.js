const crypto = require("crypto");
const { tenant_metric_fields } = require("../constants/tenant_metric");
const tenantMetric = require("./tenantMetric");
const dbCache = require("../utils/dbCache");
const { mode } = require("../constants/transaction");

const generateTrnId = (prefix) => {
  const randomBytes = crypto.randomBytes(5); // Generate 5 random bytes
  const transactionId =
    (prefix || "WLT") + randomBytes.toString("hex").toUpperCase();
  return transactionId.substring(0, 13); // Take the first 10 characters
};

const remarkGenerator = ({ purpose, mode, amount, txn_type }) => {
  return `transaction of amount ${amount} has been ${txn_type} for purpose ${purpose} through mode ${mode}`;
};

exports.createTransaction = async ({
  sequelize,
  purpose,
  mode,
  amount,
  txn_type,
  StoreUserId,
  transaction,
}) => {
  try {
    let txn_id = generateTrnId("WLT");
    const remark = remarkGenerator({ purpose, mode, amount, txn_type });
    await sequelize.models.Transaction.create(
      {
        purpose,
        txn_id,
        txn_type,
        remark,
        mode,
        amount,
        StoreUserId,
      },
      { transaction }
    );
  } catch (error) {
    console.log(error);
  }
};

exports.adminTransaction = async ({ subdomain, purpose, mode, amount, txn_type, UserId, transaction, sequelize }) => {
  try {
    // let txn_id = generateTrnId("WLT");
    // let tenantId;

    // let main_instance;
    // if (UserId) {
    //   tenantId = UserId;
    //   main_instance = sequelize
    // } else {
    //   main_instance = await dbCache.get("main_instance")
    //   const tenant = await main_instance.models.User.findOne({ where: { subdomain } })
    //   tenantId = tenant.id
    // }
    // const remark = remarkGenerator({ purpose, mode, amount, txn_type });
    // await main_instance.models.Transaction.create(
    //   {
    //     purpose,
    //     txn_id,
    //     txn_type,
    //     remark,
    //     mode,
    //     amount,
    //     UserId: tenantId,
    //   },);
    return true
  } catch (error) {
    console.log(error);
  }
};
