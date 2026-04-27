"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import styles from "./page.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

const EMPTY_FORM = {
  name: "", description: "", price: "", original_price: "",
  category_ids: [], brand: "Cellpure", stock: "", image_url: "",
  weight: "", flavor: "", flavors_input: "", servings: "", featured: false, active: true,
};

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", icon: "📦" });
  const [savingCat, setSavingCat] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/products?limit=50${search ? `&search=${search}` : ""}`);
    const data = await res.json();
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [search]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
      brand: product.brand, stock: product.stock, image_url: product.image_url || "",
      weight: product.weight || "", 
      flavor: product.flavor || "", 
      flavors_input: flavors.join(", "),
      servings: product.servings || "",
      featured: product.featured === 1, active: product.active === 1,
      images: images.join("\n"),
    });
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
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <input className="form-input" value={form.brand} onChange={e => setForm((p: any) => ({ ...p, brand: e.target.value }))} />
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
                  <input className="form-input" value={form.image_url} onChange={e => setForm((p: any) => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
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
              {products.map((p) => (
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
