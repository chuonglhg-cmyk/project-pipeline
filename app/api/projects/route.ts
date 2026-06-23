import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSuggestedNextStep } from "@/lib/status";

// GET /api/projects?search=...&status=...&sortBy=...&sortDir=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const sortBy = searchParams.get("sortBy") || "updatedAt";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

  const allowedSort: Record<string, string> = {
    updatedAt: "updatedAt",
    firstContactDate: "firstContactDate",
    contractSignedAt: "contractSignedAt",
  };
  const orderField = allowedSort[sortBy] || "updatedAt";

  const where: any = {};
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { projectName: { contains: search, mode: "insensitive" } },
      {
        contacts: {
          some: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          },
        },
      },
    ];
  }

  const projects = await prisma.project.findMany({
    where,
    include: { contacts: true },
    orderBy: { [orderField]: sortDir },
  });

  return NextResponse.json(projects);
}

// POST /api/projects
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, projectName, status = "New", nextStep, firstContactDate, contractSignedAt } = body;

  if (!companyName || !projectName || !firstContactDate) {
    return NextResponse.json(
      { error: "companyName, projectName và firstContactDate là bắt buộc." },
      { status: 400 }
    );
  }

  const resolvedNextStep =
    nextStep !== undefined && nextStep !== null && nextStep !== ""
      ? nextStep
      : getSuggestedNextStep(status);

  const project = await prisma.project.create({
    data: {
      companyName,
      projectName,
      status,
      nextStep: resolvedNextStep,
      firstContactDate: new Date(firstContactDate),
      contractSignedAt: contractSignedAt ? new Date(contractSignedAt) : null,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
