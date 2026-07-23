const PasswordReset_Verification_Email = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your VertexCode password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }

    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }

    .header {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: #ffffff;
      padding: 24px;
      text-align: center;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .content {
      padding: 28px;
      color: #374151;
      line-height: 1.7;
      font-size: 15px;
    }

    .otp-box {
      margin: 24px 0;
      padding: 16px;
      text-align: center;
      font-size: 26px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #4f46e5;
      background-color: #eef2ff;
      border: 2px dashed #4f46e5;
      border-radius: 8px;
    }

    .note {
      font-size: 13px;
      color: #6b7280;
      margin-top: 12px;
    }

    .footer {
      background-color: #f9fafb;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }

    .brand {
      font-weight: 900;
      color: #4f46e5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      VertexCode
    </div>

    <div class="content">
      <p>Hello 👋,</p>

      <p>
        We received a request to reset your <span class="brand">VertexCode</span> password.
      </p>

      <p>
        Please use the following code to reset your password:
      </p>

      <div class="otp-box">
        ${otp}
      </div>

      <p class="note">
        ⏳ This code is valid for <b>10 minutes</b>.<br />
        Please do not share this code with anyone.
      </p>

      <p class="note">
        If you didn’t request a password reset, you can safely ignore this email.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} vertexcode • All rights reserved
    </div>
  </div>
</body>
</html>
`;

module.exports = PasswordReset_Verification_Email;
