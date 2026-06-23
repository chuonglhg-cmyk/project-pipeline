export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/projects/:id/notes - add a new note
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Nội dung ghi chú không được để trống." }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      projectId: params.id,
      content: content.trim(),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
