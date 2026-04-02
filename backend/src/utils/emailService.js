const nodemailer = require('nodemailer');

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendApplicationEmail = async (userEmail, jobTitle, companyName, status) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: `Application Update: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">JobMatch Pro</h2>
        <h3>Application Status Update</h3>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong style="color: #10b981;">${status}</strong>.</p>
        <p>Login to your dashboard for more details.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">JobMatch Pro - Find your dream job</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}`);
  } catch (error) {
    console.error('Email error:', error);
  }
};

module.exports = { sendApplicationEmail };