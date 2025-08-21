// services/emailService.js

const nodemailer = require("nodemailer");

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "multitenant.socialseller@gmail.com",
    pass: "jefb xrpj zqpc ztyh",
  },
});

const mailSender = ({ to, subject, html }) => {
  //console.log("entered mailSender")
  const details = {
    from: "narayan.socialseller@gmail.com",
    to: to,
    subject: subject,
    html: html,
  };
  return mailTransporter.sendMail(details);
  // return true
};

module.exports = {
  mailSender,
};
