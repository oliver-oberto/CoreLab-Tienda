"use client";
import Link from "next/link";
import styles from "./page.module.css";

export default function AdminDashboard() {
  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Panel de Administración</h2>
      <p className={styles.subtitle}>Bienvenido al panel de control de CoreLab Suplementos</p>

      <div className={styles.cards}>
        <Link href="/admin/products" className={styles.card} id="admin-dash-products">
          <span className={styles.cardIcon}>📦</span>
          <h3 className={styles.cardTitle}>Gestionar Productos</h3>
          <p className={styles.cardDesc}>Agregar, editar y eliminar productos del catálogo</p>
        </Link>
        <Link href="/admin/orders" className={styles.card} id="admin-dash-orders">
          <span className={styles.cardIcon}>🛒</span>
          <h3 className={styles.cardTitle}>Ver Pedidos</h3>
          <p className={styles.cardDesc}>Gestionar y actualizar el estado de los pedidos</p>
        </Link>
        <Link href="/admin/users" className={styles.card} id="admin-dash-users">
          <span className={styles.cardIcon}>👥</span>
          <h3 className={styles.cardTitle}>Usuarios</h3>
          <p className={styles.cardDesc}>Ver listado de clientes registrados</p>
        </Link>
      </div>
    </div>
  );
}
