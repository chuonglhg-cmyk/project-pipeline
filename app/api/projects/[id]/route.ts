export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuggestedNextStep } from "@/lib/status";

// GET /api/projects/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Không tìm thấy dự án" }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PATCH /api/projects/:id - update project fields
// Body can include: companyName, projectName, status, nextStep,
// firstContactDate, contractSignedAt
//
// Logic bước kế tiếp:
// - Nếu request thay đổi `status` và KHÔNG đồng thời gửi `nextStep`,
//   hệ thống sẽ tự động set nextStep theo bảng quy tắc (NEXT_STEP_MAP).
// - Nếu request gửi kèm `nextStep` (kể cả rỗng), giá trị đó được dùng
//   theo ý người dùng (cho phép chỉnh tay).
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const existing = await prisma.project.findUnique({ where: { id: params.id } });

  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy dự án" }, { status: 404 });
  }

  const data: any = {};

  if (body.companyName !== undefined) data.companyName = body.companyName;
  if (body.projectName !== undefined) data.projectName = body.projectName;

  if (body.firstContactDate !== undefined) {
    data.firstContactDate = body.firstContactDate
      ? new Date(body.firstContactDate)
      : existing.firstContactDate;
  }

  if (body.contractSignedAt !== undefined) {
    data.contractSignedAt = body.contractSignedAt
      ? new Date(body.contractSignedAt)
      : null;
  }

  const statusChanged =
    body.status !== undefined && body.status !== existing.status;

  if (body.status !== undefined) {
    data.status = body.status;
  }

  if (body.nextStep !== undefined) {
    // User explicitly set nextStep manually -> respect it.
    data.nextStep = body.nextStep === "" ? null : body.nextStep;
  } else if (statusChanged) {
    // Status changed but nextStep not provided -> auto-suggest.
    data.nextStep = getSuggestedNextStep(body.status);
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(project);
}

// DELETE /api/projects/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
