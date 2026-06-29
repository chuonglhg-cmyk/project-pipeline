export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";

// POST /api/auth/invite
// Admin tạo tài khoản cho user mới và gửi email mời tạo password
export async function POST(req: NextRequest) {
  // Chỉ admin mới được tạo tài khoản
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Không có quyền thực hiện." }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, role = "user" } = body;

  if (!email || !email.trim()) {
    return NextResponse.json({ error: "Email không được để trống." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Tạo user nếu chưa tồn tại
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.password) {
      return NextResponse.json(
        { error: "Email này đã có tài khoản và đã thiết lập mật khẩu." },
        { status: 409 }
      );
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name?.trim() || null,
          role: role === "admin" ? "admin" : "user",
        },
      });
    }

    // Xóa token cũ chưa dùng của email này
    await prisma.inviteToken.deleteMany({
      where: { email: normalizedEmail, used: false },
    });

    // Tạo invite token mới (hiệu lực 24h)
    const invite = await prisma.inviteToken.create({
      data: {
        email: normalizedEmail,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Gửi email
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`;
    await sendInviteEmail({
      to: normalizedEmail,
      name: name?.trim(),
      token: invite.token,
      baseUrl,
    });

    return NextResponse.json({ ok: true, email: normalizedEmail });
  } catch (e: any) {
    console.error("Invite error:", e);
    return NextResponse.json({ error: `Lỗi: ${e.message}` }, { status: 500 });
  }
}
