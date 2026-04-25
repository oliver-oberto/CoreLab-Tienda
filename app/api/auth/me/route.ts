import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import getDb from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const db = getDb();
  const userRs = await db.execute({
    sql: "SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?",
    args: [session.userId]
  });

  return NextResponse.json({ user: userRs.rows[0] || null });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, phone, address } = await req.json();
  const db = getDb();
  await db.execute({
    sql: "UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?",
    args: [name, phone, address, session.userId]
  });
  return NextResponse.json({ success: true });
}
