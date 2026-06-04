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
    const sortBy = searchParams.get("sortBy");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    let whereClause = "WHERE p.active = 1";
    const params: (string | number)[] = [];

    if (category) { 
      whereClause += " AND p.id IN (SELECT product_id FROM product_categories pc JOIN categories c ON pc.category_id = c.id WHERE c.slug = ?)"; 
      params.push(category); 
    }
    if (brand) {
      whereClause += " AND (p.brand_id IN (SELECT id FROM brands WHERE slug = ?) OR p.brand = ?)";
      params.push(brand, brand);
    }
    if (search) { whereClause += " AND (p.name LIKE ? OR p.description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (minPrice) { whereClause += " AND p.price >= ?"; params.push(parseFloat(minPrice)); }
    if (maxPrice) { whereClause += " AND p.price <= ?"; params.push(parseFloat(maxPrice)); }
    if (featured === "true") { whereClause += " AND p.featured = 1"; }

    const countRs = await db.execute({ 
      sql: `SELECT COUNT(*) as total FROM products p ${whereClause}`, 
      args: params 
    });
    const total = countRs.rows[0]?.total ? Number(countRs.rows[0].total) : 0;

    let orderByClause = "ORDER BY p.featured DESC, p.id DESC";
    if (sortBy === "price_asc") {
      orderByClause = "ORDER BY p.price ASC";
    } else if (sortBy === "price_desc") {
      orderByClause = "ORDER BY p.price DESC";
    }

    const query = `
      SELECT p.*, 
             GROUP_CONCAT(c.name, ', ') as category_names,
             GROUP_CONCAT(c.id, ',') as category_ids
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}
      GROUP BY p.id
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limit, offset];

    const productsRs = await db.execute({ sql: query, args: queryParams });
    const categoriesRs = await db.execute("SELECT * FROM categories ORDER BY name");
    const brandsRs = await db.execute("SELECT * FROM brands ORDER BY name");

    return NextResponse.json({
      products: productsRs.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: categoriesRs.rows,
      brands: brandsRs.rows,
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
      brand, brand_id, stock, image_url, images, featured, 
      weight, flavor, flavors, servings 
    } = body;

    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")   // strip accents
      .replace(/[^a-z0-9\s-]/g, "")      // remove special chars
      .trim()
      .replace(/\s+/g, "-")              // spaces → dashes
      .replace(/-+/g, "-");              // collapse multiple dashes
    const uniqueSuffix = Date.now().toString(36).slice(-4); // e.g. "k3f2"
    const slug = `${baseSlug}-${uniqueSuffix}`;
    
    let brandName = brand || "Cellpure";
    let finalBrandId = brand_id ? Number(brand_id) : null;
    if (finalBrandId) {
      const bRs = await db.execute({
        sql: "SELECT name FROM brands WHERE id = ?",
        args: [finalBrandId]
      });
      if (bRs.rows[0]?.name) {
        brandName = String(bRs.rows[0].name);
      }
    } else if (brand) {
      const bRs = await db.execute({
        sql: "SELECT id FROM brands WHERE name = ?",
        args: [brand]
      });
      if (bRs.rows[0]?.id) {
        finalBrandId = Number(bRs.rows[0].id);
        brandName = brand;
      }
    }

    // Inserción transacción (o secuencial simple)
    const result = await db.execute({
      sql: `
        INSERT INTO products (name, slug, description, price, original_price, brand, brand_id, stock, image_url, images, featured, weight, flavor, flavors, servings)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        name, slug, description, price, original_price || null, 
        brandName, finalBrandId, stock, image_url, JSON.stringify(images || []), 
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
