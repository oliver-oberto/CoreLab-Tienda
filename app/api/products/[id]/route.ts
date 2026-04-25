import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getDb();
    const productRs = await db.execute({
      sql: `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.active = 1
      `,
      args: [id]
    });
    
    if (productRs.rows.length === 0) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    const product = productRs.rows[0];

    const relatedRs = await db.execute({
      sql: `
        SELECT p.* FROM products p
        WHERE p.category_id = (SELECT category_id FROM products WHERE id = ?)
          AND p.id != ? AND p.active = 1
        LIMIT 4
      `,
      args: [id, id]
    });

    return NextResponse.json({ product, related: relatedRs.rows });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    const body = await req.json();
    const { name, description, price, original_price, category_id, brand, stock, image_url, images, featured, weight, flavor, servings, active } = body;

    await db.execute({
      sql: `
        UPDATE products SET
          name = ?, description = ?, price = ?, original_price = ?,
          category_id = ?, brand = ?, stock = ?, image_url = ?, images = ?,
          featured = ?, weight = ?, flavor = ?, servings = ?, active = ?
        WHERE id = ?
      `,
      args: [name, description, price, original_price || null, category_id, brand, stock, image_url, JSON.stringify(images || []), featured ? 1 : 0, weight || null, flavor || null, servings || null, active !== false ? 1 : 0, id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    await db.execute({
      sql: "UPDATE products SET active = 0 WHERE id = ?",
      args: [id]
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
