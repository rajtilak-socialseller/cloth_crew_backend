// Helper function to calculate total amount
const moment = require("moment-timezone");
const ExcelJS = require("exceljs");
const calculateAmount = (
  bookingDate,
  expireDate,
  amountPerDay,
  isFirstBooking
) => {
  const diffTime = new Date(expireDate) - new Date(bookingDate);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const chargeableDays = isFirstBooking
    ? Math.max(totalDays - 3, 0)
    : totalDays;
  return chargeableDays * amountPerDay;
};

// Book a Product
exports.bookProduct = async (req, res) => {
  try {
    const sequelize = req.db;

    const { userId, productId, productQuantity, booking_price, variantId } =
      req.body;

    const bookingDate = new Date();
    const amountPerDay = Number(booking_price) * Number(productQuantity) || 0;

    // Check if user exists
    const user = await sequelize.models.Store_user.findByPk(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.wallet_balance >= -500 || user.wallet_balance <= 500) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance for booking.",
      });
    }

    // Check if this is the user's first booking
    const previousBooking = await sequelize.models.Booking.findOne({
      where: { userId },
      order: [["bookingDate", "DESC"]],
    });

    const isFirstBooking = !previousBooking;

    const expireDate = new Date(bookingDate);

    // if (isFirstBooking) {
    // First time: 3-day free trial
    expireDate.setDate(expireDate.getDate() + 3);
    // } else if (previousBooking.expireDate > new Date()) {
    // Still in trial period → extend it
    //   expireDate.setTime(previousBooking.expireDate.getTime());
    // } else {
    //   // Trial expired → charges start immediately
    //   expireDate.setTime(bookingDate.getTime());
    // }

    const totalAmount = calculateAmount(
      bookingDate,
      expireDate,
      amountPerDay,
      isFirstBooking
    );

    const booking = await sequelize.models.Booking.create({
      userId,
      productId,
      bookingDate,
      bookingTime: moment().tz("Asia/Kolkata").format("HH:mm:ss"),
      expireDate,
      productQuantity,
      currentQuantity: productQuantity,
      amountPerDay,
      totalAmount,
      variantId,
    });

    await sequelize.models.Variant.decrement("quantity", {
      by: productQuantity,
      where: { ProductId: productId },
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error("Error booking product:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const sequelize = req.db;

    const { userId } = req.params;

    const user = await sequelize.models.Store_user.findByPk(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const bookings = await sequelize.models.Booking.findAll({
      where: { userId },
      include: [
        {
          model: sequelize.models.Store_user,
          as: "store_user",
          attributes: ["name", "email"],
        },
        {
          model: sequelize.models.Product,
          as: "product",
          attributes: ["name", "ThumbnailId"],
          include: [
            {
              model: sequelize.models.Media,
              as: "thumbnail",
              attributes: ["id", "url"],
            },
          ],
        },
        {
          model: sequelize.models.Variant,
          as: "variant",
          attributes: ["name", "price", "quantity"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    if (!bookings.length)
      return res
        .status(404)
        .json({ success: false, message: "No bookings found" });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const sequelize = req.db;
    const { bookingId } = req.params;

    const booking = await sequelize.models.Booking.findByPk(bookingId);
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    if (booking.bookingCancellation)
      return res
        .status(400)
        .json({ success: false, message: "Booking already canceled" });

    booking.bookingCancellation = true;
    booking.bookingCancellationDateTime = new Date();
    await booking.save();

    // Restore product quantity in inventory
    const variantIncrement = await sequelize.models.Variant.increment(
      "quantity",
      {
        by: booking.productQuantity,
        where: { ProductId: booking.productId },
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking canceled successfully",
      booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getBookingById = async (req, res) => {
  try {
    const sequelize = req.db;
    const { userId } = req.params;

    const { Booking, Store_user, Product, Variant } = sequelize.models;

    const bookings = await Booking.findAll({
      where: { userId },
      attributes: [
        "id",
        "userId",
        "productId",
        "variantId",
        "bookingDate",
        "expireDate",
        "productQuantity",
        "currentQuantity",
        "amountPerDay",
        "totalAmount",
        "bookingCancellation",
      ],
      include: [
        {
          model: Store_user,
          as: "store_user",
          attributes: ["name", "email"],
        },
        {
          model: Product,
          as: "product",
          attributes: ["name", "description"],
        },
        {
          model: Variant,
          as: "variant",
          attributes: ["name", "price"],
        },
      ],
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: "No bookings found for this user." });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Bookings");

    worksheet.columns = [
      { header: "Booking ID", key: "id", width: 10 },
      { header: "User Name", key: "userName", width: 20 },
      { header: "User Email", key: "userEmail", width: 25 },
      { header: "Product Name", key: "productName", width: 25 },
      { header: "Variant Name", key: "variantName", width: 20 },
      { header: "Variant Price", key: "variantPrice", width: 15 },
      { header: "Booking Date", key: "bookingDate", width: 20 },
      { header: "Expire Date", key: "expireDate", width: 20 },
      { header: "Quantity", key: "productQuantity", width: 10 },
      { header: "Current Quantity", key: "currentQuantity", width: 15 },
      { header: "Amount/Day", key: "amountPerDay", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Is Cancelled", key: "bookingCancellation", width: 12 },
    ];

    bookings.forEach(booking => {
      worksheet.addRow({
        id: booking.id,
        userName: booking.store_user?.name || "",
        userEmail: booking.store_user?.email || "",
        productName: booking.product?.name || "",
        variantName: booking.variant?.name || "",
        variantPrice: booking.variant?.price || "",
        bookingDate: booking.bookingDate,
        expireDate: booking.expireDate,
        productQuantity: booking.productQuantity,
        currentQuantity: booking.currentQuantity,
        amountPerDay: booking.amountPerDay,
        totalAmount: booking.totalAmount,
        bookingCancellation: booking.bookingCancellation ? "Yes" : "No",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=booking_user_${userId}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


