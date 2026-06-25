export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/projects/:id/contacts - add a new contact
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { name, phone, email, position, isPrimary, note } = body;

  if (!name) {
    return NextResponse.json({ error: "Tên người liên hệ là bắt buộc." }, { status: 400 });
  }

  // If marking this contact as primary, unset other primaries first.
  if (isPrimary) {
    await prisma.contact.updateMany({
      where: { projectId: params.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contact.create({
    data: {
      projectId: params.id,
      name,
      phone: phone || null,
      email: email || null,
      position: position || null,
      isPrimary: !!isPrimary,
      note: note || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
