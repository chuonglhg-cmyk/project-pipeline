export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATUS_LIST } from "@/lib/status";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { contacts: true },
    orderBy: { updatedAt: "desc" },
  });

  const total = projects.length;

  const byStatus: Record<string, number> = {};
  for (const s of STATUS_LIST) byStatus[s] = 0;
  for (const p of projects) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  }

  const signedCount = projects.filter((p) => p.status === "Ký hợp đồng").length;

  // Dự án đang cần follow-up: chưa kết thúc (status !== End)
  const followUp = projects
    .filter((p) => p.status !== "End")
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
    .slice(0, 10);

  // Dự án chưa có bước kế tiếp
  const noNextStep = projects.filter(
    (p) => !p.nextStep || p.nextStep.trim() === ""
  );

  return NextResponse.json({
    total,
    byStatus,
    signedCount,
    followUp,
    noNextStep,
  });
}
