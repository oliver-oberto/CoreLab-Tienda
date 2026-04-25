import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = getDb();
    const { customer_name, customer_email, customer_phone, shipping_address, payment_method, notes } = await req.json();

    const cartRs = await db.execute({
      sql: `
        SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `,
      args: [session.userId]
    });
    
    const cartItems = cartRs.rows;

    if (!cartItems.length) return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });

    const total = cartItems.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);

    const orderResult = await db.execute({
      sql: `
        INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, shipping_address, payment_method, total, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [session.userId, customer_name, customer_email, customer_phone, shipping_address, payment_method, total, notes || null]
    });

    const orderId = orderResult.lastInsertRowid ? orderResult.lastInsertRowid.toString() : null;

    for (const item of cartItems) {
      await db.execute({
        sql: `
          INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [orderId, item.product_id, item.name, item.price, item.quantity, Number(item.price) * Number(item.quantity)]
      });

      await db.execute({
        sql: "UPDATE products SET stock = stock - ? WHERE id = ?",
        args: [item.quantity, item.product_id]
      });
    }

    await db.execute({
      sql: "DELETE FROM cart_items WHERE user_id = ?",
      args: [session.userId]
    });

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
    const ordersRs = await db.execute(`
      SELECT o.*, u.name as user_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    return NextResponse.json({ orders: ordersRs.rows });
  }

  const ordersRs = await db.execute({
    sql: `
      SELECT o.id, o.status, o.total, o.payment_method, o.created_at
      FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC
    `,
    args: [session.userId]
  });

  return NextResponse.json({ orders: ordersRs.rows });
}
