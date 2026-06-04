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
    const { name, icon, description } = await req.json();

    if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const slug = name.toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.execute({
      sql: "UPDATE categories SET name = ?, slug = ?, icon = ?, description = ? WHERE id = ?",
      args: [name, slug, icon || "💊", description || "", id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar la categoría" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    
    // Verificar si hay productos que dependen de esta categoría?
    // Con product_categories ON DELETE CASCADE, se borrarán los vínculos.
    // Solo borramos la categoría.
    await db.execute({
      sql: "DELETE FROM categories WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar la categoría" }, { status: 500 });
  }
}
