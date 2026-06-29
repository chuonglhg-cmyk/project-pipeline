// Script tạo tài khoản admin đầu tiên
// Chạy: tsx prisma/create-admin.ts --email admin@example.com --password yourpassword

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");
  const passIdx = args.indexOf("--password");
  const nameIdx = args.indexOf("--name");

  const email = emailIdx !== -1 ? args[emailIdx + 1] : null;
  const password = passIdx !== -1 ? args[passIdx + 1] : null;
  const name = nameIdx !== -1 ? args[nameIdx + 1] : "Admin";

  if (!email || !password) {
    console.error("Usage: tsx prisma/create-admin.ts --email <email> --password <password> [--name <name>]");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password phải có ít nhất 8 ký tự.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Cập nhật thành admin nếu đã tồn tại
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashed, role: "admin", name, emailVerified: new Date() },
    });
    console.log(`✅ Đã cập nhật tài khoản admin: ${email}`);
  } else {
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "admin",
        emailVerified: new Date(),
      },
    });
    console.log(`✅ Đã tạo tài khoản admin: ${email}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
