// utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, html, text }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false, // port 587 => secure = false
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw new Error("Không thể gửi email. Kiểm tra cấu hình Gmail SMTP.");
  }
}

module.exports = sendEmail;
