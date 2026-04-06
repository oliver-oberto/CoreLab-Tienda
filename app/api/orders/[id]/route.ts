import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (session.role !== "admin" && order.user_id !== session.userId)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
  return NextResponse.json({ order, items });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { status } = await req.json();
  const db = getDb();
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  return NextResponse.json({ success: true });
}
