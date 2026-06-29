import nodemailer from "nodemailer";

// Tạo transporter từ biến môi trường
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Gửi email mời tạo password
export async function sendInviteEmail({
  to,
  name,
  token,
  baseUrl,
}: {
  to: string;
  name?: string;
  token: string;
  baseUrl: string;
}) {
  const setupLink = `${baseUrl}/auth/setup-password?token=${token}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Project Pipeline" <${process.env.SMTP_USER}>`,
    to,
    subject: "Tạo mật khẩu cho tài khoản Project Pipeline",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b;margin-bottom:8px">Chào ${name || to}!</h2>
        <p style="color:#475569;line-height:1.6">
          Tài khoản của bạn đã được tạo trên <strong>Project Pipeline</strong>.
          Nhấn vào nút bên dưới để đặt mật khẩu và bắt đầu sử dụng.
        </p>
        <div style="margin:28px 0">
          <a href="${setupLink}"
            style="background:#1e293b;color:#fff;padding:12px 24px;border-radius:6px;
                   text-decoration:none;font-weight:500;display:inline-block">
            Tạo mật khẩu
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px">
          Link có hiệu lực trong <strong>24 giờ</strong>.<br>
          Nếu bạn không yêu cầu tạo tài khoản, hãy bỏ qua email này.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#cbd5e1;font-size:12px">
          Project Pipeline · Quản lý dự án & khách hàng
        </p>
      </div>
    `,
  });
}

// Gửi email reset password
export async function sendResetPasswordEmail({
  to,
  token,
  baseUrl,
}: {
  to: string;
  token: string;
  baseUrl: string;
}) {
  const resetLink = `${baseUrl}/auth/setup-password?token=${token}&reset=1`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Project Pipeline" <${process.env.SMTP_USER}>`,
    to,
    subject: "Đặt lại mật khẩu Project Pipeline",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b;margin-bottom:8px">Đặt lại mật khẩu</h2>
        <p style="color:#475569;line-height:1.6">
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${to}</strong>.
        </p>
        <div style="margin:28px 0">
          <a href="${resetLink}"
            style="background:#1e293b;color:#fff;padding:12px 24px;border-radius:6px;
                   text-decoration:none;font-weight:500;display:inline-block">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px">
          Link có hiệu lực trong <strong>1 giờ</strong>.<br>
          Nếu bạn không yêu cầu đặt lại, hãy bỏ qua email này.
        </p>
      </div>
    `,
  });
}
