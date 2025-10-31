import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendMailServices = async (sendEmail, subject, template, attachments = []) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT, 10),
      secure: process.env.MAIL_SECURE === "true",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Scada Mail Services" <${process.env.MAIL_ADDRESS}>`,
      to: sendEmail,
      subject: subject || "No Subject Provided",
      html: template || "<p>No content provided</p>",
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Mail gönderim hatası.");
  }
};

export default sendMailServices;
