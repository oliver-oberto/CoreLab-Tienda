import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = getDb();
    const { customer_name, customer_email, customer_phone, shipping_address, payment_method, notes } = await req.json();

    const cartItems = db.prepare(`
      SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock
      FROM cart_items ci JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `).all(session.userId) as any[];

    if (!cartItems.length) return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });

    const total = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address, payment_method, total, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(session.userId, customer_name, customer_email, customer_phone, shipping_address, payment_method, total, notes || null);

    const orderId = orderResult.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    cartItems.forEach((item: any) => {
      insertItem.run(orderId, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity);
      updateStock.run(item.quantity, item.product_id);
    });

    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(session.userId);

    return NextResponse.json({ success: true, orderId, total });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al procesar el pedido" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = getDb();

  if (session.role === "admin") {
    const orders = db.prepare(`
      SELECT o.*, u.name as user_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `).all();
    return NextResponse.json({ orders });
  }

  const orders = db.prepare(`
    SELECT o.id, o.status, o.total, o.payment_method, o.created_at
    FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC
  `).all(session.userId);

  return NextResponse.json({ orders });
}
