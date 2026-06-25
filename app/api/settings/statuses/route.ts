export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STATUSES } from "@/lib/status";

// GET /api/settings/statuses
// Trả về danh sách trạng thái đã cấu hình.
// Nếu chưa có trong DB (lần đầu), tự động seed từ DEFAULT_STATUSES.
export async function GET() {
  let statuses = await prisma.statusConfig.findMany({
    orderBy: { order: "asc" },
  });

  // Lần đầu chưa có → tự seed mặc định
  if (statuses.length === 0) {
    await prisma.statusConfig.createMany({
      data: DEFAULT_STATUSES.map((s) => ({
        name: s.name,
        nextStep: s.nextStep,
        color: s.color,
        order: s.order,
        isContractSigned: s.isContractSigned,
      })),
      skipDuplicates: true,
    });
    statuses = await prisma.statusConfig.findMany({ orderBy: { order: "asc" } });
  }

  return NextResponse.json(statuses);
}

// POST /api/settings/statuses - tạo trạng thái mới
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, nextStep, color, order, isContractSigned } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Tên trạng thái không được để trống." }, { status: 400 });
  }

  // Lấy order lớn nhất hiện tại nếu không truyền
  const maxOrder = await prisma.statusConfig.aggregate({ _max: { order: true } });
  const newOrder = order ?? (maxOrder._max.order ?? 0) + 1;

  try {
    const status = await prisma.statusConfig.create({
      data: {
        name: name.trim(),
        nextStep: nextStep?.trim() || null,
        color: color || "gray",
        order: newOrder,
        isContractSigned: !!isContractSigned,
      },
    });
    return NextResponse.json(status, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Tên trạng thái đã tồn tại." }, { status: 409 });
    }
    throw e;
  }
}
