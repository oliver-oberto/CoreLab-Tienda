import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

const COUPON_CONFIG = {
  BIENVENIDO: { discount: 0.1, maxPrice: 45000 },
} as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = getDb();
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      payment_method,
      notes,
      couponCode: rawCouponCode,
    } = await req.json();

    // Leer items del carrito desde la DB (fuente de verdad — no confiar en el frontend)
    const cartRs = await db.execute({
      sql: `
        SELECT ci.id as cart_item_id, ci.quantity, ci.selected_flavor,
               p.id as product_id, p.name, p.price, p.stock
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
      `,
      args: [session.userId],
    });

    const cartItems = cartRs.rows;
    if (!cartItems.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    // ── Validar cupón server-side ──────────────────────────────────────────
    let validatedCouponCode: string | null = null;
    let discountAmount = 0;

    if (rawCouponCode) {
      const normalizedCode = String(rawCouponCode).trim().toUpperCase();
      const couponConfig = COUPON_CONFIG[normalizedCode as keyof typeof COUPON_CONFIG];

      if (couponConfig) {
        // Re-verificar que no fue ya usado
        const redemptionRs = await db.execute({
          sql: "SELECT id FROM coupon_redemptions WHERE user_id = ? AND coupon_code = ?",
          args: [session.userId, normalizedCode],
        });

        const allItemsEligible = cartItems.every(
          (item: any) => Number(item.price) <= couponConfig.maxPrice
        );

        if (redemptionRs.rows.length === 0 && allItemsEligible) {
          validatedCouponCode = normalizedCode;
          discountAmount = Math.round(subtotal * couponConfig.discount);
        }
        // Si no cumple condiciones, simplemente ignoramos el cupón sin error
        // (la validación real ocurrió en /api/coupons/validate)
      }
    }

    const finalTotal = subtotal - discountAmount;

    // ── Transacción atómica: orden + items + stock + cupón ─────────────────
    const tx = await db.transaction("write");
    try {
      // 1. Crear la orden
      const orderResult = await tx.execute({
        sql: `
          INSERT INTO orders (user_id, customer_name, customer_email, customer_phone,
                              shipping_address, payment_method, total, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          session.userId,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          payment_method,
          finalTotal,
          notes || null,
        ],
      });

      const orderId = Number(orderResult.lastInsertRowid);

      // 2. Insertar items de la orden y descontar stock
      for (const item of cartItems) {
        await tx.execute({
          sql: `
            INSERT INTO order_items
              (order_id, product_id, product_name, product_price, quantity, subtotal, selected_flavor)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            orderId,
            item.product_id,
            item.name,
            item.price,
            item.quantity,
            Number(item.price) * Number(item.quantity),
            item.selected_flavor || null,
          ],
        });

        await tx.execute({
          sql: "UPDATE products SET stock = stock - ? WHERE id = ?",
          args: [item.quantity, item.product_id],
        });
      }

      // 3. Marcar cupón como usado (atómico con la orden)
      if (validatedCouponCode) {
        await tx.execute({
          sql: `
            INSERT INTO coupon_redemptions (user_id, coupon_code, order_id)
            VALUES (?, ?, ?)
          `,
          args: [session.userId, validatedCouponCode, orderId],
        });
      }

      // 4. Limpiar carrito
      await tx.execute({
        sql: "DELETE FROM cart_items WHERE user_id = ?",
        args: [session.userId],
      });

      await tx.commit();

      return NextResponse.json({
        success: true,
        orderId,
        total: finalTotal,
        discountApplied: discountAmount > 0 ? discountAmount : null,
      });
    } catch (txError) {
      await tx.rollback();
      throw txError;
    }
  } catch (error) {
    console.error("[POST /api/orders]", error);
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
    args: [session.userId],
  });

  return NextResponse.json({ orders: ordersRs.rows });
}
