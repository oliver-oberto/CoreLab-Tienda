import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import getDb from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?")
    .get(session.userId) as any;

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, phone, address } = await req.json();
  const db = getDb();
  db.prepare("UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?").run(
    name, phone, address, session.userId
  );
  return NextResponse.json({ success: true });
}
