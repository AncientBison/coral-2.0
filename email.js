var nodemailer = require('nodemailer');
require("dotenv").config()
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL,
      accessToken,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN
    }
  });

  return transporter;
};

//emailOptions - who sends what to whom
const sendEmail = async (emailOptions) => {
  let emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions);
};

// let emailPassword;
// let emailAccount;

// function sendEmail(sendTo, text) {
//   console.log(emailAccount);
//   console.log(emailPassword);

//   const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//       type: "OAuth2",
//       user: 'irma44@ethereal.email',
//       pass: 'YS78Pw7tTpWQZCyUNk'
//     }
//   });

//   var mailOptions = {
//     from: emailAccount,
//     to: sendTo,
//     subject: 'Sending Email using Node.js',
//     text: text
//   };

//   transporter.sendMail(mailOptions, function(error, info) {
//     console.log(info);
//     if (error) {
//       console.log(error);
//     } else {
//       console.log('Email sent: ' + info.response);
//     }
//   });
// }

// function setEmailAccount(newAccount) {
//   emailAccount = newAccount;
// }

// function setEmailPassword(newPassword) {
//   emailPassword = newPassword;
// }

module.exports = {
  // sendEmail: sendEmail,
  // setEmailAccount: setEmailAccount, 
  // setEmailPassword: setEmailPassword
  sendEmail: sendEmail
};