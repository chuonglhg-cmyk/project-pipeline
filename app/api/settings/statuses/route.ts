export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_STATUSES } from "@/lib/status";

// GET /api/settings/statuses
export async function GET() {
  try {
    let statuses = await prisma.statusConfig.findMany({
      orderBy: { order: "asc" },
    });

    // Lần đầu chưa có → seed mặc định
    if (statuses.length === 0) {
      await prisma.statusConfig.createMany({
        data: DEFAULT_STATUSES.map((s) => ({
          name: s.name,
          nextStep: s.nextStep ?? null,
          color: s.color,
          order: s.order,
          isContractSigned: s.isContractSigned,
        })),
        skipDuplicates: true,
      });
      statuses = await prisma.statusConfig.findMany({ orderBy: { order: "asc" } });
    }

    return NextResponse.json(statuses);
  } catch (err: any) {
    console.error("GET /api/settings/statuses error:", err);
    // Trả về mặc định nếu bảng chưa tạo (chưa migrate)
    return NextResponse.json(
      DEFAULT_STATUSES.map((s, i) => ({ ...s, id: `default-${i}`, createdAt: new Date(), updatedAt: new Date() }))
    );
  }
}

// POST /api/settings/statuses
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, nextStep, color, order, isContractSigned } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Tên trạng thái không được để trống." }, { status: 400 });
    }

    // Lấy order lớn nhất
    const maxOrder = await prisma.statusConfig.aggregate({ _max: { order: true } });
    const newOrder = order !== undefined ? order : (maxOrder._max.order ?? -1) + 1;

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
    console.error("POST /api/settings/statuses error:", e);
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Tên trạng thái này đã tồn tại, vui lòng chọn tên khác." }, { status: 409 });
    }
    return NextResponse.json({ error: `Lỗi server: ${e.message}` }, { status: 500 });
  }
}
