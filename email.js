var nodemailer = require('nodemailer');
require("dotenv").config()

const emailPassword = process.env['emailPassword']

function _sendEmail(sendTo, text) {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'isb271@students.needham.k12.ma.us',
      pass: emailPassword
    }
  });

  var mailOptions = {
    from: 'isb271@students.needham.k12.ma.us',
    to: sendTo,
    subject: 'Sending Email using Node.js',
    text: text
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {
  sendEmail: _sendEmail,
};