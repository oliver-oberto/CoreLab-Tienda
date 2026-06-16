"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import styles from "./page.module.css";

// Convierte URLs de páginas de hosting a la URL directa de la imagen
function resolveImageUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    // vvrl.cc: https://vvrl.cc/es/isw980 → https://vvrl.cc/api/image/isw980/view
    if (u.hostname === "vvrl.cc") {
      const parts = u.pathname.split("/").filter(Boolean);
      // /es/isw980 → parts = ["es", "isw980"] OR /en/image/isw980 → ["en","image","isw980"]
      const id = parts[parts.length - 1];
      if (id && !id.startsWith("image") && !id.startsWith("api")) {
        return `https://vvrl.cc/api/image/${id}/view`;
      }
    }
    // Agregar acá otros hostings si es necesario
  } catch { /* URL inválida, devolver tal cual */ }
  return url;
}

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

const EMPTY_FORM = {
  name: "", description: "", price: "", original_price: "",
  category_ids: [], brand: "Cellpure", brand_id: "", stock: "", image_url: "",
  weight: "", flavor: "", flavors_input: "", servings: "", featured: false, active: true,
};

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterFeatured, setFilterFeatured] = useState("all");
  // Preview de imagen principal
  const [imagePreviewStatus, setImagePreviewStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  const filteredProducts = products.filter((p) => {
    if (filterCategory && !String(p.category_ids || "").split(",").includes(String(filterCategory))) return false;
    if (filterActive === "active" && p.active !== 1) return false;
    if (filterActive === "inactive" && p.active === 1) return false;
    if (filterStock === "instock" && p.stock <= 0) return false;
    if (filterStock === "nostock" && p.stock > 0) return false;
    if (filterFeatured === "yes" && p.featured !== 1) return false;
    if (filterFeatured === "no" && p.featured === 1) return false;
    return true;
  });

  const activeFiltersCount = [
    filterCategory !== "",
    filterActive !== "all",
    filterStock !== "all",
    filterFeatured !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCategory("");
    setFilterActive("all");
    setFilterStock("all");
    setFilterFeatured("all");
  };

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", icon: "📦" });
  const [savingCat, setSavingCat] = useState(false);

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: "", description: "", logo_url: "" });
  const [savingBrand, setSavingBrand] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/products?admin=true&limit=200${search ? `&search=${search}` : ""}`);
    const data = await res.json();
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setBrands(data.brands || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreviewStatus("idle");
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    const images = (() => { try { return JSON.parse(product.images || "[]"); } catch { return []; } })();
    const flavors = (() => { try { return JSON.parse(product.flavors || "[]"); } catch { return []; } })();
    const categoryIds = product.category_ids ? product.category_ids.split(",").map(Number) : [];
    
    setForm({
      name: product.name, description: product.description, price: product.price,
      original_price: product.original_price || "", 
      category_ids: categoryIds,
      brand: product.brand || "",
      brand_id: product.brand_id || "",
      stock: product.stock, image_url: product.image_url || "",
      weight: product.weight || "", 
      flavor: product.flavor || "", 
      flavors_input: flavors.join(", "),
      servings: product.servings || "",
      featured: product.featured === 1, active: product.active === 1,
      images: images.join("\n"),
    });
    setImagePreviewStatus(product.image_url ? "loading" : "idle");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const images = form.images ? form.images.split("\n").filter(Boolean) : [];
    const flavors = form.flavors_input 
      ? form.flavors_input.split(",").map((s: string) => s.trim()).filter(Boolean) 
      : [];

    const body = {
      ...form,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock: parseInt(form.stock),
      servings: form.servings ? parseInt(form.servings) : null,
      category_ids: form.category_ids,
      brand_id: form.brand_id ? parseInt(form.brand_id) : null,
      flavors,
      images,
    };
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) {
      showToast(editingId ? "Producto actualizado ✅" : "Producto creado ✅", "success");
      setShowForm(false);
      fetchData();
    } else {
      showToast("Error al guardar el producto", "error");
    }
  };

  const handleCatToggle = (id: number) => {
    setForm((p: any) => {
      const current = p.category_ids || [];
      if (current.includes(id)) {
        return { ...p, category_ids: current.filter((x: number) => x !== id) };
      } else {
        return { ...p, category_ids: [...current, id] };
      }
    });
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    setSavingCat(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm)
    });
    const data = await res.json();
    setSavingCat(false);
    if (res.ok) {
      setCategories(prev => [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name)));
      handleCatToggle(data.category.id);
      setShowCatModal(false);
      setCatForm({ name: "", icon: "📦" });
      showToast("Categoría creada ✅", "success");
    } else {
      showToast(data.error || "Error al crear categoría", "error");
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name) return;
    setSavingBrand(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brandForm)
      });
      const data = await res.json();
      if (res.ok) {
        setBrands(prev => [...prev, data.brand].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((p: any) => ({ ...p, brand_id: data.brand.id, brand: data.brand.name }));
        setShowBrandModal(false);
        setBrandForm({ name: "", description: "", logo_url: "" });
        showToast("Marca creada ✅", "success");
      } else {
        showToast(data.error || "Error al crear marca", "error");
      }
    } catch (err) {
      showToast("Error al crear marca", "error");
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Producto eliminado", "info");
      fetchData();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Productos</h2>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Buscar producto..."
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "220px" }}
            id="admin-products-search"
          />
          <button className="btn btn-primary" onClick={openNew} id="admin-new-product-btn">+ Nuevo producto</button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterBarLeft}>
          <span className={styles.filterLabel}>Filtrar:</span>

          {/* Category */}
          <select
            className={styles.filterSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            id="admin-filter-category"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          {/* Active */}
          <select
            className={styles.filterSelect}
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            id="admin-filter-active"
          >
            <option value="all">Activo / Inactivo</option>
            <option value="active">✅ Solo activos</option>
            <option value="inactive">🚫 Solo inactivos</option>
          </select>

          {/* Stock */}
          <select
            className={styles.filterSelect}
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            id="admin-filter-stock"
          >
            <option value="all">Con / Sin stock</option>
            <option value="instock">📦 Con stock</option>
            <option value="nostock">⚠️ Sin stock</option>
          </select>

          {/* Featured */}
          <select
            className={styles.filterSelect}
            value={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.value)}
            id="admin-filter-featured"
          >
            <option value="all">Destacados / No</option>
            <option value="yes">⭐ Solo destacados</option>
            <option value="no">— No destacados</option>
          </select>
        </div>

        <div className={styles.filterBarRight}>
          <span className={styles.filterCount}>
            {filteredProducts.length} de {products.length} productos
          </span>
          {activeFiltersCount > 0 && (
            <button className={styles.clearFiltersBtn} onClick={clearFilters} id="admin-clear-filters">
              ✕ Limpiar ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h3>{editingId ? "Editar producto" : "Nuevo producto"}</h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)} id="close-product-form">✕</button>
            </div>
            <form onSubmit={handleSave} className={styles.form} id="product-form">
              <div className={styles.formGrid}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Nombre *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} required placeholder="Whey Protein Chocolate" />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Descripción *</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} required rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input type="number" className="form-input" value={form.price} onChange={e => setForm((p: any) => ({ ...p, price: e.target.value }))} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio original (tachado)</label>
                  <input type="number" className="form-input" value={form.original_price} onChange={e => setForm((p: any) => ({ ...p, original_price: e.target.value }))} min="0" placeholder="Opcional" />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label">Categorías *</label>
                    <button type="button" className="btn-text btn-sm" onClick={() => setShowCatModal(true)} style={{ fontSize: '0.7rem', color: 'var(--primary-blue)', fontWeight: 600 }}>+ Nueva categoría</button>
                  </div>
                  <div className={styles.categoriesGrid}>
                    {categories.map((c: any) => (
                      <label key={c.id} className={styles.categoryItem}>
                        <input 
                          type="checkbox" 
                          checked={(form.category_ids || []).includes(c.id)}
                          onChange={() => handleCatToggle(c.id)}
                        />
                        <span>{c.icon} {c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label">Marca</label>
                    <button type="button" className="btn-text btn-sm" onClick={() => setShowBrandModal(true)} style={{ fontSize: '0.7rem', color: 'var(--primary-blue)', fontWeight: 600 }}>+ Nueva marca</button>
                  </div>
                  <select
                    className="form-input"
                    value={form.brand_id}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const selectedBrand = brands.find((b: any) => String(b.id) === selectedId);
                      setForm((p: any) => ({ ...p, brand_id: selectedId, brand: selectedBrand?.name || "" }));
                    }}
                    id="form-brand"
                  >
                    <option value="">— Seleccionar marca —</option>
                    {brands.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Total *</label>
                  <input type="number" className="form-input" value={form.stock} onChange={e => setForm((p: any) => ({ ...p, stock: e.target.value }))} required min="0" />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Sabores (separados por coma)</label>
                  <input 
                    className="form-input" 
                    value={form.flavors_input} 
                    onChange={e => setForm((p: any) => ({ ...p, flavors_input: e.target.value }))} 
                    placeholder="Chocolate, Vainilla, Frutilla..." 
                  />
                  <p style={{ fontSize: '0.7rem', color: 'var(--gray-dark)', marginTop: '0.25rem' }}>Si completás esto, el cliente podrá elegir el sabor al comprar.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Peso / Cantidad</label>
                  <input className="form-input" value={form.weight} onChange={e => setForm((p: any) => ({ ...p, weight: e.target.value }))} placeholder="907g, 300g..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Porciones</label>
                  <input type="number" className="form-input" value={form.servings} onChange={e => setForm((p: any) => ({ ...p, servings: e.target.value }))} placeholder="30" />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">URL imagen principal</label>
                  <input
                    className="form-input"
                    value={form.image_url}
                    onChange={e => {
                      const raw = e.target.value;
                      const resolved = resolveImageUrl(raw.trim());
                      // Si la URL fue resuelta (transformada) avisar y usar la resuelta
                      if (resolved !== raw.trim() && raw.trim()) {
                        showToast(`URL convertida automáticamente a enlace directo ✅`, "success");
                      }
                      setForm((p: any) => ({ ...p, image_url: resolved || raw }));
                      setImagePreviewStatus(resolved ? "loading" : "idle");
                    }}
                    placeholder="https://... (pegá cualquier URL de imagen)"
                    id="form-image-url"
                  />
                  {/* Preview en tiempo real */}
                  {form.image_url && form.image_url.startsWith("http") && (
                    <div style={{
                      marginTop: "0.6rem",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: imagePreviewStatus === "error" ? "2px solid #e53e3e" : imagePreviewStatus === "ok" ? "2px solid #38a169" : "2px solid var(--border)",
                      background: "var(--surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "120px",
                      maxHeight: "200px",
                      position: "relative",
                    }}>
                      {imagePreviewStatus === "loading" && (
                        <span style={{ color: "var(--gray-dark)", fontSize: "0.8rem" }}>Cargando preview...</span>
                      )}
                      {imagePreviewStatus === "error" && (
                        <div style={{ textAlign: "center", padding: "1rem" }}>
                          <div style={{ fontSize: "1.5rem" }}>⚠️</div>
                          <p style={{ color: "#e53e3e", fontSize: "0.75rem", margin: "0.3rem 0 0" }}>
                            No se puede mostrar esta imagen. Verificá que la URL sea un enlace directo a la imagen.
                          </p>
                        </div>
                      )}
                      <img
                        src={form.image_url}
                        alt="preview"
                        style={{
                          maxHeight: "196px",
                          maxWidth: "100%",
                          objectFit: "contain",
                          display: imagePreviewStatus === "ok" ? "block" : "none",
                        }}
                        onLoad={() => setImagePreviewStatus("ok")}
                        onError={() => setImagePreviewStatus("error")}
                      />
                      {imagePreviewStatus === "ok" && (
                        <span style={{
                          position: "absolute", top: 6, right: 8,
                          background: "#38a169", color: "#fff",
                          fontSize: "0.65rem", padding: "2px 7px", borderRadius: "99px", fontWeight: 700
                        }}>✓ OK</span>
                      )}
                    </div>
                  )}
                  <p style={{ fontSize: "0.7rem", color: "var(--gray-dark)", marginTop: "0.3rem" }}>
                    Podés pegar cualquier URL. Las URLs de <b>vvrl.cc</b> se convierten automáticamente.
                  </p>
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">URLs de galería (una por línea)</label>
                  <textarea className="form-textarea" value={form.images} onChange={e => setForm((p: any) => ({ ...p, images: e.target.value }))} rows={3} placeholder={"https://imagen1.jpg\nhttps://imagen2.jpg"} />
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.featured} onChange={e => setForm((p: any) => ({ ...p, featured: e.target.checked }))} id="form-featured" />
                    <span className="form-label" style={{ marginBottom: 0 }}>Producto destacado</span>
                  </label>
                </div>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.active} onChange={e => setForm((p: any) => ({ ...p, active: e.target.checked }))} id="form-active" />
                    <span className="form-label" style={{ marginBottom: 0 }}>Activo (visible en tienda)</span>
                  </label>
                </div>
              </div>
              <div className={styles.formActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-product-btn">
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className={styles.formOverlay} style={{ zIndex: 300 }}>
          <div className={`${styles.formModal} ${styles.modalSmall}`}>
            <div className={styles.formHeader}>
              <h3>Nueva categoría</h3>
              <button className={styles.closeBtn} onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCat} className={styles.form}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Nombre de categoría</label>
                <input 
                  className="form-input" 
                  value={catForm.name} 
                  onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} 
                  required 
                  placeholder="Ej: Proteínas, Creatinas..."
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Ícono (Emoji)</label>
                <input 
                  className="form-input" 
                  value={catForm.icon} 
                  onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))} 
                  placeholder="💊, 🥛, ⚡..."
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--gray-dark)', marginTop: '0.4rem' }}>
                  Apretá <b>Win + .</b> (punto) para elegir un emoji.
                </p>
              </div>
              <div className={styles.formActions} style={{ justifyContent: 'stretch' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCatModal(false)} style={{ flex: 1, minWidth: '100px' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingCat} style={{ flex: 2, minWidth: '140px' }}>
                  {savingCat ? "Creando..." : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {showBrandModal && (
        <div className={styles.formOverlay} style={{ zIndex: 300 }}>
          <div className={`${styles.formModal} ${styles.modalSmall}`}>
            <div className={styles.formHeader}>
              <h3>Nueva marca</h3>
              <button className={styles.closeBtn} onClick={() => setShowBrandModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBrand} className={styles.form}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Nombre de la marca</label>
                <input
                  className="form-input"
                  value={brandForm.name}
                  onChange={e => setBrandForm(p => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Ej: Cellpure, Ultra Tech..."
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Descripción (opcional)</label>
                <input
                  className="form-input"
                  value={brandForm.description}
                  onChange={e => setBrandForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Ej: Suplementos Premium"
                />
              </div>
              <div className={styles.formActions} style={{ justifyContent: 'stretch' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowBrandModal(false)} style={{ flex: 1, minWidth: '100px' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={savingBrand} style={{ flex: 2, minWidth: '140px' }}>
                  {savingBrand ? "Creando..." : "Crear marca"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table} id="admin-products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    <span>🔍 Ningún producto coincide con los filtros activos.</span>
                    <button className={styles.clearFiltersBtn} onClick={clearFilters}>Limpiar filtros</button>
                  </td>
                </tr>
              ) : filteredProducts.map((p) => (
                <tr key={p.id} id={`admin-row-${p.id}`}>
                  <td>
                    <div className={styles.productCell}>
                      <span className={styles.productName}>{p.name}</span>
                      <span className={styles.productBrand}>{p.brand}</span>
                    </div>
                  </td>
                  <td className={styles.gray}>
                    {p.category_icon} {p.category_name || "—"}
                  </td>
                  <td>
                    <div>
                      <div className={styles.priceVal}>{formatPrice(p.price)}</div>
                      {p.original_price && <div className={styles.priceOrig}>{formatPrice(p.original_price)}</div>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.stock > 0 ? "badge-success" : "badge-danger"}`}>
                      {p.stock} ud.
                    </span>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      {p.featured === 1 && <span className="badge badge-silver">⭐ Dest.</span>}
                      <span className={`badge ${p.active === 1 ? "badge-success" : "badge-danger"}`}>
                        {p.active === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} id={`edit-product-${p.id}`}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.name)} id={`delete-product-${p.id}`}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
