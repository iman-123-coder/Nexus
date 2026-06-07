const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    await resend.emails.send({
      from: 'Nexus Platform <onboarding@resend.dev>',
      to: email,
      subject: 'Your Nexus OTP',
      html: `<h2>Your OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

const sendMeetingEmail = async (email, details) => {
  try {
    await resend.emails.send({
      from: 'Nexus Platform <onboarding@resend.dev>',
      to: email,
      subject: `Meeting Update: ${details.title}`,
      html: `<h2>${details.title}</h2><p>Status: ${details.status}</p><p>Date: ${details.date}</p>`
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendOTPEmail, sendMeetingEmail };