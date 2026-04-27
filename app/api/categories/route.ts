import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const rs = await db.execute("SELECT * FROM categories ORDER BY name");
    return NextResponse.json({ categories: rs.rows });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    const { name, icon, description } = await req.json();

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const result = await db.execute({
      sql: "INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)",
      args: [name, slug, icon || "💊", description || ""]
    });

    return NextResponse.json({ 
      success: true, 
      category: { 
        id: result.lastInsertRowid?.toString(), 
        name, 
        slug, 
        icon: icon || "💊",
        description: description || ""
      } 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear la categoría (quizás ya existe)" }, { status: 500 });
  }
}
