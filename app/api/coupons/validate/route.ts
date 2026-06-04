import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

const COUPON_CONFIG = {
  BIENVENIDO: {
    discount: 0.1,
    maxPrice: 45000,
    description: "10% de descuento en productos hasta $45.000",
  },
} as const;

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json(
      {
        valid: false,
        reason: "Debés iniciar sesión para usar este cupón",
        requiresLogin: true,
      },
      { status: 200 }
    );
  }

  try {
    const body = await req.json();
    const { code, cartItems } = body as {
      code: string;
      cartItems: { productId: string | number; price: number }[];
    };

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, reason: "Código inválido" });
    }

    const normalizedCode = code.trim().toUpperCase();
    const couponConfig = COUPON_CONFIG[normalizedCode as keyof typeof COUPON_CONFIG];

    if (!couponConfig) {
      return NextResponse.json({
        valid: false,
        reason: "El código ingresado no existe",
      });
    }

    // Verificar uso previo en DB
    const db = getDb();
    const redemptionRs = await db.execute({
      sql: "SELECT id FROM coupon_redemptions WHERE user_id = ? AND coupon_code = ?",
      args: [session.userId, normalizedCode],
    });

    if (redemptionRs.rows.length > 0) {
      return NextResponse.json({
        valid: false,
        reason: "Este cupón ya fue utilizado en una compra anterior",
      });
    }

    // Verificar restricción de precio
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({
        valid: false,
        reason: "El carrito está vacío",
      });
    }

    const hasExpensiveItem = cartItems.some(
      (item) => Number(item.price) > couponConfig.maxPrice
    );

    if (hasExpensiveItem) {
      return NextResponse.json({
        valid: false,
        reason: `Este cupón solo aplica si todos los productos son hasta $${couponConfig.maxPrice.toLocaleString("es-AR")}`,
      });
    }

    // Calcular descuento sobre el total del carrito
    const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
    const discountAmount = Math.round(cartTotal * couponConfig.discount);

    return NextResponse.json({
      valid: true,
      discount: couponConfig.discount,
      discountAmount,
      code: normalizedCode,
    });
  } catch (error) {
    console.error("[validate coupon]", error);
    return NextResponse.json(
      { valid: false, reason: "Error interno al validar el cupón" },
      { status: 500 }
    );
  }
}
