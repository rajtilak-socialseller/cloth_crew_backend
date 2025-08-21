const {
  bookProduct,
  cancelBooking,
  getBookings,
  getBookingById,
} = require("../controllers/productBooking");

const router = require("express").Router();

module.exports = (app) => {
  router.post("/book", bookProduct); // Book a product

  router.get("/getBookings/:userId", getBookings);

  router.get("/getBookingStock/:userId", getBookingById);

  router.post("/cancel/:bookingId", cancelBooking); // Cancel a booking

  // Get all bookings for a user

  app.use("/api/productBooking", router);
};
