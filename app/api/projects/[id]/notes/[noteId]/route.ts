export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/:id/notes/:noteId - edit note content
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const body = await req.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Nội dung ghi chú không được để trống." }, { status: 400 });
  }

  const note = await prisma.note.update({
    where: { id: params.noteId },
    data: { content: content.trim() },
  });

  return NextResponse.json(note);
}

// DELETE /api/projects/:id/notes/:noteId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  await prisma.note.delete({ where: { id: params.noteId } });
  return NextResponse.json({ ok: true });
}
