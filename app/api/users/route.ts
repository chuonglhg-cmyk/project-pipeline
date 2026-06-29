export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users - danh sách user (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true,
      createdAt: true, emailVerified: true,
      password: false, // không trả về password hash
      inviteTokens: {
        where: { used: false },
        select: { expiresAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      hasPassword: true, // đã filter ở trên
      pendingInvite: u.inviteTokens[0] || null,
      inviteTokens: undefined,
    }))
  );
}
