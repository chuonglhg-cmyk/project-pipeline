export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/auth/setup-password?token=xxx — kiểm tra token còn hiệu lực không
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token không hợp lệ." }, { status: 400 });
  }

  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "Token không tồn tại." }, { status: 404 });
  }
  if (invite.used) {
    return NextResponse.json({ error: "Token đã được sử dụng." }, { status: 410 });
  }
  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: "Token đã hết hạn." }, { status: 410 });
  }

  return NextResponse.json({ ok: true, email: invite.email });
}

// POST /api/auth/setup-password — đặt password mới
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "Thiếu thông tin." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Mật khẩu phải có ít nhất 8 ký tự." },
      { status: 400 }
    );
  }

  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite || invite.used || new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "Token không hợp lệ hoặc đã hết hạn." },
      { status: 410 }
    );
  }

  // Hash password và update user
  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: invite.email },
    data: {
      password: hashed,
      emailVerified: new Date(),
    },
  });

  // Đánh dấu token đã dùng
  await prisma.inviteToken.update({
    where: { token },
    data: { used: true },
  });

  return NextResponse.json({ ok: true });
}
