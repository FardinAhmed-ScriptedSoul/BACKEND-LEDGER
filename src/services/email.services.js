const nodemailer = require('nodemailer');
const config = require('../config/config.js');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: config.EMAIL_USER,
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    refreshToken: config.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend-Ledger" <${config.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, userName) {
    const subject = "Welcome to Backend-Ledger!";
    const text = `Hi ${userName},\n\nThank you for registering at Backend-Ledger. We're excited to have you on board! If you have any questions or need assistance, feel free to reach out.\n\nBest regards,\nThe Backend-Ledger Team`;
    const html = `<p>Hi ${userName},</p><p>Thank you for registering at <strong>Backend-Ledger</strong>. We're excited to have you on board! If you have any questions or need assistance, feel free to reach out.</p><p>Best regards,<br>The Backend-Ledger Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendLogoutAllEmail(userEmail, userName) {
    const subject = "Security Alert: Logged out from all devices";
    const text = `Hi ${userName},\n\nThis is a security notification confirming that your account was recently logged out from all active devices. If this wasn't you, please change your password immediately.\n\nBest regards,\nThe Backend-Ledger Team`;
    const html = `
        <p>Hi ${userName},</p>
        <p>This is a security notification confirming that your account was recently <strong>logged out from all active devices</strong>.</p>
        <p style="color: #d9534f; font-weight: bold;">If you did not initiate this action, please change your account password immediately to secure your data.</p>
        <p>Best regards,<br>The Backend-Ledger Team</p>
    `;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendLogoutAllEmail 
};


