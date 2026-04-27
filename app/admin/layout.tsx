"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./admin.module.css";

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/products?limit=1").then(r => r.json()),
      fetch("/api/admin/users").then(r => r.json()),
    ]).then(([orders, products, users]) => {
      const orderList = orders.orders || [];
      setStats({
        totalOrders: orderList.length,
        pendingOrders: orderList.filter((o: any) => o.status === "pending").length,
        totalRevenue: orderList.reduce((s: number, o: any) => s + o.total, 0),
        totalProducts: products.total || 0,
        totalUsers: (users.users || []).length,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>PANEL ADMIN</span>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={styles.navItem} id="admin-nav-dash">📊 Dashboard</Link>
          <Link href="/admin/products" className={styles.navItem} id="admin-nav-products">📦 Productos</Link>
          <Link href="/admin/categories" className={styles.navItem} id="admin-nav-categories">🏷️ Categorías</Link>
          <Link href="/admin/orders" className={styles.navItem} id="admin-nav-orders">🛒 Pedidos</Link>
          <Link href="/admin/users" className={styles.navItem} id="admin-nav-users">👥 Usuarios</Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink}>← Volver a la tienda</Link>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>

        {/* Stats bar */}
        {stats && (
          <div className={styles.statsBar}>
            {[
              { label: "Pedidos", value: stats.totalOrders, icon: "🛒" },
              { label: "Pendientes", value: stats.pendingOrders, icon: "⏳" },
              { label: "Facturado", value: formatPrice(stats.totalRevenue), icon: "💰" },
              { label: "Productos", value: stats.totalProducts, icon: "📦" },
              { label: "Usuarios", value: stats.totalUsers, icon: "👥" },
            ].map((s) => (
              <div key={s.label} className={styles.statCard}>
                <span className={styles.statIcon}>{s.icon}</span>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
