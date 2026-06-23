export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/projects/:id/contacts/:contactId
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  const body = await req.json();
  const { name, phone, email, position, isPrimary, note } = body;

  if (isPrimary) {
    await prisma.contact.updateMany({
      where: { projectId: params.id, isPrimary: true, NOT: { id: params.contactId } },
      data: { isPrimary: false },
    });
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone || null;
  if (email !== undefined) data.email = email || null;
  if (position !== undefined) data.position = position || null;
  if (isPrimary !== undefined) data.isPrimary = !!isPrimary;
  if (note !== undefined) data.note = note || null;

  const contact = await prisma.contact.update({
    where: { id: params.contactId },
    data,
  });

  return NextResponse.json(contact);
}

// DELETE /api/projects/:id/contacts/:contactId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  await prisma.contact.delete({ where: { id: params.contactId } });
  return NextResponse.json({ ok: true });
}
