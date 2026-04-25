import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = getDb();
  const orderRs = await db.execute({
    sql: "SELECT * FROM orders WHERE id = ?",
    args: [id]
  });
  
  const order = orderRs.rows[0];
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (session.role !== "admin" && order.user_id !== session.userId)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const itemsRs = await db.execute({
    sql: "SELECT * FROM order_items WHERE order_id = ?",
    args: [id]
  });
  
  return NextResponse.json({ order, items: itemsRs.rows });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { status } = await req.json();
  const db = getDb();
  await db.execute({
    sql: "UPDATE orders SET status = ? WHERE id = ?",
    args: [status, id]
  });
  return NextResponse.json({ success: true });
}
