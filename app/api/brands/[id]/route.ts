import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    await db.execute({
      sql: "UPDATE brands SET name = ?, slug = ?, description = ?, logo_url = ?, active = ? WHERE id = ?",
      args: [name, slug, description || "", logo_url || "", activeVal, id]
    });

    // También actualizamos el campo de texto de marca en los productos asociados para mantener consistencia
    await db.execute({
      sql: "UPDATE products SET brand = ? WHERE brand_id = ?",
      args: [name, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar la marca" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    
    // Primero, desvinculamos la marca de los productos
    await db.execute({
      sql: "UPDATE products SET brand_id = NULL WHERE brand_id = ?",
      args: [id]
    });

    // Luego borramos la marca
    await db.execute({
      sql: "DELETE FROM brands WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar la marca" }, { status: 500 });
  }
}
