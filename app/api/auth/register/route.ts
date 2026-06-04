import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "Campos requeridos incompletos" }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });

    const db = getDb();
    const existingRs = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email]
    });
    
    if (existingRs.rows[0])
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.execute({
      sql: "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      args: [name, email, hashedPassword, phone || null]
    });

    const token = await signToken({
      userId: Number(result.lastInsertRowid),
      email,
      name,
      role: "user",
    });

    const response = NextResponse.json({ success: true, name, email });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
