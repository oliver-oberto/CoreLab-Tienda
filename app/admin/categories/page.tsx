"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import styles from "./page.module.css";

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", icon: "📦", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", icon: "📦", description: "" });
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon, description: cat.description || "" });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
    const method = editingId ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    
    setSaving(false);
    if (res.ok) {
      showToast(editingId ? "Categoría actualizada ✅" : "Categoría creada ✅", "success");
      setShowModal(false);
      fetchCategories();
    } else {
      const data = await res.json();
      showToast(data.error || "Error al guardar la categoría", "error");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar la categoría "${name}"? Esto afectará a los productos que la usen.`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Categoría eliminada", "info");
      fetchCategories();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Gestión de Categorías</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva categoría</button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className={styles.grid}>
          {categories.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardIcon}>{c.icon}</div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{c.name}</span>
                <span className={styles.cardDesc}>{c.description || "Sin descripción"}</span>
                <span className={styles.cardSlug}>slug: {c.slug}</span>
              </div>
              <div className={styles.cardActions}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? "Editar Categoría" : "Nueva Categoría"}</h3>
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
                  placeholder="Ej: Proteínas"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción corta (Home)</label>
                <input 
                  className="form-input" 
                  value={form.description} 
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                  placeholder="Ej: Whey, Caseína, Vegana"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Icono (Emoji)</label>
                <input 
                  className="form-input" 
                  value={form.icon} 
                  onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} 
                  placeholder="💊, 🥛, ⚡..."
                />
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
