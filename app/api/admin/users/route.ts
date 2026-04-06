import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const db = getDb();
  const users = db.prepare("SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC").all();
  return NextResponse.json({ users });
}
