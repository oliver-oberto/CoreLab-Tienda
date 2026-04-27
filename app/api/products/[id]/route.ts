import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = getDb();
    const productRs = await db.execute({
      sql: `
        SELECT p.*, 
               GROUP_CONCAT(c.name, ', ') as category_names,
               GROUP_CONCAT(c.id, ',') as category_ids,
               GROUP_CONCAT(c.slug, ',') as category_slugs
        FROM products p
        LEFT JOIN product_categories pc ON p.id = pc.product_id
        LEFT JOIN categories c ON pc.category_id = c.id
        WHERE p.id = ? AND p.active = 1
        GROUP BY p.id
      `,
      args: [id]
    });
    
    if (productRs.rows.length === 0) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    const product = productRs.rows[0];

    const relatedRs = await db.execute({
      sql: `
        SELECT p.* FROM products p
        JOIN product_categories pc ON p.id = pc.product_id
        WHERE pc.category_id IN (SELECT category_id FROM product_categories WHERE product_id = ?)
          AND p.id != ? AND p.active = 1
        GROUP BY p.id
        LIMIT 4
      `,
      args: [id, id]
    });

    return NextResponse.json({ product, related: relatedRs.rows });
  } catch (error) {
    console.error(error);
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
    const { 
      name, description, price, original_price, category_ids, 
      brand, stock, image_url, images, featured, 
      weight, flavor, flavors, servings, active 
    } = body;

    await db.execute({
      sql: `
        UPDATE products SET
          name = ?, description = ?, price = ?, original_price = ?,
          brand = ?, stock = ?, image_url = ?, images = ?,
          featured = ?, weight = ?, flavor = ?, flavors = ?, servings = ?, active = ?
        WHERE id = ?
      `,
      args: [
        name, description, price, original_price || null, 
        brand, stock, image_url, JSON.stringify(images || []), 
        featured ? 1 : 0, weight || null, flavor || null,
        JSON.stringify(flavors || []), servings || null, 
        active !== false ? 1 : 0, id
      ]
    });

    // Actualizar categorías: Borrar y re-insertar
    await db.execute({ sql: "DELETE FROM product_categories WHERE product_id = ?", args: [id] });
    if (Array.isArray(category_ids)) {
      for (const catId of category_ids) {
        await db.execute({
          sql: "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)",
          args: [id, catId]
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
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
