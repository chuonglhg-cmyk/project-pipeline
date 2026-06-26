export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/settings/statuses/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, nextStep, color, order, isContractSigned } = body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (nextStep !== undefined) data.nextStep = nextStep?.trim() || null;
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;
    if (isContractSigned !== undefined) data.isContractSigned = !!isContractSigned;

    const updated = await prisma.statusConfig.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/settings/statuses/:id error:", e);
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Tên trạng thái đã tồn tại." }, { status: 409 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Không tìm thấy trạng thái." }, { status: 404 });
    }
    return NextResponse.json({ error: `Lỗi server: ${e.message}` }, { status: 500 });
  }
}

// DELETE /api/settings/statuses/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const status = await prisma.statusConfig.findUnique({ where: { id: params.id } });
    if (!status) {
      return NextResponse.json({ error: "Không tìm thấy trạng thái." }, { status: 404 });
    }

    const usageCount = await prisma.project.count({ where: { status: status.name } });
    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Không thể xóa: có ${usageCount} dự án đang dùng trạng thái "${status.name}".` },
        { status: 409 }
      );
    }

    await prisma.statusConfig.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/settings/statuses/:id error:", e);
    return NextResponse.json({ error: `Lỗi server: ${e.message}` }, { status: 500 });
  }
}
