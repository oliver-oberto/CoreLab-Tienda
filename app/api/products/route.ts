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

    let whereClause = "WHERE p.active = 1";
    const params: (string | number)[] = [];

    if (category) { 
      whereClause += " AND p.id IN (SELECT product_id FROM product_categories pc JOIN categories c ON pc.category_id = c.id WHERE c.slug = ?)"; 
      params.push(category); 
    }
    if (brand) { whereClause += " AND p.brand = ?"; params.push(brand); }
    if (search) { whereClause += " AND (p.name LIKE ? OR p.description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (minPrice) { whereClause += " AND p.price >= ?"; params.push(parseFloat(minPrice)); }
    if (maxPrice) { whereClause += " AND p.price <= ?"; params.push(parseFloat(maxPrice)); }
    if (featured === "true") { whereClause += " AND p.featured = 1"; }

    const countRs = await db.execute({ 
      sql: `SELECT COUNT(*) as total FROM products p ${whereClause}`, 
      args: params 
    });
    const total = countRs.rows[0]?.total ? Number(countRs.rows[0].total) : 0;

    const query = `
      SELECT p.*, 
             GROUP_CONCAT(c.name, ', ') as category_names,
             GROUP_CONCAT(c.id, ',') as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.featured DESC, p.id DESC 
      LIMIT ? OFFSET ?
    `;
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
    const { 
      name, description, price, original_price, category_ids, 
      brand, stock, image_url, images, featured, 
      weight, flavor, flavors, servings 
    } = body;

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Inserción transacción (o secuencial simple)
    const result = await db.execute({
      sql: `
        INSERT INTO products (name, slug, description, price, original_price, brand, stock, image_url, images, featured, weight, flavor, flavors, servings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        name, slug, description, price, original_price || null, 
        brand || "Cellpure", stock, image_url, JSON.stringify(images || []), 
        featured ? 1 : 0, weight || null, flavor || null, 
        JSON.stringify(flavors || []), servings || null
      ]
    });

    const productId = result.lastInsertRowid;
    
    // Insertar categorías
    if (productId && Array.isArray(category_ids)) {
      for (const catId of category_ids) {
        await db.execute({
          sql: "INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)",
          args: [productId, catId]
        });
      }
    }

    return NextResponse.json({ success: true, id: productId ? productId.toString() : null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
