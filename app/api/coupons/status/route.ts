import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ used: false, loggedIn: false });
  }

  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get("code") || "BIENVENIDO").toUpperCase();

    const db = getDb();
    const rs = await db.execute({
      sql: "SELECT id FROM coupon_redemptions WHERE user_id = ? AND coupon_code = ?",
      args: [session.userId, code],
    });

    return NextResponse.json({
      used: rs.rows.length > 0,
      loggedIn: true,
    });
  } catch (error) {
    console.error("[coupon status]", error);
    return NextResponse.json({ used: false, loggedIn: true });
  }
}
