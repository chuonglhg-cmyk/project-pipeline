export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetPasswordEmail } from "@/lib/email";

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // không tiết lộ email tồn tại hay không

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Luôn trả về ok dù email có tồn tại hay không (bảo mật)
  if (!user || !user.password) {
    return NextResponse.json({ ok: true });
  }

  // Xóa token cũ
  await prisma.inviteToken.deleteMany({
    where: { email: normalizedEmail, used: false },
  });

  // Tạo reset token (hiệu lực 1h)
  const invite = await prisma.inviteToken.create({
    data: {
      email: normalizedEmail,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`;
  await sendResetPasswordEmail({
    to: normalizedEmail,
    token: invite.token,
    baseUrl,
  });

  return NextResponse.json({ ok: true });
}
