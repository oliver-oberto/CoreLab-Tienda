"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import styles from "./page.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "badge-warning" },
  confirmed: { label: "Confirmado", className: "badge-success" },
  shipped: { label: "En camino", className: "badge-silver" },
  delivered: { label: "Entregado", className: "badge-success" },
  cancelled: { label: "Cancelado", className: "badge-danger" },
};

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");
  const [editForm, setEditForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, any>>({});

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name, phone: user.phone || "", address: user.address || "" });
    }
    // Check hash
    if (window.location.hash === "#orders") setActiveTab("orders");
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetch("/api/orders").then(r => r.json()).then(d => setOrders(d.orders || []));
    }
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    if (res.ok) {
      await refreshUser();
      showToast("Perfil actualizado correctamente ✅", "success");
    } else {
      showToast("Error al actualizar el perfil", "error");
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    if (orderDetails[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    setOrderDetails(prev => ({ ...prev, [orderId]: data }));
    setExpandedOrder(orderId);
  };

  if (!user) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <h1 className={styles.title}>{user.name}</h1>
            <p className={styles.email}>{user.email}</p>
            {user.role === "admin" && (
              <Link href="/admin" className="badge badge-silver" style={{ marginTop: "0.5rem", display: "inline-flex" }}>Admin</Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === "profile" ? styles.tabActive : ""}`} onClick={() => setActiveTab("profile")} id="tab-profile">👤 Mi perfil</button>
          <button className={`${styles.tab} ${activeTab === "orders" ? styles.tabActive : ""}`} onClick={() => setActiveTab("orders")} id="tab-orders">📦 Mis pedidos</button>
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className={styles.tabContent}>
            <form onSubmit={handleSaveProfile} className={styles.profileForm} id="profile-form">
              <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Información personal</h2>
                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-name">Nombre completo</label>
                    <input id="p-name" className="form-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-phone">Teléfono</label>
                    <input id="p-phone" className="form-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="351 555-0000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-email">Email</label>
                    <input id="p-email" className="form-input" value={user.email} disabled style={{ opacity: 0.5 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-address">Dirección de entrega</label>
                    <input id="p-address" className="form-input" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="Av. Colón 1234, Córdoba" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-profile-btn">
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders tab */}
        {activeTab === "orders" && (
          <div className={styles.tabContent}>
            {orders.length === 0 ? (
              <div className={styles.emptyOrders}>
                <span style={{ fontSize: "3rem" }}>📦</span>
                <h3>Todavía no hiciste ningún pedido</h3>
                <Link href="/products" className="btn btn-primary">Ir a la tienda</Link>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map((order: any) => {
                  const status = STATUS_LABELS[order.status] || { label: order.status, className: "badge-silver" };
                  return (
                    <div key={order.id} className={styles.orderCard} id={`order-${order.id}`}>
                      <div className={styles.orderHeader} onClick={() => loadOrderDetail(order.id)}>
                        <div className={styles.orderInfo}>
                          <span className={styles.orderId}>Pedido #{order.id}</span>
                          <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                        </div>
                        <div className={styles.orderMeta}>
                          <span className={`badge ${status.className}`}>{status.label}</span>
                          <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedOrder === order.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </div>
                      </div>
                      {expandedOrder === order.id && orderDetails[order.id] && (
                        <div className={styles.orderDetail}>
                          {orderDetails[order.id].items?.map((item: any) => (
                            <div key={item.id} className={styles.orderItem}>
                              <span>{item.product_name}</span>
                              <span style={{ color: "var(--gray-dark)" }}>×{item.quantity}</span>
                              <span>{formatPrice(item.subtotal)}</span>
                            </div>
                          ))}
                          <div className={styles.orderItemTotal}>
                            <span>Total pagado</span>
                            <strong>{formatPrice(order.total)}</strong>
                          </div>
                          <div className={styles.orderPayMethod}>
                            Método de pago: <strong>{order.payment_method}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
