const cron = require("node-cron");
const db = require("../../../../config/db.config");
const { Sequelize, Op } = require("sequelize");

const {
  Booking,
  Store_user,
  Variant,
  sequelize,
  Wallet,
  Transaction,
} = require("../../../models");
const { createTransaction } = require("../../../services/createTrnx");

const processBookingCharges = async () => {
  try {
    const activeBookings = await Booking.findAll({
      where: {
        bookingCancellation: false,
        expireDate: {
          [Op.lt]: new Date(),
        },
      },
    });

    for (const booking of activeBookings) {
      const transaction = await sequelize.transaction();

      try {
        const storeUser = await Store_user.findByPk(booking.userId, {
          transaction,
        });

        if (!storeUser) {
          await transaction.rollback();
          continue;
        }

        if (booking.expireDate <= new Date()) {
          // ❗ Allow negative wallet balance
          const amountPerDay =
            Number(booking.booking_price) * Number(booking.currentQuantity) ||
            0;
          storeUser.wallet_balance -= amountPerDay;
          booking.totalAmount += amountPerDay;

          await storeUser.save({ transaction });
          await booking.save({ transaction });

          await sequelize.models.Wallet.create(
            {
              StoreUserId: booking.userId,
              amount: booking.amountPerDay,
              transaction_type: "CREDIT",
              remark: "Booking Charges Paid (Allow Negative Balance)",
            },
            { transaction }
          );

          await createTransaction({
            sequelize,
            purpose: "PURCHASE",
            mode: "WALLET",
            amount: booking.amountPerDay,
            StoreUserId: booking.userId,
            transaction,
            txn_type: "CREDIT",
          });

          await transaction.commit();

          console.log(`Charged booking for user ${booking.userId}`);
        }
      } catch (err) {
        await transaction.rollback();
        console.error(
          `Error processing booking for user ${booking.userId}:`,
          err.message
        );
      }
    }

    console.log("Daily booking charge cron job completed.");
  } catch (error) {
    console.error("Error in booking charge cron job:", error.message);
  }
};

// Schedule cron job every 10 seconds

cron.schedule("0 0 * * *", processBookingCharges);

// cron.schedule("*/10 * * * * *", processBookingCharges);

module.exports = { processBookingCharges };
