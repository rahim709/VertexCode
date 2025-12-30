const nodemailer = require("nodemailer");
const VertexCode_Verification_Email  = require('../utils/emailTemplate');
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

const sendOTPEmail = async (toEmail, otp) => {
  try{
        const info = await transporter.sendMail({
        from: '"VertexCode" <vertexcodeapp@gmail.com>',
        to: toEmail,
        subject: "Verify your VertexCode account",
        html: VertexCode_Verification_Email(otp),
        });

    return info;
  }
  catch(err){
    console.error("Failed to send OTP email:", err.message);

    // IMPORTANT: propagate error to controller
    throw new Error("Unable to send verification email");
  }
};

module.exports = sendOTPEmail;
