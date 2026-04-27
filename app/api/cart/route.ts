import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] });

  const db = getDb();
  const itemsRs = await db.execute({
    sql: `
      SELECT ci.id, ci.quantity, ci.selected_flavor, p.id as product_id, p.name, p.price, p.image_url, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `,
    args: [session.userId]
  });

  return NextResponse.json({ items: itemsRs.rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { product_id, quantity = 1, selected_flavor = null } = await req.json();
  const db = getDb();

  const productRs = await db.execute({
    sql: "SELECT id, stock FROM products WHERE id = ? AND active = 1",
    args: [product_id]
  });
  
  const product = productRs.rows[0];
  if (!product) return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });

  // Buscar coincidencia exacta incluyendo sabor
  const existingRs = await db.execute({
    sql: `
      SELECT id, quantity FROM cart_items 
      WHERE user_id = ? AND product_id = ? 
      AND (selected_flavor = ? OR (selected_flavor IS NULL AND ? IS NULL))
    `,
    args: [session.userId, product_id, selected_flavor, selected_flavor]
  });
  
  const existing = existingRs.rows[0];

  if (existing) {
    const newQty = Math.min(Number(existing.quantity) + Number(quantity), Number(product.stock));
    await db.execute({
      sql: "UPDATE cart_items SET quantity = ? WHERE id = ?",
      args: [newQty, existing.id]
    });
  } else {
    await db.execute({
      sql: "INSERT INTO cart_items (user_id, product_id, quantity, selected_flavor) VALUES (?, ?, ?, ?)",
      args: [session.userId, product_id, Math.min(Number(quantity), Number(product.stock)), selected_flavor]
    });
  }

  return NextResponse.json({ success: true });
}
