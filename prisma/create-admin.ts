// Script tạo tài khoản admin.
// Có 2 cách chạy:
// 1) Qua biến môi trường (dùng cho Railway, tự chạy lúc start, không cần Console):
//    ADMIN_EMAIL=admin@gmail.com ADMIN_PASSWORD=MatKhau123 ADMIN_NAME=Admin tsx prisma/create-admin.ts
// 2) Qua tham số dòng lệnh (chạy thủ công ở local hoặc Console):
//    tsx prisma/create-admin.ts --email admin@example.com --password yourpassword --name "Admin"

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");
  const passIdx = args.indexOf("--password");
  const nameIdx = args.indexOf("--name");

  // Ưu tiên tham số dòng lệnh, fallback về biến môi trường
  const email = (emailIdx !== -1 ? args[emailIdx + 1] : null) || process.env.ADMIN_EMAIL || null;
  const password = (passIdx !== -1 ? args[passIdx + 1] : null) || process.env.ADMIN_PASSWORD || null;
  const name = (nameIdx !== -1 ? args[nameIdx + 1] : null) || process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.log("ℹ️  Bỏ qua tạo admin: chưa cấu hình ADMIN_EMAIL / ADMIN_PASSWORD.");
    return; // Không exit(1) để không làm fail quá trình start nếu không cấu hình
  }

  if (password.length < 8) {
    console.error("⚠️  ADMIN_PASSWORD phải có ít nhất 8 ký tự. Bỏ qua tạo admin.");
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing && existing.password) {
    console.log(`ℹ️  Tài khoản admin "${normalizedEmail}" đã tồn tại và đã có mật khẩu. Bỏ qua.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashed, role: "admin", name, emailVerified: new Date() },
    });
    console.log(`✅ Đã cập nhật tài khoản admin: ${normalizedEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
        name,
        role: "admin",
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Đã tạo tài khoản admin: ${normalizedEmail}`);
  }
}

main()
  .catch((e) => { console.error("Lỗi tạo admin:", e); })
  .finally(() => prisma.$disconnect());
