"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import styles from "./page.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", className: "badge-warning" },
  { value: "confirmed", label: "Confirmado", className: "badge-success" },
  { value: "shipped", label: "En camino", className: "badge-silver" },
  { value: "delivered", label: "Entregado", className: "badge-success" },
  { value: "cancelled", label: "Cancelado", className: "badge-danger" },
];

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "💵 Efectivo",
  transferencia: "🏦 Transferencia",
  tarjeta: "💳 Tarjeta",
};

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, any>>({});

  const fetchOrders = async () => {
    setLoading(true);
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: number, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast("Estado actualizado ✅", "success");
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    }
  };

  const loadDetail = async (orderId: number) => {
    if (orderDetails[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }
    const res = await fetch(`/api/orders/${orderId}`);
    const data = await res.json();
    setOrderDetails((prev) => ({ ...prev, [orderId]: data }));
    setExpandedOrder(orderId);
  };

  const filtered = filterStatus ? orders.filter((o) => o.status === filterStatus) : orders;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Pedidos ({orders.length})</h2>
        <div className={styles.filters}>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "180px" }}
            id="admin-orders-filter"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <span style={{ fontSize: "3rem" }}>📭</span>
          <p>No hay pedidos</p>
        </div>
      ) : (
        <div className={styles.ordersList} id="admin-orders-table">
          {filtered.map((order) => {
            const status = STATUS_OPTIONS.find((s) => s.value === order.status);
            return (
              <div key={order.id} className={styles.orderCard} id={`admin-order-${order.id}`}>
                <div className={styles.orderRow} onClick={() => loadDetail(order.id)}>
                  <div className={styles.orderId}>
                    <span className={styles.orderNum}>#{order.id}</span>
                    <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString("es-AR")}</span>
                  </div>
                  <div className={styles.orderCustomer}>
                    <span className={styles.customerName}>{order.customer_name || order.user_name}</span>
                    <span className={styles.customerContact}>
                      {order.customer_email} · {order.customer_phone}
                    </span>
                  </div>
                  <div className={styles.orderPayment}>
                    {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  </div>
                  <div className={styles.orderTotal}>{formatPrice(order.total)}</div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <select
                      className={`form-select ${styles.statusSelect}`}
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      id={`order-status-${order.id}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: expandedOrder === order.id ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0, color: "var(--gray-dark)" }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>

                {expandedOrder === order.id && orderDetails[order.id] && (
                  <div className={styles.orderDetail}>
                    <div className={styles.detailGrid}>
                      <div>
                        <p className={styles.detailLabel}>Dirección de entrega</p>
                        <p className={styles.detailValue}>{orderDetails[order.id].order?.shipping_address}</p>
                      </div>
                      {orderDetails[order.id].order?.notes && (
                        <div>
                          <p className={styles.detailLabel}>Notas</p>
                          <p className={styles.detailValue}>{orderDetails[order.id].order.notes}</p>
                        </div>
                      )}
                    </div>
                    <table className={styles.itemsTable}>
                      <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {orderDetails[order.id].items?.map((item: any) => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{formatPrice(item.product_price)}</td>
                            <td>{item.quantity}</td>
                            <td><strong>{formatPrice(item.subtotal)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <a
                      href={`https://wa.me/543518792797?text=Hola!%20Sobre%20el%20pedido%20%23${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: "0.5rem" }}
                    >
                      💬 Contactar cliente por WhatsApp
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
