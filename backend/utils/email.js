const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: `"Nexus Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Nexus OTP',
      html: `<h2>Your OTP: <strong>${otp}</strong></h2><p>Valid 10 minutes.</p>`
    });
  } catch (err) {
    console.error('Email error:', err.message);
    throw err;
  }
};

const sendMeetingEmail = async (email, details) => {
  console.log('Meeting email:', email, details);
};

module.exports = { sendOTPEmail, sendMeetingEmail };