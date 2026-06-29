export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/users/:id - cập nhật role/name
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.role !== undefined) data.role = body.role === "admin" ? "admin" : "user";

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}

// DELETE /api/users/:id - xóa user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  // Không cho xóa chính mình
  if ((session.user as any).id === params.id) {
    return NextResponse.json({ error: "Không thể xóa tài khoản của chính mình." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
