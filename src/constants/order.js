const payment_modes = {
  prepaid: "PREPAID",
  cod: "COD",
  wallet: "WALLET",
};

const order_status = {
  new: "NEW",
  accepted: "ACCEPTED",
  declined: "DECLINED",
  processing: "PROCESSING",
  intransit: "INTRANSIT",
  out_for_delivery: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
  completed: "COMPLETED",
  payout_done: "PAYOUT_DONE",
  rto: "RTO",
  return_request: "RETURN_REQUEST",
  return_accepted: "RETURN_ACCEPTED",
  return_declined: "RETURN_DECLINED",
  return_received: "RETURN_RECEIVED",
  return_pending: "RETURN_PENDING",
};

const order_status_shiprocket = {
  "IN TRANSIT": "INTRANSIT",
  "OUT FOR DELIVERY": "OUT_FOR_DELIVERY",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  Completed: "COMPLETED",
  return_declined: "RETURN_DECLINED",
  "RETURN RECEIVED": "RETURN_RECEIVED",
  "RETURN PENDING": "RETURN_PENDING",
};

module.exports = {
  payment_modes: payment_modes,
  order_status: order_status,
  order_status_shiprocket: order_status_shiprocket,
};
