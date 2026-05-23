const nodemailer = require('nodemailer');
const config = require('../config/config.js');
const logger = require('../utils/logger.js');

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

// Verify the connection configuration unless the process is running under tests
if (config.NODE_ENV !== 'test') {
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Error connecting to email server', error);
    } else {
      logger.info('Email server is ready to send messages', { success });
    }
  });
}


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

    logger.info('Email sent', {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    });
  } catch (error) {
    logger.error('Error sending email', error);
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

async function sendTransactionEmail(userEmail, userName, amount, toAccount) {
  const subject = "Transaction Completed - Backend-Ledger";
  const text = `Hi ${userName},\n\nYour transfer of ${amount} units to account ${toAccount} has been completed successfully. If you did not authorize this transaction, please contact support immediately.\n\nBest regards,\nThe Backend-Ledger Team`;
  const html = `
    <p>Hi ${userName},</p>
    <p>Your transfer of <strong>${amount}</strong> units to account <strong>${toAccount}</strong> has been completed successfully.</p>
    <p>If you did not authorize this transaction, please contact support immediately.</p>
    <p>Best regards,<br>The Backend-Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailedEmail(userEmail,userName,amount,toAccount){
  const subject = "Transaction Failed - Backend-Ledger";
  const text = `Hi ${userName},\n\nWe're sorry but your transfer of ${amount} units to account ${toAccount} has failed. No funds were moved. Please try again or contact support if the problem persists.\n\nBest regards,\nThe Backend-Ledger Team`;
  const html = `
    <p>Hi ${userName},</p>
    <p>We're sorry but your transfer of <strong>${amount}</strong> units to account <strong>${toAccount}</strong> has <strong>failed</strong>. No funds were moved.</p>
    <p>Please try again, check your account status, or contact support if the problem persists.</p>
    <p>Best regards,<br>The Backend-Ledger Team</p>
  `;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendRegistrationEmail,
  sendLogoutAllEmail,
  sendTransactionEmail,
  sendTransactionFailedEmail,
};


