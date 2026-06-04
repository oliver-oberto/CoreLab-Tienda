import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { quantity } = await req.json();
  const db = getDb();

  if (quantity <= 0) {
    await db.execute({
      sql: "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
      args: [id, session.userId]
    });
  } else {
    await db.execute({
      sql: "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
      args: [quantity, id, session.userId]
    });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = getDb();
  await db.execute({
    sql: "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
    args: [id, session.userId]
  });
  return NextResponse.json({ success: true });
}
