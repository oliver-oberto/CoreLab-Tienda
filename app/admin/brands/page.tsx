"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import styles from "./page.module.css";

export default function AdminBrandsPage() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", logo_url: "", active: true });
  const [saving, setSaving] = useState(false);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      setBrands(data.brands || []);
    } catch (error) {
      showToast("Error al cargar marcas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", description: "", logo_url: "", active: true });
    setShowModal(true);
  };

  const openEdit = (brand: any) => {
    setEditingId(brand.id);
    setForm({ 
      name: brand.name, 
      description: brand.description || "", 
      logo_url: brand.logo_url || "", 
      active: brand.active === 1 || brand.active === true 
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/brands/${editingId}` : "/api/brands";
    const method = editingId ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        showToast(editingId ? "Marca actualizada ✅" : "Marca creada ✅", "success");
        setShowModal(false);
        fetchBrands();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al guardar la marca", "error");
      }
    } catch (error) {
      showToast("Error de red al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar la marca "${name}"? Los productos asociados se mantendrán pero se desvincularán de esta marca.`)) return;
    try {
      const res = await fetch(`/api/brands/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Marca eliminada", "info");
        fetchBrands();
      } else {
        showToast("Error al eliminar la marca", "error");
      }
    } catch (error) {
      showToast("Error de red al eliminar", "error");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gestión de Marcas</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva marca</button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className={styles.grid}>
          {brands.map((b) => (
            <div key={b.id} className={`${styles.card} ${b.active === 0 ? styles.inactiveCard : ""}`}>
              <div className={styles.cardLogo}>
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className={styles.logoImg} onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                    (e.target as HTMLImageElement).style.display = "none";
                  }} />
                ) : null}
                <span className={styles.fallbackIcon}>🏅</span>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>
                  {b.name} {!b.active && <span className={styles.inactiveBadge}>Inactiva</span>}
                </span>
                <span className={styles.cardDesc}>{b.description || "Sin descripción"}</span>
                <span className={styles.cardSlug}>slug: {b.slug}</span>
              </div>
              <div className={styles.cardActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id, b.name)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? "Editar Marca" : "Nueva Marca"}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input 
                  className="form-input" 
                  value={form.name} 
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
                  required 
                  placeholder="Ej: Cellpure"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción</label>
                <input 
                  className="form-input" 
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                  placeholder="Ej: Suplementos Premium"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Logo (URL de imagen)</label>
                <input 
                  className="form-input" 
                  value={form.logo_url} 
                  onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} 
                  placeholder="https://..."
                />
              </div>
              <div className="form-group-checkbox" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input 
                  type="checkbox"
                  id="active"
                  checked={form.active} 
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} 
                />
                <label htmlFor="active" className="form-label" style={{ margin: 0, cursor: "pointer" }}>Marca Activa (Mostrar en tienda)</label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
