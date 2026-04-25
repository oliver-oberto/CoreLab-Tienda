import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.active = 1
    `;
    const params: (string | number)[] = [];

    if (category) { query += " AND c.slug = ?"; params.push(category); }
    if (brand) { query += " AND p.brand = ?"; params.push(brand); }
    if (search) { query += " AND (p.name LIKE ? OR p.description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (minPrice) { query += " AND p.price >= ?"; params.push(parseFloat(minPrice)); }
    if (maxPrice) { query += " AND p.price <= ?"; params.push(parseFloat(maxPrice)); }
    if (featured === "true") { query += " AND p.featured = 1"; }

    const countQuery = query.replace("SELECT p.*, c.name as category_name, c.slug as category_slug", "SELECT COUNT(*) as total");
    const countRs = await db.execute({ sql: countQuery, args: params });
    const total = countRs.rows[0]?.total ? Number(countRs.rows[0].total) : 0;

    query += " ORDER BY p.featured DESC, p.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const productsRs = await db.execute({ sql: query, args: params });
    const categoriesRs = await db.execute("SELECT * FROM categories ORDER BY name");

    return NextResponse.json({
      products: productsRs.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: categoriesRs.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const db = getDb();
    const body = await req.json();
    const { name, description, price, original_price, category_id, brand, stock, image_url, images, featured, weight, flavor, servings } = body;

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const result = await db.execute({
      sql: `
        INSERT INTO products (name, slug, description, price, original_price, category_id, brand, stock, image_url, images, featured, weight, flavor, servings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [name, slug, description, price, original_price || null, category_id, brand || "Cellpure", stock, image_url, JSON.stringify(images || []), featured ? 1 : 0, weight || null, flavor || null, servings || null]
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid ? result.lastInsertRowid.toString() : null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
