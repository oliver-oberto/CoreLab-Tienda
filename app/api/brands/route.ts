import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const db = getDb();
    const rs = await db.execute("SELECT * FROM brands ORDER BY name");
    return NextResponse.json({ brands: rs.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener marcas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    const { name, description, logo_url, active } = await req.json();

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const activeVal = active !== undefined ? (active ? 1 : 0) : 1;

    const result = await db.execute({
      sql: "INSERT INTO brands (name, slug, description, logo_url, active) VALUES (?, ?, ?, ?, ?)",
      args: [name, slug, description || "", logo_url || "", activeVal]
    });

    return NextResponse.json({ 
      success: true, 
      brand: { 
        id: result.lastInsertRowid?.toString(), 
        name, 
        slug, 
        description: description || "",
        logo_url: logo_url || "",
        active: activeVal
      } 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear la marca (quizás ya existe)" }, { status: 500 });
  }
}
