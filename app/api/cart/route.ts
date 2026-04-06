import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [] });

  const db = getDb();
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(session.userId);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { product_id, quantity = 1 } = await req.json();
  const db = getDb();

  const product = db.prepare("SELECT id, stock FROM products WHERE id = ? AND active = 1").get(product_id) as { id: number; stock: number } | undefined;
  if (!product) return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });

  const existing = db.prepare("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?").get(session.userId, product_id) as { id: number; quantity: number } | undefined;

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, product.stock);
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(newQty, existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)").run(session.userId, product_id, Math.min(quantity, product.stock));
  }

  return NextResponse.json({ success: true });
}
